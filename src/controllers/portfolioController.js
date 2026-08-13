const Portfolio = require('../models/Portfolio');
const asyncHandler = require('../helpers/asyncHandler');
const ApiError = require('../helpers/ApiError');
const logActivity = require('../helpers/logActivity');

// GET /api/portfolio (public) - ?featured=true&category=&limit=
const listPortfolio = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.featured === 'true') filter.isFeatured = true;
  if (req.query.featured === 'false') filter.isFeatured = false;
  if (req.query.category) filter.category = req.query.category;

  let query = Portfolio.find(filter).sort({ order: 1, createdAt: -1 });

  if (req.query.limit) {
    const limit = parseInt(req.query.limit, 10);
    if (!Number.isNaN(limit) && limit > 0) query = query.limit(limit);
  }

  const items = await query;
  res.status(200).json({ success: true, data: items });
});

// GET /api/portfolio/:id (public)
const getPortfolioItem = asyncHandler(async (req, res) => {
  const item = await Portfolio.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Portfolio item not found');
  res.status(200).json({ success: true, data: item });
});

// POST /api/portfolio (auth)
const createPortfolioItem = asyncHandler(async (req, res) => {
  const item = await Portfolio.create(req.body);
  await logActivity('portfolio', 'created', `Portfolio item "${item.title}" created`);
  res.status(201).json({ success: true, data: item });
});

// PUT /api/portfolio/:id (auth)
const updatePortfolioItem = asyncHandler(async (req, res) => {
  const item = await Portfolio.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) throw new ApiError(404, 'Portfolio item not found');

  await logActivity('portfolio', 'updated', `Portfolio item "${item.title}" updated`);
  res.status(200).json({ success: true, data: item });
});

// DELETE /api/portfolio/:id (auth)
const deletePortfolioItem = asyncHandler(async (req, res) => {
  const item = await Portfolio.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, 'Portfolio item not found');

  await logActivity('portfolio', 'deleted', `Portfolio item "${item.title}" deleted`);
  res.status(200).json({ success: true, message: 'Portfolio item deleted' });
});

module.exports = {
  listPortfolio,
  getPortfolioItem,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
};
