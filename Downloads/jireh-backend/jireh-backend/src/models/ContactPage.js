const mongoose = require('mongoose');

const SocialSchema = new mongoose.Schema({ label: String, href: String }, { _id: false });

const ContactPageSchema = new mongoose.Schema(
  {
    banner: String,
    intro: {
      eyebrow: String,
      title: String,
      text: String,
    },
    phone: String,
    phoneHref: String,
    whatsapp: String,
    whatsappHref: String,
    email: String,
    address: String,
    hours: String,
    mapQuery: String,
    mapEmbedUrl: String,
    socials: [SocialSchema],
  },
  { timestamps: true, collection: 'contact_page' }
);

module.exports = mongoose.model('ContactPage', ContactPageSchema);
