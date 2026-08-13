const crypto = require('crypto');

function getAdminCredentials() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left || '', 'utf8');
  const rightBuffer = Buffer.from(right || '', 'utf8');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function credentialsMatch(email, password) {
  const credentials = getAdminCredentials();
  if (!credentials) return false;

  return (
    safeEqual(String(email || '').trim().toLowerCase(), credentials.email) &&
    safeEqual(String(password || ''), credentials.password)
  );
}

module.exports = { getAdminCredentials, credentialsMatch };
