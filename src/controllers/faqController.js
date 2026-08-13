const FAQ = require('../models/FAQ');
const asyncHandler = require('../helpers/asyncHandler');
const ApiError = require('../helpers/ApiError');
const logActivity = require('../helpers/logActivity');

// GET /api/faq (public)
const listFAQs = asyncHandler(async (req, res) => {
  const faqs = await FAQ.find().sort({ order: 1, createdAt: 1 });
  res.status(200).json({ success: true, data: faqs });
});

// POST /api/faq (auth)
const createFAQ = asyncHandler(async (req, res) => {
  const faq = await FAQ.create(req.body);
  await logActivity('faqs', 'created', `FAQ "${faq.question}" created`);
  res.status(201).json({ success: true, data: faq });
});

// PUT /api/faq/:id (auth)
const updateFAQ = asyncHandler(async (req, res) => {
  const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!faq) throw new ApiError(404, 'FAQ not found');

  await logActivity('faqs', 'updated', `FAQ "${faq.question}" updated`);
  res.status(200).json({ success: true, data: faq });
});

// DELETE /api/faq/:id (auth)
const deleteFAQ = asyncHandler(async (req, res) => {
  const faq = await FAQ.findByIdAndDelete(req.params.id);
  if (!faq) throw new ApiError(404, 'FAQ not found');

  await logActivity('faqs', 'deleted', `FAQ "${faq.question}" deleted`);
  res.status(200).json({ success: true, message: 'FAQ deleted' });
});

// PUT /api/faq/reorder (auth)
const reorderFAQs = asyncHandler(async (req, res) => {
  const { order } = req.body;

  await Promise.all(order.map((id, index) => FAQ.findByIdAndUpdate(id, { order: index })));

  await logActivity('faqs', 'updated', 'FAQs reordered');

  const faqs = await FAQ.find().sort({ order: 1 });
  res.status(200).json({ success: true, data: faqs });
});

module.exports = { listFAQs, createFAQ, updateFAQ, deleteFAQ, reorderFAQs };
