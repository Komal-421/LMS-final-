const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id, role, roles = [role]) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.sign({ id: String(id), role, roles }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

const verifyPassword = async (stored, given) => {
  if (!stored || typeof given !== 'string') return false;
  try {
    return await bcrypt.compare(given, stored);
  } catch {
    return false;
  }
};

const authorizeRole = (role) => ['faculty', 'admin'].includes(role);
const createHash = (password) => bcrypt.hash(password, 10);

const extractInfo = (req) => {
  if (!process.env.JWT_SECRET) return null;
  const token = req.cookies?.lms_token;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.id || !['student', 'faculty', 'admin'].includes(payload.role)) return null;
    return { id: payload.id, role: payload.role, roles: Array.isArray(payload.roles) ? payload.roles : [payload.role] };
  } catch {
    return null;
  }
};

module.exports = { generateToken, verifyPassword, authorizeRole, createHash, extractInfo };
