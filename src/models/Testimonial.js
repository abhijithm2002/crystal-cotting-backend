const mongoose = require('mongoose');

const TestimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, default: '' },
    image: { type: String, default: '' },
    initials: { type: String, default: '' },
    review: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    isFeatured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'testimonials' }
);

module.exports = mongoose.model('Testimonial', TestimonialSchema);
