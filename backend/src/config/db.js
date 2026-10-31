const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'abica_admin',
  password: process.env.DB_PASSWORD || 'AbicaMuebles2026!',
  database: process.env.DB_NAME || 'abica_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Error inesperado en el cliente del pool:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
