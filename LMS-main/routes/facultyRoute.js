const router = require('express').Router();
const { getAllFaculty, getFacultyById, createFaculty, updateFaculty, deleteFaculty, promoteFacultyToAdmin } = require('../controllers/facultyController');
const { isUniqueFaculty } = require('../middleware/isUniqueFaculty');
const { allowRole } = require('../middleware/allowRole');
const { verifyToken } = require('../middleware/verifyToken');
const { ensureSelfOrAdmin } = require('../middleware/ensureSelfOrAdmin');

// Faculty accounts can only be provisioned by an authenticated administrator.
router.get('/faculty', verifyToken, allowRole('admin'), getAllFaculty);
router.get('/faculty/:id', verifyToken, allowRole('admin'), getFacultyById);
router.post('/faculty', verifyToken, allowRole('admin'), isUniqueFaculty, createFaculty);
router.patch('/faculty/:id/promote-admin', verifyToken, allowRole('admin'), promoteFacultyToAdmin);
router.put('/faculty/:id', verifyToken, allowRole('admin', 'faculty'), ensureSelfOrAdmin, updateFaculty);
router.delete('/faculty/:id', verifyToken, allowRole('admin'), deleteFaculty);

module.exports = router;
