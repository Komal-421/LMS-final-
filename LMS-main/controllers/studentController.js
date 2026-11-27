const mongoose = require('mongoose');
const Student = require('../model/students');
const Course = require('../model/course');

const safeProjection = '-password -__v';
const invalidId = (id) => !mongoose.Types.ObjectId.isValid(id);

module.exports.getAllStudents = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));
    let filter = {};
    if (!req.isAdmin && req.role === 'faculty') {
      const assignedCourses = await Course.find({ assignedFaculty: req.id }).distinct('_id');
      filter = { courses: { $in: assignedCourses } };
    }
    const [students, total] = await Promise.all([
      Student.find(filter).select(safeProjection).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Student.countDocuments(filter),
    ]);
    return res.status(200).json({ students, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch {
    return res.status(500).json({ message: 'Unable to retrieve students' });
  }
};

module.exports.getStudentById = async (req, res) => {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ message: 'Invalid student ID' });
    let filter = { _id: req.params.id };
    if (!req.isAdmin && req.role === 'faculty') {
      const assignedCourses = await Course.find({ assignedFaculty: req.id }).distinct('_id');
      filter.courses = { $in: assignedCourses };
    } else if (req.role === 'student' && String(req.id) !== String(req.params.id)) {
      return res.status(403).json({ message: 'You can only access your own student record' });
    }
    const student = await Student.findOne(filter).select(safeProjection).lean();
    if (!student) return res.status(404).json({ message: 'Student not found in your permitted department' });
    return res.status(200).json(student);
  } catch {
    return res.status(500).json({ message: 'Unable to retrieve student' });
  }
};

module.exports.updateStudent = async (req, res) => {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ message: 'Invalid student ID' });
    const updates = { ...req.body };
    delete updates.password;
    const student = await Student.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true, context: 'query' }).select(safeProjection);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    return res.status(200).json({ message: 'Student updated successfully', user: student });
  } catch (error) {
    if (error.name === 'ValidationError' || error.code === 11000 || error.name === 'CastError') return res.status(400).json({ message: error.message });
    return res.status(500).json({ message: 'Unable to update student' });
  }
};

module.exports.deleteStudent = async (req, res) => {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ message: 'Invalid student ID' });
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    return res.status(200).json({ message: 'Student deleted successfully' });
  } catch {
    return res.status(500).json({ message: 'Unable to delete student' });
  }
};
