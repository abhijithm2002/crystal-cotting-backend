/**
 * Resets the single admin account to whatever ADMIN_EMAIL/ADMIN_PASSWORD
 * currently are in .env — useful the first time login fails because the
 * account was auto-seeded earlier with different credentials (auto-seed
 * only runs once, when the admins collection is empty).
 *
 * Usage: npm run reset-admin
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB } = require('../src/config/db');
const Admin = require('../src/models/Admin');

const BCRYPT_COST = 12;

async function run() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before running this.');
    process.exit(1);
  }

  await connectDB();

  const hashed = await bcrypt.hash(password, BCRYPT_COST);
  await Admin.deleteMany({});
  await Admin.create({ email: email.toLowerCase().trim(), password: hashed });

  console.log(`Admin reset. You can now log in with: ${email}`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed to reset admin:', err.message);
  process.exit(1);
});
