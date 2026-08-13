const mongoose = require('mongoose');

const BlockSchema = new mongoose.Schema({ title: String, text: String, icon: String }, { _id: false });
const TeamImageSchema = new mongoose.Schema(
  { image: String, name: String, role: String },
  { _id: false }
);
const CertificateSchema = new mongoose.Schema({ image: String, title: String }, { _id: false });

const AboutPageSchema = new mongoose.Schema(
  {
    banner: String,
    companyImage: String,
    experienceCaption: {
      label: String,
      text: String,
    },
    intro: {
      eyebrow: String,
      title: String,
      description: String,
    },
    blocks: [BlockSchema],
    qualityChips: [String],
    teamImages: [TeamImageSchema],
    certificates: [CertificateSchema],
  },
  { timestamps: true, collection: 'about_page' }
);

module.exports = mongoose.model('AboutPage', AboutPageSchema);
