const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'abica_jwt_super_secret_key_2026_xyz987';

async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado: Se requiere token de autenticación (Bearer).'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Obtener datos del usuario desde la base de datos
    const result = await query(
      'SELECT id, name, first_name, last_name, email, role, phone, address, city, department FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Sesión inválida: El usuario ya no existe.'
      });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token de autenticación inválido.'
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado: Se requieren privilegios de Administrador para acceder a esta sección.'
    });
  }
  next();
}

module.exports = {
  verifyToken,
  requireAdmin
};
