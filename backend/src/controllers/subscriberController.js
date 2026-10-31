const { query } = require('../config/db');

// Suscripción al Newsletter
async function subscribe(req, res, next) {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingresa un correo electrónico válido.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Insertar o ignorar si ya existe
    const result = await query(`
      INSERT INTO subscribers (email)
      VALUES ($1)
      ON CONFLICT (email) DO NOTHING
      RETURNING *
    `, [cleanEmail]);

    return res.status(200).json({
      success: true,
      message: '¡Gracias por suscribirte al newsletter de ÁBICA!'
    });
  } catch (err) {
    next(err);
  }
}

// Listar todos los suscriptores (solo ADMIN)
async function getAllSubscribers(req, res, next) {
  try {
    const result = await query('SELECT * FROM subscribers ORDER BY created_at DESC');

    return res.json({
      success: true,
      count: result.rows.length,
      subscribers: result.rows
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  subscribe,
  getAllSubscribers
};
