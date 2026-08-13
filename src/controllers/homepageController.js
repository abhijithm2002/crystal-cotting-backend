const Homepage = require('../models/Homepage');
const asyncHandler = require('../helpers/asyncHandler');
const logActivity = require('../helpers/logActivity');

// GET /api/homepage (public)
const getHomepage = asyncHandler(async (req, res) => {
  const homepage = await Homepage.findOneAndUpdate({}, { $setOnInsert: {} }, { upsert: true, new: true });
  res.status(200).json({ success: true, data: homepage });
});

// PUT /api/homepage (auth) - full or partial replace of the singleton
const updateHomepage = asyncHandler(async (req, res) => {
  const homepage = await Homepage.findOneAndUpdate({}, { $set: req.body }, {
    upsert: true,
    new: true,
    runValidators: true,
  });

  await logActivity('homepage', 'updated', 'Homepage content updated');

  res.status(200).json({ success: true, data: homepage });
});

module.exports = { getHomepage, updateHomepage };
