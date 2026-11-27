require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Faculty = require('../model/faculty');

async function main() {
  const { DATABASE_URL, ADMIN_NAME, ADMIN_EMAIL, ADMIN_EMPLOYEE_ID, ADMIN_PASSWORD, ADMIN_DEPARTMENT } = process.env;
  if (!DATABASE_URL || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_EMPLOYEE_ID || !ADMIN_PASSWORD || !ADMIN_DEPARTMENT) {
    throw new Error('Set DATABASE_URL, ADMIN_NAME, ADMIN_EMAIL, ADMIN_EMPLOYEE_ID, ADMIN_PASSWORD and ADMIN_DEPARTMENT in LMS-main/.env before running this script.');
  }
  if (ADMIN_PASSWORD.length < 8 || !/[A-Z]/.test(ADMIN_PASSWORD) || !/[a-z]/.test(ADMIN_PASSWORD) || !/\d/.test(ADMIN_PASSWORD) || !/[^A-Za-z0-9]/.test(ADMIN_PASSWORD)) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters and include uppercase, lowercase, number and special character.');
  }
  await mongoose.connect(DATABASE_URL);
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await Faculty.findOne({ $or: [{ email }, { employeeId: ADMIN_EMPLOYEE_ID }] });
  if (existing) throw new Error('An account with this admin email or employee ID already exists. No changes were made.');
  const password = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await Faculty.create({ name: ADMIN_NAME.trim(), email, employeeId: ADMIN_EMPLOYEE_ID.trim(), password, department: ADMIN_DEPARTMENT.trim(), experience: 0, role: 'admin' });
  console.log(`Admin account created for ${email}`);
}

main().catch((error) => {
  console.error(`Admin creation failed: ${error.message}`);
  process.exitCode = 1;
}).finally(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
});
