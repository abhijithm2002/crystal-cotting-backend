const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, default: '' },
    location: { type: String, default: '' },
    completionDate: { type: String, default: '' },
    duration: { type: String, default: '' },
    description: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    images: { type: [String], default: [] },
    beforeImage: { type: String, default: '' },
    afterImage: { type: String, default: '' },
    materials: { type: [String], default: [] },
    services: { type: [String], default: [] },
    isFeatured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'portfolio' }
);

PortfolioSchema.index({ isFeatured: 1, order: 1 });

module.exports = mongoose.model('Portfolio', PortfolioSchema);
