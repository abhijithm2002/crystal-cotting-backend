const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
  {
    siteName: String,
    logo: String,
    logoWhite: String,
    favicon: String,
    footerText: String,
    themeColors: {
      primary: String,
      secondary: String,
      accent: String,
    },
    seo: {
      defaultTitle: String,
      defaultDescription: String,
      defaultKeywords: String,
      ogImage: String,
    },
  },
  { timestamps: true, collection: 'settings' }
);

module.exports = mongoose.model('Settings', SettingsSchema);
