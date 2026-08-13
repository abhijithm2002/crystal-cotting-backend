/**
 * End-to-end smoke test.
 *
 * Spins up an in-memory MongoDB (mongodb-memory-server), starts the Express
 * app against it, and walks through the critical happy-path flows:
 *   1. Auto-seed creates the admin account from ADMIN_EMAIL/ADMIN_PASSWORD.
 *   2. Login succeeds and returns a usable JWT.
 *   3. An authenticated request creates a Service.
 *   4. The public GET /api/services route returns that service.
 *   5. A tiny generated PNG uploads successfully, producing a Media doc
 *      with a thumbnail.
 *   6. GET /api/dashboard/stats reflects the created records.
 *
 * Run with: npm run smoke-test
 *
 * NOTE: requires outbound internet access on first run so
 * mongodb-memory-server can download a mongod binary (cached afterwards).
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'smoke-test-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.ADMIN_EMAIL = 'smoke@crystalcoat.example';
process.env.ADMIN_PASSWORD = 'SmokeTest123!';
process.env.WEBSITE_ORIGIN = 'http://localhost:5174';
process.env.ADMIN_ORIGIN = 'http://localhost:5173';

const http = require('http');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`PASS: ${message}`);
  }
}

function request({ method, path: reqPath, body, token, isMultipart, boundary }) {
  return new Promise((resolve, reject) => {
    const payload = isMultipart ? body : body ? JSON.stringify(body) : null;
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    if (isMultipart) {
      headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
      headers['Content-Length'] = Buffer.byteLength(payload);
    } else if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      { hostname: '127.0.0.1', port: process.env.PORT, path: reqPath, method, headers },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json;
          try {
            json = JSON.parse(data);
          } catch (e) {
            json = data;
          }
          resolve({ status: res.statusCode, body: json });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/** Builds a minimal valid multipart/form-data body for a single file field. */
function buildMultipart(fieldName, filename, contentType, fileBuffer) {
  const boundary = `----smoketest${Date.now()}`;
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  return { body: Buffer.concat([head, fileBuffer, tail]), boundary };
}

/** Generates a tiny valid PNG buffer (1x1 red pixel) without any deps. */
function tinyPngBuffer() {
  // Minimal valid 1x1 red PNG, base64-encoded.
  const base64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  return Buffer.from(base64, 'base64');
}

