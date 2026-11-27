const Faculty = require('../model/faculty');
module.exports.isUniqueFaculty = async (req, res, next) => {
  try {
    const { email, employeeId } = req.body || {};
    const checks = [];
    if (email) checks.push({ email: String(email).trim().toLowerCase() });
    if (employeeId) checks.push({ employeeId: String(employeeId).trim() });
    const existing = checks.length ? await Faculty.findOne({ $or: checks }) : null;
    if (existing) return res.status(409).json({ message: existing.email === String(email || '').trim().toLowerCase() ? 'Faculty email already registered' : 'Employee ID already registered' });
    return next();
  } catch {
    return res.status(500).json({ message: 'Unable to validate faculty uniqueness' });
  }
};
