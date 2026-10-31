const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/stats', verifyToken, requireAdmin, statsController.getAdminStats);

module.exports = router;
