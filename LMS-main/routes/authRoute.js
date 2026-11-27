const router = require('express').Router();
const { verifyToken } = require('../middleware/verifyToken');
const { loginUser, getCurrentUser, logoutUser } = require('../controllers/authController');

// Account creation is intentionally not public. Admins create student/faculty accounts
// through the protected /students and /faculty routes. The first admin is bootstrapped
// with the one-time create-admin script.
router.post('/auth/login', loginUser);
router.get('/auth/me', verifyToken, getCurrentUser);
router.post('/auth/logout', logoutUser);

module.exports = router;
