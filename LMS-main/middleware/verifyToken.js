const jwt = require('jsonwebtoken');

module.exports.verifyToken = (req, res, next) => {
  if (!process.env.JWT_SECRET) return res.status(500).json({ message: 'Authentication is not configured on the server' });
  const token = req.cookies?.lms_token;
  if (!token) return res.status(401).json({ message: 'Authentication cookie is required' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.id || !['student', 'faculty', 'admin'].includes(payload.role)) return res.status(401).json({ message: 'Invalid authentication cookie' });
    req.id = payload.id;
    req.role = payload.role;
    req.roles = Array.isArray(payload.roles) ? payload.roles : [payload.role];
    req.isAdmin = req.roles.includes('admin') || payload.role === 'admin';
    return next();
  } catch (error) {
    return res.status(401).json({ message: error.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Invalid authentication cookie' });
  }
};
