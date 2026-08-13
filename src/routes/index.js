const express = require('express');
const router = express.Router();

router.use('/admin', require('./authRoutes'));
router.use('/homepage', require('./homepageRoutes'));
router.use('/about', require('./aboutRoutes'));
router.use('/services', require('./serviceRoutes'));
router.use('/portfolio', require('./portfolioRoutes'));
router.use('/testimonials', require('./testimonialRoutes'));
router.use('/faq', require('./faqRoutes'));
router.use('/contact', require('./contactRoutes'));
router.use('/settings', require('./settingsRoutes'));
router.use('/media', require('./mediaRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));

module.exports = router;
