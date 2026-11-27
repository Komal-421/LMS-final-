const allowedFieldsByRole = {
  admin: ['name', 'email', 'phone', 'dob', 'address', 'department', 'status', 'enrollment_no', 'gender', 'admissionDate'],
  faculty: ['name', 'email', 'phone', 'address', 'department', 'status'],
  student: ['phone', 'address'],
};

module.exports.checkUpdates = (req, res, next) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const fields = Object.keys(body);
  if (!fields.length) return res.status(400).json({ message: 'Provide at least one field to update' });

  const allowed = allowedFieldsByRole[req.role] || [];
  const forbidden = fields.filter((field) => !allowed.includes(field));
  if (forbidden.length) {
    return res.status(403).json({ message: `You cannot update these fields: ${forbidden.join(', ')}` });
  }
  return next();
};
