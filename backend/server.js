require('dotenv').config();
const app = require('./src/app');
const { initDatabase } = require('./src/config/initDb');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('----------------------------------------------------');
    console.log('  ÁBICA — Muebles & Espacios Contemporáneos');
    console.log('  Iniciando Backend con Node.js, Express y PostgreSQL');
    console.log('----------------------------------------------------');

    // 1. Inicializar esquema de Base de Datos PostgreSQL
    await initDatabase();

    // 2. Iniciar servidor Express
    app.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
      console.log(`🌐 Tienda Pública:      http://localhost:${PORT}/`);
      console.log(`👑 Consola Admin:       http://localhost:${PORT}/consola`);
      console.log(`🩺 Health Check:        http://localhost:${PORT}/api/health`);
      console.log(`📦 API Productos:       http://localhost:${PORT}/api/products`);
      console.log('====================================================');
      console.log('🔐 Credenciales de Administrador por Defecto:');
      console.log(`   Usuario:   ${process.env.ADMIN_DEFAULT_EMAIL || 'admin@abica.com'}`);
      console.log(`   Clave:     ${process.env.ADMIN_DEFAULT_PASSWORD || 'admin1234'}`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error('❌ Error crítico al arrancar el servidor:', err);
    process.exit(1);
  }
}

startServer();
