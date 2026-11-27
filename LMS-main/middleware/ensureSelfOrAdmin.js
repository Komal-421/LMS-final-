module.exports.ensureSelfOrAdmin = (req, res, next) => {
  const isAdmin = Boolean(req.isAdmin);
  const isSelf = String(req.id) === String(req.params.id);
  if (isAdmin || isSelf) return next();
  return res.status(403).json({ message: 'You can only access or modify your own account' });
};
