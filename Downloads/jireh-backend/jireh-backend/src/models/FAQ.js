const mongoose = require('mongoose');

const FAQSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'faqs' }
);

module.exports = mongoose.model('FAQ', FAQSchema);
