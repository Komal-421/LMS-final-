const Student = require('../model/students');
const Faculty = require('../model/faculty');
const { verifyPassword, generateToken } = require('../authHelper/auth');

const COOKIE_NAME = 'lms_token';
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/api',
};

const passwordIsStrong = (value) => typeof value === 'string' && value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
const publicUser = (doc) => {
  const value = doc.toObject ? doc.toObject() : { ...doc };
  delete value.password;
  delete value.__v;
  return value;
};
const handleDuplicate = (error, res) => {
  if (error?.code !== 11000) return false;
  const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'field';
  const labels = { email: 'Email', phone: 'Phone number', enrollment_no: 'Enrollment number', employeeId: 'Employee ID', courseCode: 'Course code' };
  res.status(409).json({ message: `${labels[field] || field} is already registered` });
  return true;
};

module.exports.registerStudent = async (req, res) => {
  try {
    const Course = require('../model/course');
    const { name, email, password, gender, phone, dob, address, enrollment_no, admissionDate, courseId } = req.body || {};
    const required = { name, email, password, gender, phone, dob, address, enrollment_no, admissionDate, courseId };
    const missing = Object.entries(required).filter(([, value]) => value === undefined || value === null || String(value).trim() === '').map(([key]) => key);
    if (missing.length) return res.status(400).json({ message: `Required fields missing: ${missing.join(', ')}` });
    if (!require('mongoose').Types.ObjectId.isValid(courseId)) return res.status(400).json({ message: 'Select a valid course' });
    if (!/^\S+@\S+\.\S+$/.test(String(email).trim())) return res.status(400).json({ message: 'Enter a valid email address' });
    if (!passwordIsStrong(password)) return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, number and special character' });
    if (!/^[0-9]{10,15}$/.test(String(phone))) return res.status(400).json({ message: 'Phone number must contain 10 to 15 digits' });

    // Faculty may create a student only for a course assigned to their own account.
    // Admin sessions may select any course. The department is always derived from that course.
    const courseFilter = { _id: courseId };
    if (!req.isAdmin && req.role === 'faculty') courseFilter.assignedFaculty = req.id;
    const course = await Course.findOne(courseFilter).select('_id department');
    if (!course) return res.status(403).json({ message: 'You can create students only for courses assigned to your account' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await Student.create({
      name: String(name).trim(), email: normalizedEmail, phone: String(phone),
      // The Student model pre-save hook hashes this value. Do not hash it here.
      password, dob, gender, address: String(address).trim(),
      enrollment_no: String(enrollment_no).trim(), department: course.department,
      courses: [course._id], admissionDate, status: 'active', role: 'student',
    });
    return res.status(201).json({ success: true, message: 'Student registered successfully', data: publicUser(user) });
  } catch (error) {
    if (handleDuplicate(error, res)) return;
    if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ message: error.message });
    return res.status(500).json({ message: 'Unable to register student' });
  }
};

module.exports.registerFaculty = async (req, res) => {
  try {
    const { name, email, employeeId, password, experience, department } = req.body || {};
    const required = { name, email, employeeId, password, experience, department };
    const missing = Object.entries(required)
      .filter(([, value]) => value === undefined || value === null || String(value).trim() === '')
      .map(([key]) => key);
    if (missing.length) return res.status(400).json({ message: `Required fields missing: ${missing.join(', ')}` });
    if (!/^\S+@\S+\.\S+$/.test(String(email).trim())) return res.status(400).json({ message: 'Enter a valid email address' });
    if (!passwordIsStrong(password)) return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, number and special character' });
    const years = Number(experience);
    if (!Number.isFinite(years) || years < 0 || years > 60) return res.status(400).json({ message: 'Experience must be a number between 0 and 60' });

    // Public faculty registration can only create a faculty account. It can never create an admin.
    const hashedPassword = await require('bcryptjs').hash(password, 10);
    const faculty = await Faculty.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      employeeId: String(employeeId).trim(),
      password: hashedPassword,
      experience: years,
      department: String(department).trim(),
      role: 'faculty',
    });
    return res.status(201).json({
      success: true,
      message: 'Faculty registration successful. Please sign in.',
      data: publicUser(faculty),
    });
  } catch (error) {
    if (handleDuplicate(error, res)) return;
    if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ message: error.message });
    return res.status(500).json({ message: 'Unable to register faculty' });
  }
};

module.exports.loginUser = async (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password || !['student', 'faculty', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Valid role, email and password are required' });
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    let user;

    if (role === 'student') {
      user = await Student.findOne({ email: normalizedEmail, role: 'student' }).select('+password');
    } else {
      // Fetch the staff account first, then authorize the selected workspace from
      // its independent capabilities. Never change the database's primary role
      // during login: a promoted faculty member remains a faculty member.
      user = await Faculty.findOne({ email: normalizedEmail }).select('+password');
    }

    if (!user || !(await verifyPassword(user.password, password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (role === 'student') {
      if (user.role !== 'student') {
        return res.status(403).json({ message: 'This account does not have student access' });
      }
    } else {
      // Current promoted faculty keep role='faculty' and have adminAccess=true.
      // Legacy accounts may have been changed to role='admin' by an older login
      // flow; for those accounts adminAccess=true is the retained promotion marker.
      const hasFacultyAccess =
        user.role === 'faculty' ||
        user.facultyAccess === true ||
        (user.role === 'admin' && user.adminAccess === true);
      const hasAdminAccess =
        user.role === 'admin' || user.adminAccess === true;

      if (role === 'faculty' && !hasFacultyAccess) {
        return res.status(403).json({ message: 'This account does not have faculty access' });
      }
      if (role === 'admin' && !hasAdminAccess) {
        return res.status(403).json({ message: 'This account does not have admin access' });
      }
    }

    // The selected role defines this login session. A dual-access account can
    // sign out and sign back in under the other role without losing either grant.
    const sessionRole = role;
    const sessionRoles = [role];
    const isAdmin = role === 'admin';
    const token = generateToken(user._id, sessionRole, sessionRoles);
    res.cookie(COOKIE_NAME, token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          ...publicUser(user),
          role: sessionRole,
          roles: sessionRoles,
          isAdmin,
          hasFacultyAccess: user.role === 'faculty' || user.facultyAccess === true || (user.role === 'admin' && user.adminAccess === true),
          hasAdminAccess: user.role === 'admin' || user.adminAccess === true,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Unable to complete login' });
  }
};

module.exports.getCurrentUser = async (req, res) => {
  try {
    const { id, role } = req;
    const Model = role === 'student' ? Student : Faculty;
    const user = await Model.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ success: true, data: { ...publicUser(user), role, roles: req.roles || [role], isAdmin: Boolean(req.isAdmin) } });
  } catch (error) {
    return res.status(400).json({ message: 'Unable to retrieve current user' });
  }
};

module.exports.logoutUser = (req, res) => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api' });
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};
