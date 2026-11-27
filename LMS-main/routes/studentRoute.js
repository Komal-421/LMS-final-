const router = require('express').Router();
const { getAllStudents, getStudentById, updateStudent, deleteStudent } = require('../controllers/studentController');
const { registerStudent } = require('../controllers/authController');
const { isUniqueStudent } = require('../middleware/isUniqueStudent');
const { allowRole } = require('../middleware/allowRole');
const { verifyToken } = require('../middleware/verifyToken');
const { checkUpdates } = require('../middleware/checkUpdates');
const { ensureSelfOrAdmin } = require('../middleware/ensureSelfOrAdmin');

// Admins can register into any course; faculty are restricted to their assigned courses in the controller.
router.post('/students', verifyToken, allowRole('admin', 'faculty'), isUniqueStudent, registerStudent);
router.get('/students', verifyToken, allowRole('admin', 'faculty'), getAllStudents);
router.get('/students/:id', verifyToken, allowRole('admin', 'faculty', 'student'), getStudentById);
router.put('/students/:id', verifyToken, allowRole('admin', 'student'), ensureSelfOrAdmin, checkUpdates, updateStudent);
router.delete('/students/:id', verifyToken, allowRole('admin'), deleteStudent);

module.exports = router;
