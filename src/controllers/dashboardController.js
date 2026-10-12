const Media = require('../models/Media');
const Service = require('../models/Service');
const Portfolio = require('../models/Portfolio');
const Testimonial = require('../models/Testimonial');
const ContactMessage = require('../models/ContactMessage');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../helpers/asyncHandler');

// GET /api/dashboard/stats (auth)
const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalImages, servicesCount, portfolioCount, testimonialsCount, contactMessagesCount, galleryCount, recentLogs] =
    await Promise.all([
      Media.countDocuments(),
      Service.countDocuments(),
      Portfolio.countDocuments(),
      Testimonial.countDocuments(),
      ContactMessage.countDocuments(),
      Media.countDocuments({ category: 'gallery' }),
      ActivityLog.find().sort({ createdAt: -1 }).limit(10),
    ]);

  const recentUpdates = recentLogs.map((log) => ({
    collection: log.collectionName,
    action: log.action,
    summary: log.summary,
    at: log.createdAt,
  }));

  res.status(200).json({
    success: true,
    data: {
      totalImages,
      galleryCount,
      servicesCount,
      portfolioCount,
      testimonialsCount,
      contactMessagesCount,
      recentUpdates,
    },
  });
});

module.exports = { getDashboardStats };
