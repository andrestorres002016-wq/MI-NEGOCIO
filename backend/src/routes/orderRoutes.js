const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Registrar orden (pública al hacer checkout)
router.post('/', orderController.createOrder);

// Rutas administrativas
router.get('/', verifyToken, requireAdmin, orderController.getAllOrders);
router.get('/:id', verifyToken, orderController.getOrderById);
router.patch('/:id/status', verifyToken, requireAdmin, orderController.updateOrderStatus);

module.exports = router;
