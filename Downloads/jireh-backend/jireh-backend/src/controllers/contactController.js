const ContactPage = require('../models/ContactPage');
const ContactMessage = require('../models/ContactMessage');
const asyncHandler = require('../helpers/asyncHandler');
const ApiError = require('../helpers/ApiError');
const logActivity = require('../helpers/logActivity');
const { rowsToCsv } = require('../services/csvService');

// GET /api/contact (public)
const getContactPage = asyncHandler(async (req, res) => {
  const contact = await ContactPage.findOneAndUpdate({}, { $setOnInsert: {} }, { upsert: true, new: true });
  res.status(200).json({ success: true, data: contact });
});

// PUT /api/contact (auth)
const updateContactPage = asyncHandler(async (req, res) => {
  const contact = await ContactPage.findOneAndUpdate({}, { $set: req.body }, {
    upsert: true,
    new: true,
    runValidators: true,
  });

  await logActivity('contact_page', 'updated', 'Contact page content updated');
  res.status(200).json({ success: true, data: contact });
});

// POST /api/contact/messages (public) - visitor submits lead form
const createContactMessage = asyncHandler(async (req, res) => {
  const { name, phone, email, service, message } = req.body;
  const contactMessage = await ContactMessage.create({ name, phone, email, service, message });

  await logActivity('contact_messages', 'created', `New inquiry from "${name}"`);
  res.status(201).json({ success: true, data: contactMessage });
});

// GET /api/contact/messages (auth) - ?search=&read=&page=
const listContactMessages = asyncHandler(async (req, res) => {
  const { search, read, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (read === 'true') filter.isRead = true;
  if (read === 'false') filter.isRead = false;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } },
      { service: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.max(parseInt(limit, 10) || 20, 1);

  const [items, total] = await Promise.all([
    ContactMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize),
    ContactMessage.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    pagination: {
      page: pageNum,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  });
});

// GET /api/contact/messages/export (auth) - CSV download
const exportContactMessages = asyncHandler(async (req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();

  const csv = rowsToCsv(messages, [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'service', label: 'Service' },
    { key: 'message', label: 'Message' },
    { key: 'isRead', label: 'Read' },
    { key: 'createdAt', label: 'Received At' },
  ]);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="contact-messages.csv"');
  res.status(200).send(csv);
});

// PATCH /api/contact/messages/:id/read (auth) - toggle read
const toggleMessageRead = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findById(req.params.id);
  if (!message) throw new ApiError(404, 'Message not found');

  message.isRead = typeof req.body.isRead === 'boolean' ? req.body.isRead : !message.isRead;
  await message.save();

  res.status(200).json({ success: true, data: message });
});

// DELETE /api/contact/messages/:id (auth)
const deleteContactMessage = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!message) throw new ApiError(404, 'Message not found');

  res.status(200).json({ success: true, message: 'Message deleted' });
});

module.exports = {
  getContactPage,
  updateContactPage,
  createContactMessage,
  listContactMessages,
  exportContactMessages,
  toggleMessageRead,
  deleteContactMessage,
};
