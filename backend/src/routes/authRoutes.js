const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', verifyToken, authController.getProfile);
router.get('/users', verifyToken, requireAdmin, authController.getAllUsers);

module.exports = router;
