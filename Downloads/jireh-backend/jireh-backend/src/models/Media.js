const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, default: '' },
    url: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    category: { type: String, default: 'uncategorized' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'media' }
);

MediaSchema.index({ originalName: 'text', filename: 'text' });

module.exports = mongoose.model('Media', MediaSchema);
