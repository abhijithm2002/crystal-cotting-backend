const AboutPage = require('../models/AboutPage');
const asyncHandler = require('../helpers/asyncHandler');
const logActivity = require('../helpers/logActivity');

// GET /api/about (public)
const getAboutPage = asyncHandler(async (req, res) => {
  const about = await AboutPage.findOneAndUpdate({}, { $setOnInsert: {} }, { upsert: true, new: true });
  res.status(200).json({ success: true, data: about });
});

// PUT /api/about (auth)
const updateAboutPage = asyncHandler(async (req, res) => {
  const about = await AboutPage.findOneAndUpdate({}, { $set: req.body }, {
    upsert: true,
    new: true,
    runValidators: true,
  });

  await logActivity('about_page', 'updated', 'About page content updated');

  res.status(200).json({ success: true, data: about });
});

module.exports = { getAboutPage, updateAboutPage };
