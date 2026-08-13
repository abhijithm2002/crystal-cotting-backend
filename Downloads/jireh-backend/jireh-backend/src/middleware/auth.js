const { verifyJwt } = require('../utils/tokenUtils');
const ApiError = require('../helpers/ApiError');
const asyncHandler = require('../helpers/asyncHandler');
const Admin = require('../models/Admin');

/**
 * Requires a valid JWT, taken from the httpOnly cookie ("token") or from
 * an `Authorization: Bearer <token>` header (dashboard convenience).
 * Attaches the authenticated admin to req.admin.
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  let token = req.cookies && req.cookies.token;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authenticated. Please log in.');
  }

  let decoded;
  try {
    decoded = verifyJwt(token);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired session. Please log in again.');
  }

  const admin = await Admin.findById(decoded.id);
  if (!admin) {
    throw new ApiError(401, 'Admin account no longer exists.');
  }

  req.admin = admin;
  next();
});

module.exports = { requireAuth };
