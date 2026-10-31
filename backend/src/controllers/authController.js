const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'abica_jwt_super_secret_key_2026_xyz987';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Iniciar sesión (para clientes y administradores)
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporciona correo electrónico y contraseña.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = await query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. Revisa tu correo o contraseña.'
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. Revisa tu correo o contraseña.'
      });
    }

    const token = generateToken(user);

    // No retornar el hash en la respuesta
    const safeUser = {
      id: user.id,
      name: user.name,
      firstName: user.first_name || user.name.split(' ')[0],
      lastName: user.last_name || '',
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      city: user.city,
      department: user.department,
      createdAt: user.created_at
    };

    return res.json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      token,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
}

// Registro de nuevos usuarios
async function register(req, res, next) {
  try {
    const { name, email, password, phone, address, city, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, correo y contraseña son obligatorios.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Comprobar si ya existe el correo
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una cuenta registrada con este correo electrónico.'
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    const insertResult = await query(`
      INSERT INTO users (name, first_name, last_name, email, password_hash, role, phone, address, city, department)
      VALUES ($1, $2, $3, $4, $5, 'CUSTOMER', $6, $7, $8, $9)
      RETURNING id, name, first_name, last_name, email, role, phone, address, city, department, created_at
    `, [
      name.trim(),
      firstName,
      lastName,
      cleanEmail,
      passwordHash,
      phone || '',
      address || '',
      city || 'Bogotá D.C.',
      department || 'Bogotá D.C.'
    ]);

    const newUser = insertResult.rows[0];
    const token = generateToken(newUser);

    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      address: newUser.address,
      city: newUser.city,
      department: newUser.department,
      createdAt: newUser.created_at
    };

    return res.status(201).json({
      success: true,
      message: 'Cuenta creada exitosamente.',
      token,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
}

// Obtener perfil autenticado
async function getProfile(req, res) {
  return res.json({
    success: true,
    user: req.user
  });
}

// Listar todos los usuarios (solo ADMIN)
async function getAllUsers(req, res, next) {
  try {
    const result = await query(`
      SELECT id, name, first_name, last_name, email, role, phone, address, city, department, created_at
      FROM users
      ORDER BY created_at DESC
    `);

    return res.json({
      success: true,
      count: result.rows.length,
      users: result.rows
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  register,
  getProfile,
  getAllUsers
};