async function main() {
  console.log('Starting in-memory MongoDB...');
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.PORT = '5911';

  // Require app pieces AFTER env vars are set so they pick up the right config.
  const { connectDB } = require(path.join('..', 'src', 'config', 'db'));
  const { runSeeds } = require(path.join('..', 'src', 'services', 'seedService'));
  const app = require(path.join('..', 'src', 'app'));
  const Admin = require(path.join('..', 'src', 'models', 'Admin'));

  await connectDB(process.env.MONGODB_URI);
  await runSeeds();

  const server = app.listen(process.env.PORT);
  await new Promise((resolve) => server.once('listening', resolve));
  console.log(`Test server listening on ${process.env.PORT}`);

  try {
    // 1. Auto-seed created the admin
    const adminCount = await Admin.countDocuments();
    assert(adminCount === 1, 'Auto-seed created exactly one admin account');

    const seededAdmin = await Admin.findOne();
    assert(seededAdmin.email === process.env.ADMIN_EMAIL.toLowerCase(), 'Seeded admin email matches ADMIN_EMAIL');

    // 2. Login
    const loginRes = await request({
      method: 'POST',
      path: '/api/admin/login',
      body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
    });
    assert(loginRes.status === 200, `Login returns 200 (got ${loginRes.status})`);
    assert(!!loginRes.body.token, 'Login response contains a token');
    assert(loginRes.body.admin && loginRes.body.admin.email === process.env.ADMIN_EMAIL.toLowerCase(), 'Login response contains admin.email');

    const token = loginRes.body.token;

    // GET /api/admin/me
    const meRes = await request({ method: 'GET', path: '/api/admin/me', token });
    assert(meRes.status === 200 && meRes.body.admin, 'GET /api/admin/me returns the authenticated admin');

    // 3. Create a Service (authenticated)
    const createServiceRes = await request({
      method: 'POST',
      path: '/api/services',
      token,
      body: {
        title: 'Smoke Test Painting Service',
        description: 'Created by the automated smoke test.',
        category: 'main',
        isFeatured: true,
      },
    });
    assert(createServiceRes.status === 201, `POST /api/services returns 201 (got ${createServiceRes.status}, ${JSON.stringify(createServiceRes.body)})`);
    const createdServiceId = createServiceRes.body.data && createServiceRes.body.data._id;
    assert(!!createdServiceId, 'Created service has an _id');

    // Reject unauthenticated create
    const unauthedCreate = await request({
      method: 'POST',
      path: '/api/services',
      body: { title: 'Should be rejected' },
    });
    assert(unauthedCreate.status === 401, `Unauthenticated POST /api/services is rejected with 401 (got ${unauthedCreate.status})`);

    // 4. Public GET /api/services includes it
    const listServicesRes = await request({ method: 'GET', path: '/api/services' });
    assert(listServicesRes.status === 200, 'GET /api/services returns 200');
    const found = (listServicesRes.body.data || []).some((s) => s._id === createdServiceId);
    assert(found, 'GET /api/services includes the newly created service');

    // 5. Upload a tiny PNG
    const { body: multipartBody, boundary } = buildMultipart('file', 'pixel.png', 'image/png', tinyPngBuffer());
    const uploadRes = await request({
      method: 'POST',
      path: '/api/media/upload',
      token,
      isMultipart: true,
      body: multipartBody,
      boundary,
    });
    assert(uploadRes.status === 201, `POST /api/media/upload returns 201 (got ${uploadRes.status}, ${JSON.stringify(uploadRes.body)})`);
    const mediaDoc = uploadRes.body.data;
    assert(!!(mediaDoc && mediaDoc._id), 'Upload response contains a Media doc');
    assert(!!(mediaDoc && mediaDoc.thumbnailUrl), 'Media doc has a thumbnailUrl (thumbnail was generated)');
    assert(!!(mediaDoc && mediaDoc.width && mediaDoc.height), 'Media doc has width/height metadata extracted');

    // Reject a disguised non-image file (magic-byte sniffing)
    const fakeImage = Buffer.from('this is not really a png file, just text pretending to be one');
    const { body: fakeBody, boundary: fakeBoundary } = buildMultipart('file', 'fake.png', 'image/png', fakeImage);
    const fakeUploadRes = await request({
      method: 'POST',
      path: '/api/media/upload',
      token,
      isMultipart: true,
      body: fakeBody,
      boundary: fakeBoundary,
    });
    assert(fakeUploadRes.status === 415, `Disguised non-image upload is rejected with 415 (got ${fakeUploadRes.status})`);

    // 6. Dashboard stats
    const statsRes = await request({ method: 'GET', path: '/api/dashboard/stats', token });
    assert(statsRes.status === 200, 'GET /api/dashboard/stats returns 200');
    const stats = statsRes.body.data;
    assert(stats.totalImages >= 1, `dashboard totalImages reflects the upload (got ${stats.totalImages})`);
    assert(stats.servicesCount >= 1, `dashboard servicesCount reflects created services (got ${stats.servicesCount})`);
    assert(Array.isArray(stats.recentUpdates), 'dashboard recentUpdates is an array');
    assert(stats.recentUpdates.length > 0, 'dashboard recentUpdates has entries after creating records');

    // Bonus: singleton GET endpoints return seeded defaults even before any PUT
    const homepageRes = await request({ method: 'GET', path: '/api/homepage' });
    assert(homepageRes.status === 200 && homepageRes.body.data && homepageRes.body.data.hero, 'GET /api/homepage returns seeded defaults');

    const settingsRes = await request({ method: 'GET', path: '/api/settings' });
    assert(settingsRes.status === 200 && settingsRes.body.data && settingsRes.body.data.siteName, 'GET /api/settings returns seeded defaults');
  } finally {
    server.close();
    await mongoose.disconnect();
    await mongod.stop();
  }

  console.log('\n----------------------------------------');
  if (failures > 0) {
    console.error(`${failures} check(s) FAILED`);
    process.exit(1);
  } else {
    console.log('All smoke-test checks PASSED');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
