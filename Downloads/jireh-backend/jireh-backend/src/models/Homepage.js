const mongoose = require('mongoose');

const ButtonSchema = new mongoose.Schema(
  { text: String, link: String, type: String },
  { _id: false }
);

const HeroStatSchema = new mongoose.Schema(
  { label: String, value: String, icon: String },
  { _id: false }
);

const StatSchema = new mongoose.Schema(
  { label: String, value: String, suffix: String },
  { _id: false }
);

const WhyChooseItemSchema = new mongoose.Schema(
  { title: String, text: String, icon: String },
  { _id: false }
);

const BeforeAfterItemSchema = new mongoose.Schema(
  {
    title: String,
    beforeLabel: String,
    afterLabel: String,
    beforeImage: String,
    afterImage: String,
  },
  { _id: false }
);

const SocialSchema = new mongoose.Schema({ label: String, href: String }, { _id: false });

const HomepageSchema = new mongoose.Schema(
  {
    hero: {
      backgroundImage: String,
      sideImage: String,
      eyebrow: String,
      badgeText: String,
      title: String,
      subtitle: String,
      buttons: [ButtonSchema],
      highlightTags: [String],
      floatingBadgeText: String,
      sideCaption: {
        title: String,
        text: String,
      },
    },
    heroStats: [HeroStatSchema],
    stats: [StatSchema],
    servicesIntro: {
      eyebrow: String,
      title: String,
      text: String,
      note: String,
    },
    whyChooseIntro: {
      eyebrow: String,
      title: String,
      text: String,
    },
    whyChoose: [WhyChooseItemSchema],
    premiumPromise: {
      eyebrow: String,
      title: String,
      text: String,
    },
    projectsIntro: {
      eyebrow: String,
      title: String,
      text: String,
    },
    beforeAfter: [BeforeAfterItemSchema],
    testimonialsIntro: {
      eyebrow: String,
      title: String,
      text: String,
    },
    footer: {
      description: String,
      phone: String,
      whatsapp: String,
      email: String,
      address: String,
      hours: String,
      socials: [SocialSchema],
    },
  },
  { timestamps: true, collection: 'homepage' }
);

module.exports = mongoose.model('Homepage', HomepageSchema);
