// Admin access is an additional capability. Promoted faculty retain req.role='faculty'.
module.exports.allowRole = (...allowedRoles) => (req, res, next) => {
  if (!req.role) return res.status(401).json({ message: 'Authentication required' });
  const permitted = allowedRoles.some((role) => role === 'admin' ? req.isAdmin : req.roles?.includes(role) || req.role === role);
  if (!permitted) return res.status(403).json({ message: 'You do not have permission to perform this action' });
  return next();
};
