const mongoose = require('mongoose');
const Course = require('../model/course');
const Faculty = require('../model/faculty');
const invalidId = (id) => !mongoose.Types.ObjectId.isValid(id);

async function facultyCourseFilter(req) {
  if (req.isAdmin || req.role !== 'faculty') return {};
  return { assignedFaculty: req.id };
}

module.exports.getAllCourses = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));
    const filter = await facultyCourseFilter(req);
    const [courses, total] = await Promise.all([
      Course.find(filter).populate('assignedFaculty', 'name email employeeId department').sort({ courseName: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Course.countDocuments(filter),
    ]);
    return res.status(200).json({ courses, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch {
    return res.status(500).json({ message: 'Unable to retrieve courses' });
  }
};

module.exports.getCourseById = async (req, res) => {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ message: 'Invalid course ID' });
    const filter = { _id: req.params.id, ...(await facultyCourseFilter(req)) };
    const course = await Course.findOne(filter).populate('assignedFaculty', 'name email employeeId department').lean();
    if (!course) return res.status(404).json({ message: 'Course not found or not assigned to your account' });
    return res.status(200).json({ course });
  } catch {
    return res.status(500).json({ message: 'Unable to retrieve course' });
  }
};

module.exports.createCourse = async (req, res) => {
  try {
    const { courseName, courseCode, description, semester } = req.body || {};
    if (![courseName, courseCode, description].every((value) => typeof value === 'string' && value.trim()) || semester === undefined || semester === null || semester === '') {
      return res.status(400).json({ message: 'Course name, code, description and semester are required' });
    }

    let department;
    let faculty;

    if (req.isAdmin) {
      // Admin sessions may create a course in any department and assign it to
      // any faculty member who belongs to that department.
      const requestedDepartment = req.body.department;
      const assignedFaculty = req.body.assignedFaculty;
      if (typeof requestedDepartment !== 'string' || !requestedDepartment.trim() || !mongoose.Types.ObjectId.isValid(assignedFaculty)) {
        return res.status(400).json({ message: 'Department and assigned faculty are required for admin course creation' });
      }
      department = requestedDepartment.trim();
      faculty = await Faculty.findOne({ _id: assignedFaculty, department, $or: [{ role: 'faculty' }, { facultyAccess: true }, { role: 'admin', adminAccess: true }] }).select('_id');
      if (!faculty) return res.status(400).json({ message: 'Select a faculty member belonging to the course department' });
    } else if (req.role === 'faculty') {
      // Faculty sessions can create courses only in their own department.
      // Never trust department or assignedFaculty supplied by the browser.
      faculty = await Faculty.findById(req.id).select('_id department role facultyAccess');
      if (!faculty || !(faculty.role === 'faculty' || faculty.facultyAccess === true || (faculty.role === 'admin' && faculty.adminAccess === true))) {
        return res.status(403).json({ message: 'Faculty account not found or faculty access is unavailable' });
      }
      department = faculty.department;
    } else {
      return res.status(403).json({ message: 'Only faculty and admins can create courses' });
    }

    const course = await Course.create({ courseName: courseName.trim(), courseCode: courseCode.trim(), description: description.trim(), department, semester: Number(semester), assignedFaculty: faculty._id });
    return res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    if (error.code === 11000 || error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ message: error.message });
    return res.status(500).json({ message: 'Unable to create course' });
  }
};

module.exports.updateCourse = async (req, res) => {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ message: 'Invalid course ID' });
    const allowed = ['courseName', 'courseCode', 'description', 'department', 'semester', 'assignedFaculty'];
    const updates = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowed.includes(key)));
    if (!Object.keys(updates).length) return res.status(400).json({ message: 'Provide valid course fields to update' });
    if (updates.semester !== undefined) updates.semester = Number(updates.semester);
    if (updates.assignedFaculty && !mongoose.Types.ObjectId.isValid(updates.assignedFaculty)) return res.status(400).json({ message: 'Invalid assigned faculty' });
    const existing = await Course.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Course not found' });
    const department = updates.department || existing.department;
    const assignedFaculty = updates.assignedFaculty || existing.assignedFaculty;
    const faculty = await Faculty.findOne({ _id: assignedFaculty, department, $or: [{ role: 'faculty' }, { facultyAccess: true }, { role: 'admin', adminAccess: true }] }).select('_id');
    if (!faculty) return res.status(400).json({ message: 'Assigned faculty must belong to the course department' });
    const course = await Course.findByIdAndUpdate(req.params.id, { $set: { ...updates, assignedFaculty: faculty._id } }, { new: true, runValidators: true, context: 'query' }).populate('assignedFaculty', 'name email employeeId department');
    return res.status(200).json({ message: 'Course updated successfully', course });
  } catch (error) {
    if (error.code === 11000 || error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ message: error.message });
    return res.status(500).json({ message: 'Unable to update course' });
  }
};

module.exports.deleteCourse = async (req, res) => {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ message: 'Invalid course ID' });
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch {
    return res.status(500).json({ message: 'Unable to delete course' });
  }
};
