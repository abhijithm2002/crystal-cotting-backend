const Media = require('../models/Media');
const asyncHandler = require('../helpers/asyncHandler');
const ApiError = require('../helpers/ApiError');
const logActivity = require('../helpers/logActivity');
const { processAndStoreUpload, deleteMediaFiles } = require('../services/imageService');
const { findMediaUsage } = require('../services/mediaUsageService');

// POST /api/media/upload (auth) - multipart `file` or `files`
const uploadMedia = asyncHandler(async (req, res) => {
  const files = req.files || [];
  if (!files.length) {
    throw new ApiError(400, 'No file(s) provided. Attach under the "file" or "files" field.');
  }

  const created = [];
  for (const file of files) {
    const processed = await processAndStoreUpload(file);
    const mediaDoc = await Media.create({
      ...processed,
      category: req.body.category || 'uncategorized',
    });
    created.push(mediaDoc);
  }

  await logActivity('media', 'created', `${created.length} file(s) uploaded to media library`);

  const isBulk = created.length > 1;
  res.status(201).json({
    success: true,
    data: isBulk ? created : created[0],
  });
});

// GET /api/media (auth) - ?search=&category=&page=
const listMedia = asyncHandler(async (req, res) => {
  const { search, category, page = 1, limit = 24 } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { originalName: { $regex: search, $options: 'i' } },
      { filename: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.max(parseInt(limit, 10) || 24, 1);

  // When scoped to a single category (e.g. the Gallery view), respect manual drag order first.
  const sort = category ? { order: 1, createdAt: -1 } : { createdAt: -1 };

  const [items, total] = await Promise.all([
    Media.find(filter)
      .sort(sort)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize),
    Media.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    pagination: { page: pageNum, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 },
  });
});

// PUT /api/media/:id (auth) - rename / change category
const updateMedia = asyncHandler(async (req, res) => {
  const updates = {};
  if (typeof req.body.originalName === 'string') updates.originalName = req.body.originalName;
  if (typeof req.body.category === 'string') updates.category = req.body.category;

  const media = await Media.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!media) throw new ApiError(404, 'Media not found');

  res.status(200).json({ success: true, data: media });
});

// PUT /api/media/:id/replace (auth) - swap the file, keep same DB refs where possible
const replaceMedia = asyncHandler(async (req, res) => {
  const existing = await Media.findById(req.params.id);
  if (!existing) throw new ApiError(404, 'Media not found');

  const file = (req.files || [])[0];
  if (!file) throw new ApiError(400, 'No replacement file provided under the "file" field.');

  const processed = await processAndStoreUpload(file);

  // Remove the old physical files (new ones already stored under new names).
  await deleteMediaFiles({ url: existing.url, thumbnailUrl: existing.thumbnailUrl });

  existing.filename = processed.filename;
  existing.originalName = processed.originalName;
  existing.url = processed.url;
  existing.thumbnailUrl = processed.thumbnailUrl;
  existing.mimeType = processed.mimeType;
  existing.size = processed.size;
  existing.width = processed.width;
  existing.height = processed.height;
  await existing.save();

  await logActivity('media', 'updated', `Media "${existing.originalName}" replaced`);

  res.status(200).json({ success: true, data: existing });
});

// DELETE /api/media/:id (auth)
const deleteMedia = asyncHandler(async (req, res) => {
  const media = await Media.findByIdAndDelete(req.params.id);
  if (!media) throw new ApiError(404, 'Media not found');

  await deleteMediaFiles({ url: media.url, thumbnailUrl: media.thumbnailUrl });
  await logActivity('media', 'deleted', `Media "${media.originalName}" deleted`);

  res.status(200).json({ success: true, message: 'Media deleted' });
});

// GET /api/media/:id/usage (auth)
const getMediaUsage = asyncHandler(async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) throw new ApiError(404, 'Media not found');

  const usage = await findMediaUsage(media.url);
  res.status(200).json({ success: true, data: usage });
});

// PUT /api/media/reorder (auth) - { order: [id, id, ...] } within a category (e.g. gallery)
const reorderMedia = asyncHandler(async (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order) || !order.length) {
    throw new ApiError(400, '"order" must be a non-empty array of media ids.');
  }

  await Promise.all(
    order.map((id, index) => Media.findByIdAndUpdate(id, { order: index }))
  );

  await logActivity('media', 'updated', 'Media order updated');
  res.status(200).json({ success: true, message: 'Media order updated' });
});

module.exports = {
  uploadMedia,
  listMedia,
  updateMedia,
  replaceMedia,
  deleteMedia,
  getMediaUsage,
  reorderMedia,
};
