const Course = require('../model/course');
module.exports.isUniqueCourse = async (req, res, next) => {
  try {
    const courseCode = String(req.body?.courseCode || '').trim();
    if (!courseCode) return res.status(400).json({ message: 'Course code is required' });
    const existing = await Course.findOne({ courseCode });
    if (existing) return res.status(409).json({ message: 'Course code already exists' });
    return next();
  } catch {
    return res.status(500).json({ message: 'Unable to validate course code' });
  }
};
