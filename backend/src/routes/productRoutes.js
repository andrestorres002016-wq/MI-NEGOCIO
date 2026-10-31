const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Rutas públicas
router.get('/', productController.getAllProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProductById);

// Rutas administrativas protegidas
router.post('/', verifyToken, requireAdmin, productController.createProduct);
router.put('/:id', verifyToken, requireAdmin, productController.updateProduct);
router.patch('/:id/toggle-stock', verifyToken, requireAdmin, productController.toggleStock);
router.delete('/:id', verifyToken, requireAdmin, productController.deleteProduct);

module.exports = router;
