const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Faculty = require('../model/faculty');
const safeProjection = '-password -__v';
const invalidId = (id) => !mongoose.Types.ObjectId.isValid(id);

module.exports.getAllFaculty = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));
    const [faculties, total] = await Promise.all([
      Faculty.find({ $or: [{ role: 'faculty' }, { role: 'admin', facultyAccess: true }] }).select(safeProjection).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Faculty.countDocuments({ $or: [{ role: 'faculty' }, { role: 'admin', facultyAccess: true }] }),
    ]);
    return res.status(200).json({ faculties, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch {
    return res.status(500).json({ message: 'Unable to retrieve faculty' });
  }
};

module.exports.getFacultyById = async (req, res) => {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ message: 'Invalid faculty ID' });
    const faculty = await Faculty.findOne({ _id: req.params.id, $or: [{ role: 'faculty' }, { role: 'admin', facultyAccess: true }] }).select(safeProjection).lean();
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    return res.status(200).json(faculty);
  } catch {
    return res.status(500).json({ message: 'Unable to retrieve faculty' });
  }
};

module.exports.updateFaculty = async (req, res) => {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ message: 'Invalid faculty ID' });
    const allowed = req.isAdmin ? ['name', 'email', 'employeeId', 'department', 'experience'] : ['name', 'department', 'experience'];
    const updates = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowed.includes(key)));
    if (!Object.keys(updates).length) return res.status(400).json({ message: 'No permitted fields supplied for update' });
    const faculty = await Faculty.findOneAndUpdate({ _id: req.params.id, $or: [{ role: 'faculty' }, { role: 'admin', facultyAccess: true }] }, { $set: updates }, { new: true, runValidators: true, context: 'query' }).select(safeProjection);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    return res.status(200).json({ message: 'Faculty updated successfully', updated_user: faculty });
  } catch (error) {
    if (error.name === 'ValidationError' || error.code === 11000 || error.name === 'CastError') return res.status(400).json({ message: error.message });
    return res.status(500).json({ message: 'Unable to update faculty' });
  }
};

module.exports.createFaculty = async (req, res) => {
  const { name, email, employeeId, password, experience, department } = req.body || {};
  if (!name || !email || !employeeId || !password || experience === undefined || experience === null || !department) {
    return res.status(400).json({ message: 'Name, email, employee ID, password, experience and department are required' });
  }
  if (typeof password !== 'string' || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, number and special character' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await Faculty.create({ name: name.trim(), email: email.trim().toLowerCase(), department: department.trim(), employeeId: String(employeeId).trim(), password: hashed, experience: Number(experience), role: 'faculty' });
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.__v;
    return res.status(201).json({ message: 'Faculty created successfully', user: safeUser });
  } catch (error) {
    if (error.code === 11000 || error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ message: error.message });
    return res.status(500).json({ message: 'Unable to create faculty' });
  }
};

module.exports.deleteFaculty = async (req, res) => {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ message: 'Invalid faculty ID' });
    const faculty = await Faculty.findOneAndDelete({ _id: req.params.id, role: 'faculty', adminAccess: { $ne: true } });
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    return res.status(200).json({ message: 'Faculty deleted successfully' });
  } catch {
    return res.status(500).json({ message: 'Unable to delete faculty' });
  }
};

// Promote exactly one existing faculty account. This endpoint is admin-only at the route layer.
module.exports.promoteFacultyToAdmin = async (req, res) => {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ message: 'Invalid faculty ID' });
    const faculty = await Faculty.findOneAndUpdate(
      { _id: req.params.id, role: 'faculty', adminAccess: { $ne: true } },
      { $set: { adminAccess: true, facultyAccess: true } },
      { new: true, runValidators: true }
    ).select(safeProjection);
    if (!faculty) return res.status(404).json({ message: 'Faculty member not found or already an admin' });
    return res.status(200).json({ message: `${faculty.name} now has both faculty and admin access`, faculty: { ...faculty.toObject(), roles: ['faculty', 'admin'], isAdmin: true } });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ message: error.message });
    return res.status(500).json({ message: 'Unable to promote faculty member' });
  }
};
