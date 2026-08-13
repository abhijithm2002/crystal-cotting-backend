const Testimonial = require('../models/Testimonial');
const asyncHandler = require('../helpers/asyncHandler');
const ApiError = require('../helpers/ApiError');
const logActivity = require('../helpers/logActivity');

// GET /api/testimonials (public) - ?featured=true
const listTestimonials = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.featured === 'true') filter.isFeatured = true;
  if (req.query.featured === 'false') filter.isFeatured = false;

  const testimonials = await Testimonial.find(filter).sort({ order: 1, createdAt: -1 });
  res.status(200).json({ success: true, data: testimonials });
});

// POST /api/testimonials (auth)
const createTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.create(req.body);
  await logActivity('testimonials', 'created', `Testimonial from "${testimonial.name}" created`);
  res.status(201).json({ success: true, data: testimonial });
});

// PUT /api/testimonials/:id (auth)
const updateTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!testimonial) throw new ApiError(404, 'Testimonial not found');

  await logActivity('testimonials', 'updated', `Testimonial from "${testimonial.name}" updated`);
  res.status(200).json({ success: true, data: testimonial });
});

// DELETE /api/testimonials/:id (auth)
const deleteTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
  if (!testimonial) throw new ApiError(404, 'Testimonial not found');

  await logActivity('testimonials', 'deleted', `Testimonial from "${testimonial.name}" deleted`);
  res.status(200).json({ success: true, message: 'Testimonial deleted' });
});

module.exports = { listTestimonials, createTestimonial, updateTestimonial, deleteTestimonial };
