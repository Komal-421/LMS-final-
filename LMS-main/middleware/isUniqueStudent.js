const Student = require('../model/students');

module.exports.isUniqueStudent = async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const phone = String(req.body?.phone || '').trim();
    const enrollmentNo = String(req.body?.enrollment_no || '').trim();
    const checks = [];
    if (email) checks.push({ email });
    if (phone) checks.push({ phone });
    if (enrollmentNo) checks.push({ enrollment_no: enrollmentNo });
    if (!checks.length) return next();
    const existing = await Student.findOne({ $or: checks }).select('email phone enrollment_no');
    if (existing) {
      const field = existing.email === email ? 'Email' : existing.phone === phone ? 'Phone number' : 'Enrollment number';
      return res.status(409).json({ message: `${field} is already registered` });
    }
    return next();
  } catch (error) {
    return res.status(500).json({ message: 'Unable to validate student uniqueness' });
  }
};
