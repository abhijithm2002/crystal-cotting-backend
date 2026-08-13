const Settings = require('../models/Settings');
const asyncHandler = require('../helpers/asyncHandler');
const logActivity = require('../helpers/logActivity');

// GET /api/settings (public)
const getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.findOneAndUpdate({}, { $setOnInsert: {} }, { upsert: true, new: true });
  res.status(200).json({ success: true, data: settings });
});

// PUT /api/settings (auth)
const updateSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.findOneAndUpdate({}, { $set: req.body }, {
    upsert: true,
    new: true,
    runValidators: true,
  });

  await logActivity('settings', 'updated', 'Site settings updated');

  res.status(200).json({ success: true, data: settings });
});

module.exports = { getSettings, updateSettings };
