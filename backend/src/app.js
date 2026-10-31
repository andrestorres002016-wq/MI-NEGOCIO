const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const statsRoutes = require('./routes/statsRoutes');
const subscriberRoutes = require('./routes/subscriberRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Configuración de Seguridad y CORS
app.use(helmet({
  contentSecurityPolicy: false, // Permitir fuentes e imágenes de Unsplash y Google Fonts
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares estándar
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Ruta de comprobación de salud del sistema
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ÁBICA Muebles API & Admin Service',
    database: 'PostgreSQL Dockerized',
    timestamp: new Date().toISOString()
  });
});

// Registrar Rutas de la API REST
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', statsRoutes);
app.use('/api/subscribers', subscriberRoutes);

// Servir la Consola Administrativa en /consola (o /consola/)
app.get(['/consola', '/consola/'], (req, res) => {
  res.sendFile(path.join(__dirname, '../../consola.html'));
});

// Servir estáticos de la tienda (frontend)
app.use(express.static(path.join(__dirname, '../../')));

// Fallback para SPA o navegación directa a la tienda
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../index.html'));
});

// Middleware centralizado de manejo de errores
app.use(errorHandler);

module.exports = app;
