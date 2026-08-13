const Service = require('../models/Service');
const asyncHandler = require('../helpers/asyncHandler');
const ApiError = require('../helpers/ApiError');
const logActivity = require('../helpers/logActivity');

// GET /api/services (public) - ?category=main|secondary&featured=true
const listServices = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.featured === 'true') filter.isFeatured = true;
  if (req.query.featured === 'false') filter.isFeatured = false;

  const services = await Service.find(filter).sort({ order: 1, createdAt: 1 });
  res.status(200).json({ success: true, data: services });
});

// GET /api/services/:id (public)
const getService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new ApiError(404, 'Service not found');
  res.status(200).json({ success: true, data: service });
});

// POST /api/services (auth)
const createService = asyncHandler(async (req, res) => {
  const service = await Service.create(req.body);
  await logActivity('services', 'created', `Service "${service.title}" created`);
  res.status(201).json({ success: true, data: service });
});

// PUT /api/services/:id (auth)
const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!service) throw new ApiError(404, 'Service not found');

  await logActivity('services', 'updated', `Service "${service.title}" updated`);
  res.status(200).json({ success: true, data: service });
});

// DELETE /api/services/:id (auth)
const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) throw new ApiError(404, 'Service not found');

  await logActivity('services', 'deleted', `Service "${service.title}" deleted`);
  res.status(200).json({ success: true, message: 'Service deleted' });
});

// PUT /api/services/reorder (auth) - { order: [id, ...] }
const reorderServices = asyncHandler(async (req, res) => {
  const { order } = req.body;

  await Promise.all(
    order.map((id, index) => Service.findByIdAndUpdate(id, { order: index }))
  );

  await logActivity('services', 'updated', 'Services reordered');

  const services = await Service.find().sort({ order: 1 });
  res.status(200).json({ success: true, data: services });
});

module.exports = { listServices, getService, createService, updateService, deleteService, reorderServices };
