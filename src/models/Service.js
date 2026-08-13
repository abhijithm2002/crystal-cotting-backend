const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    banner: { type: String, default: '' },
    icon: { type: String, default: '' },
    accent: { type: String, default: '' },
    category: { type: String, enum: ['main', 'secondary'], default: 'main' },
    isFeatured: { type: Boolean, default: false },
    features: { type: [String], default: [] },
    gallery: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'services' }
);

ServiceSchema.index({ category: 1, order: 1 });

module.exports = mongoose.model('Service', ServiceSchema);
