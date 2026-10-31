const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriberController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.post('/', subscriberController.subscribe);
router.get('/', verifyToken, requireAdmin, subscriberController.getAllSubscribers);

module.exports = router;
