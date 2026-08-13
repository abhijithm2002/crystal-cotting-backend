const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const asyncHandler = require('../helpers/asyncHandler');
const ApiError = require('../helpers/ApiError');
const { signJwt, generateResetToken, hashToken, parseDurationToMs } = require('../utils/tokenUtils');
const { sendMail } = require('../utils/mailer');

const BCRYPT_COST = 12;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: parseDurationToMs(process.env.JWT_EXPIRES_IN),
  };
}

// POST /api/admin/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!admin) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const matches = await bcrypt.compare(password, admin.password);
  if (!matches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signJwt({ id: admin._id.toString() });

  res.cookie('token', token, cookieOptions());
  res.status(200).json({
    success: true,
    token,
    admin: { id: admin._id, email: admin.email },
  });
});

// POST /api/admin/logout
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', { ...cookieOptions(), maxAge: undefined });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// POST /api/admin/change-password (auth required)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const admin = await Admin.findById(req.admin._id).select('+password');
  const matches = await bcrypt.compare(currentPassword, admin.password);
  if (!matches) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  admin.password = await bcrypt.hash(newPassword, BCRYPT_COST);
  await admin.save();

  res.status(200).json({ success: true, message: 'Password updated successfully' });
});

// POST /api/admin/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

  // Always respond with a generic message so we never leak whether an
  // email exists in the system.
  const genericMessage = 'If that email is registered, a password reset link has been sent.';

  if (!admin) {
    return res.status(200).json({ success: true, message: genericMessage });
  }

  const { rawToken, hashedToken } = generateResetToken();
  admin.resetPasswordToken = hashedToken;
  admin.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await admin.save();

  const resetUrl = `${process.env.ADMIN_ORIGIN || 'http://localhost:5173'}/reset-password?token=${rawToken}`;

  await sendMail({
    to: admin.email,
    subject: 'Password reset request',
    text: `Reset your password using this link (valid 15 minutes): ${resetUrl}`,
    html: `<p>Reset your password using this link (valid 15 minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });

  res.status(200).json({ success: true, message: genericMessage });
});

// POST /api/admin/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const hashedToken = hashToken(token);

  const admin = await Admin.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+password +resetPasswordToken +resetPasswordExpires');

  if (!admin) {
    throw new ApiError(400, 'Reset token is invalid or has expired');
  }

  admin.password = await bcrypt.hash(newPassword, BCRYPT_COST);
  admin.resetPasswordToken = undefined;
  admin.resetPasswordExpires = undefined;
  await admin.save();

  res.status(200).json({ success: true, message: 'Password has been reset successfully' });
});

// GET /api/admin/me (auth required)
const me = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    admin: { id: req.admin._id, email: req.admin.email, createdAt: req.admin.createdAt },
  });
});

module.exports = { login, logout, changePassword, forgotPassword, resetPassword, me };
