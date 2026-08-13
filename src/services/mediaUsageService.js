const Homepage = require('../models/Homepage');
const AboutPage = require('../models/AboutPage');
const Service = require('../models/Service');
const Portfolio = require('../models/Portfolio');
const Testimonial = require('../models/Testimonial');
const ContactPage = require('../models/ContactPage');
const Settings = require('../models/Settings');

/**
 * Scans every collection that can reference a Media url and reports where
 * it's used, so the admin dashboard can warn "this image is used in N
 * places" before letting someone delete/replace it.
 */
async function findMediaUsage(url) {
  if (!url) return [];
  const usages = [];

  // --- Homepage (singleton) ---
  const homepage = await Homepage.findOne();
  if (homepage) {
    if (homepage.hero && homepage.hero.backgroundImage === url) {
      usages.push({ collection: 'homepage', docId: homepage._id, field: 'hero.backgroundImage' });
    }
    if (homepage.hero && homepage.hero.sideImage === url) {
      usages.push({ collection: 'homepage', docId: homepage._id, field: 'hero.sideImage' });
    }
    (homepage.beforeAfter || []).forEach((item, idx) => {
      if (item.beforeImage === url) {
        usages.push({ collection: 'homepage', docId: homepage._id, field: `beforeAfter[${idx}].beforeImage` });
      }
      if (item.afterImage === url) {
        usages.push({ collection: 'homepage', docId: homepage._id, field: `beforeAfter[${idx}].afterImage` });
      }
    });
  }

  // --- About page (singleton) ---
  const about = await AboutPage.findOne();
  if (about) {
    if (about.banner === url) usages.push({ collection: 'about_page', docId: about._id, field: 'banner' });
    if (about.companyImage === url) {
      usages.push({ collection: 'about_page', docId: about._id, field: 'companyImage' });
    }
    (about.teamImages || []).forEach((item, idx) => {
      if (item.image === url) {
        usages.push({ collection: 'about_page', docId: about._id, field: `teamImages[${idx}].image` });
      }
    });
    (about.certificates || []).forEach((item, idx) => {
      if (item.image === url) {
        usages.push({ collection: 'about_page', docId: about._id, field: `certificates[${idx}].image` });
      }
    });
  }

  // --- Services ---
  const services = await Service.find({
    $or: [{ image: url }, { banner: url }, { gallery: url }],
  });
  services.forEach((svc) => {
    if (svc.image === url) usages.push({ collection: 'services', docId: svc._id, field: 'image' });
    if (svc.banner === url) usages.push({ collection: 'services', docId: svc._id, field: 'banner' });
    if ((svc.gallery || []).includes(url)) {
      usages.push({ collection: 'services', docId: svc._id, field: 'gallery' });
    }
  });

  // --- Portfolio ---
  const portfolioItems = await Portfolio.find({
    $or: [{ coverImage: url }, { beforeImage: url }, { afterImage: url }, { images: url }],
  });
  portfolioItems.forEach((item) => {
    if (item.coverImage === url) usages.push({ collection: 'portfolio', docId: item._id, field: 'coverImage' });
    if (item.beforeImage === url) usages.push({ collection: 'portfolio', docId: item._id, field: 'beforeImage' });
    if (item.afterImage === url) usages.push({ collection: 'portfolio', docId: item._id, field: 'afterImage' });
    if ((item.images || []).includes(url)) {
      usages.push({ collection: 'portfolio', docId: item._id, field: 'images' });
    }
  });

  // --- Testimonials ---
  const testimonials = await Testimonial.find({ image: url });
  testimonials.forEach((t) => usages.push({ collection: 'testimonials', docId: t._id, field: 'image' }));

  // --- Contact page (singleton) ---
  const contact = await ContactPage.findOne();
  if (contact && contact.banner === url) {
    usages.push({ collection: 'contact_page', docId: contact._id, field: 'banner' });
  }

  // --- Settings (singleton) ---
  const settings = await Settings.findOne();
  if (settings) {
    if (settings.logo === url) usages.push({ collection: 'settings', docId: settings._id, field: 'logo' });
    if (settings.logoWhite === url) {
      usages.push({ collection: 'settings', docId: settings._id, field: 'logoWhite' });
    }
    if (settings.favicon === url) {
      usages.push({ collection: 'settings', docId: settings._id, field: 'favicon' });
    }
    if (settings.seo && settings.seo.ogImage === url) {
      usages.push({ collection: 'settings', docId: settings._id, field: 'seo.ogImage' });
    }
  }

  return usages;
}

module.exports = { findMediaUsage };
