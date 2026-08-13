const mongoose = require('mongoose');

const ContactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    service: { type: String, default: '' },
    message: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'contact_messages' }
);

ContactMessageSchema.index({ name: 'text', email: 'text', phone: 'text', message: 'text' });

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);
