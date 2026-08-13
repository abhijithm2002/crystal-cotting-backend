/**
 * Offline / network-free component checks.
 *
 * These exercise every piece of logic that does NOT require a live MongoDB
 * connection: JWT signing, bcrypt hashing, CSV export formatting, the
 * mailer stub, and - most importantly - the full upload pipeline (magic-byte
 * sniffing via file-type, sharp compression, thumbnail generation, and SVG
 * handling) against real generated file buffers on disk.
 *
 * This complements scripts/smoke-test.js, which additionally needs a real
 * (or in-memory) MongoDB and exercises the HTTP routes end-to-end.
 *
 * Run with: npm run verify:offline
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'verify-offline-secret';
process.env.JWT_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';

const path = require('path');
const base = path.join(__dirname, '..', 'src');

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    failures += 1;
    console.error('FAIL:', msg);
  } else {
    console.log('PASS:', msg);
  }
}

async function safeDelete(fn, label) {
  try {
    await fn();
  } catch (err) {
    console.log(`NOTE: could not delete test artifact for ${label} (${err.code || err.message}).`);
  }
}

async function main() {
  const { signJwt, verifyJwt, generateResetToken, hashToken, parseDurationToMs } = require(path.join(
    base,
    'utils/tokenUtils'
  ));
  const token = signJwt({ id: 'abc123' });
  const decoded = verifyJwt(token);
  assert(decoded.id === 'abc123', 'JWT sign/verify round-trips correctly');
  assert(parseDurationToMs('7d') === 7 * 24 * 60 * 60 * 1000, 'parseDurationToMs parses "7d" correctly');
  assert(parseDurationToMs('15m') === 15 * 60 * 1000, 'parseDurationToMs parses "15m" correctly');
  const { rawToken, hashedToken } = generateResetToken();
  assert(hashToken(rawToken) === hashedToken, 'generateResetToken/hashToken are consistent');

  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('MySecretPass123!', 12);
  assert(await bcrypt.compare('MySecretPass123!', hash), 'bcryptjs hash/compare works with cost 12');
  assert(!(await bcrypt.compare('wrong', hash)), 'bcryptjs correctly rejects wrong password');

  const { rowsToCsv } = require(path.join(base, 'services/csvService'));
  const csv = rowsToCsv([{ name: 'Jane, Doe', email: 'a@b.com' }], [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
  ]);
  assert(csv.includes('"Jane, Doe"'), 'CSV service properly quotes/escapes commas');
  assert(csv.split('\n')[0] === 'Name,Email', 'CSV service writes header row');

  const { sendMail } = require(path.join(base, 'utils/mailer'));
  const info = await sendMail({ to: 'admin@example.com', subject: 'Test', text: 'hello world reset link' });
  assert(!!info.message, 'mailer.sendMail (JSON transport) returns a serialized message with no network calls');

  const { processAndStoreUpload, deleteMediaFiles } = require(path.join(base, 'services/imageService'));
  const fs = require('fs');
  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  const result = await processAndStoreUpload({ originalname: 'pixel.png', buffer: pngBuffer });
  assert(!!result.filename && !!result.url, 'imageService processes a real PNG and returns filename/url');
  assert(!!result.thumbnailUrl, 'imageService generates a thumbnail for raster images');
  assert(result.width === 1 && result.height === 1, 'imageService extracts width/height via sharp metadata');
  const origExists = fs.existsSync(path.join(base, 'uploads', result.filename));
  const thumbExists = fs.existsSync(path.join(base, 'uploads/thumb', path.basename(result.thumbnailUrl)));
  assert(origExists, 'Compressed original file actually written to disk');
  assert(thumbExists, 'Thumbnail file actually written to disk');
  await safeDelete(() => deleteMediaFiles({ url: result.url, thumbnailUrl: result.thumbnailUrl }), 'raster upload');

  try {
    await processAndStoreUpload({ originalname: 'fake.png', buffer: Buffer.from('not a real png, just text') });
    assert(false, 'imageService should reject a disguised non-image file');
  } catch (err) {
    assert(err.statusCode === 415, 'imageService rejects disguised non-image file with 415 (magic-byte check works)');
  }

  const svgBuffer = Buffer.from(
    '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>'
  );
  const svgResult = await processAndStoreUpload({ originalname: 'icon.svg', buffer: svgBuffer });
  assert(svgResult.mimeType === 'image/svg+xml', 'imageService stores SVG with correct mimeType');
  assert(svgResult.thumbnailUrl === '', 'imageService skips thumbnail generation for SVG');
  await safeDelete(() => deleteMediaFiles({ url: svgResult.url, thumbnailUrl: '' }), 'svg upload');

  try {
    await processAndStoreUpload({ originalname: 'notreal.svg', buffer: Buffer.from('plain text, not svg at all') });
    assert(false, 'imageService should reject a file with .svg extension that is not actually SVG');
  } catch (err) {
    assert(err.statusCode === 415, 'imageService rejects invalid SVG content with 415');
  }

  const ApiError = require(path.join(base, 'helpers/ApiError'));
  const err = new ApiError(404, 'Not found');
  assert(err.statusCode === 404 && err.message === 'Not found', 'ApiError carries statusCode + message');

  const app = require(path.join(base, 'app'));
  const http = require('http');
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const port = server.address().port;
  const healthBody = await new Promise((resolve, reject) => {
    http
      .get(`http://127.0.0.1:${port}/health`, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
      })
      .on('error', reject);
  });
  assert(
    healthBody.status === 200 && healthBody.body.success === true,
    'Express app boots and /health responds without a DB connection'
  );
  server.close();

  console.log('\n----------------------------------------');
  if (failures > 0) {
    console.error(`${failures} check(s) FAILED`);
    process.exit(1);
  } else {
    console.log('All offline verification checks PASSED');
    process.exit(0);
  }
}

main().catch((e) => {
  console.error('Offline verification crashed:', e);
  process.exit(1);
});
