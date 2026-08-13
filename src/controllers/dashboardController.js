const Media = require('../models/Media');
const Service = require('../models/Service');
const Portfolio = require('../models/Portfolio');
const Testimonial = require('../models/Testimonial');
const ContactMessage = require('../models/ContactMessage');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../helpers/asyncHandler');

// GET /api/dashboard/stats (auth)
const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalImages, servicesCount, portfolioCount, testimonialsCount, contactMessagesCount, galleryAgg, recentLogs] =
    await Promise.all([
      Media.countDocuments(),
      Service.countDocuments(),
      Portfolio.countDocuments(),
      Testimonial.countDocuments(),
      ContactMessage.countDocuments(),
      // "gallery count" = total number of gallery images across all portfolio
      // projects (distinct from portfolioCount, which is # of projects).
      Portfolio.aggregate([
        { $project: { imagesCount: { $size: { $ifNull: ['$images', []] } } } },
        { $group: { _id: null, total: { $sum: '$imagesCount' } } },
      ]),
      ActivityLog.find().sort({ createdAt: -1 }).limit(10),
    ]);

  const galleryCount = (galleryAgg[0] && galleryAgg[0].total) || 0;

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
