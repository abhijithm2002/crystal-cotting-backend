const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/** Generates a signed JWT for an admin id. */
function signJwt(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function verifyJwt(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * Generates a random URL-safe token plus its sha256 hash.
 * The raw token is sent to the user (e.g. via email/console log), the hash
 * is what gets persisted in the DB - so a leaked DB never exposes usable
 * reset tokens.
 */
function generateResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, hashedToken };
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Tiny duration parser ("7d", "12h", "30m", "45s", or a plain number of ms)
 * so we can compute a matching cookie maxAge from JWT_EXPIRES_IN without
 * pulling in an extra dependency.
 */
function parseDurationToMs(duration, fallbackMs = 7 * 24 * 60 * 60 * 1000) {
  if (!duration) return fallbackMs;
  if (typeof duration === 'number') return duration;

  const match = /^(\d+)\s*(d|h|m|s)?$/i.exec(String(duration).trim());
  if (!match) return fallbackMs;

  const value = Number(match[1]);
  const unit = (match[2] || 's').toLowerCase();
  const unitMs = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return value * (unitMs[unit] || unitMs.s);
}

module.exports = { signJwt, verifyJwt, generateResetToken, hashToken, parseDurationToMs };
