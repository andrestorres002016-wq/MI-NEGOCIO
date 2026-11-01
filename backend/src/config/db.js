const { Pool } = require('pg');
require('dotenv').config();

// Determinar si la conexión es remota (ej: Supabase, Neon, Render, Railway) o local
const isRemoteConnection = Boolean(
  process.env.DATABASE_URL ||
  (process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1') ||
  process.env.DB_SSL === 'true'
);

// Configuración del Pool compatible tanto con PostgreSQL Docker local como con Supabase Cloud
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: isRemoteConnection ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'abica_admin',
      password: process.env.DB_PASSWORD || 'AbicaMuebles2026!',
      database: process.env.DB_NAME || 'abica_db',
      ssl: isRemoteConnection ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  // Conexión establecida con éxito
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Error inesperado en el cliente del pool:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
