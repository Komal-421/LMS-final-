const router = require('express').Router();
const { getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { isUniqueCourse } = require('../middleware/isUniqueCourse');
const { allowRole } = require('../middleware/allowRole');
const { verifyToken } = require('../middleware/verifyToken');

router.get('/courses', verifyToken, getAllCourses);
router.get('/courses/:id', verifyToken, getCourseById);
router.post('/courses', verifyToken, allowRole('admin', 'faculty'), isUniqueCourse, createCourse);
router.put('/courses/:id', verifyToken, allowRole('admin'), updateCourse);
router.delete('/courses/:id', verifyToken, allowRole('admin'), deleteCourse);

module.exports = router;
