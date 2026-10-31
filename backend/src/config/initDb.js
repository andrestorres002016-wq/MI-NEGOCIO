const { query, pool } = require('./db');
const bcrypt = require('bcryptjs');
const { initialProducts, demoUsers } = require('../seed/seedData');
require('dotenv').config();

async function initDatabase() {
  console.log('[PostgreSQL] Verificando e inicializando esquema de base de datos...');

  try {
    // 1. Tabla de Usuarios
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'CUSTOMER',
        phone VARCHAR(50),
        address VARCHAR(255),
        city VARCHAR(100) DEFAULT 'Bogotá D.C.',
        department VARCHAR(100) DEFAULT 'Bogotá D.C.',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Tabla de Productos
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price NUMERIC(12, 2) NOT NULL,
        original_price NUMERIC(12, 2),
        category VARCHAR(100) NOT NULL,
        material VARCHAR(150),
        color VARCHAR(100),
        color_hex VARCHAR(20),
        dimensions VARCHAR(100),
        image TEXT NOT NULL,
        gallery JSONB DEFAULT '[]'::jsonb,
        description TEXT,
        features JSONB DEFAULT '[]'::jsonb,
        rating NUMERIC(3, 1) DEFAULT 5.0,
        reviews_count INT DEFAULT 0,
        badge VARCHAR(50),
        in_stock BOOLEAN DEFAULT true,
        stock_quantity INT DEFAULT 15,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Tabla de Pedidos (Orders)
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(150) NOT NULL,
        customer_email VARCHAR(150) NOT NULL,
        customer_phone VARCHAR(50),
        customer_address TEXT NOT NULL,
        payment_method VARCHAR(100) NOT NULL,
        subtotal NUMERIC(12, 2) NOT NULL,
        shipping_cost NUMERIC(12, 2) DEFAULT 0,
        discount NUMERIC(12, 2) DEFAULT 0,
        total NUMERIC(12, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDIENTE',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Tabla de Detalles de Pedido (Order Items)
    await query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id) ON DELETE SET NULL,
        product_name VARCHAR(255) NOT NULL,
        price NUMERIC(12, 2) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        color VARCHAR(100),
        image TEXT,
        subtotal NUMERIC(12, 2) NOT NULL
      );
    `);

    // 5. Tabla de Suscriptores (Newsletter)
    await query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(150) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Índices para optimizar consultas frecuentes
    await query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);

    console.log('[PostgreSQL] Tablas e índices verificados.');

    // 6. Verificar o crear Usuario Administrador por defecto
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@abica.com';
    const adminPass = process.env.ADMIN_DEFAULT_PASSWORD || 'admin1234';
    const adminName = process.env.ADMIN_DEFAULT_NAME || 'Administrador ÁBICA';

    const checkAdmin = await query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (checkAdmin.rows.length === 0) {
      const hash = await bcrypt.hash(adminPass, 10);
      await query(`
        INSERT INTO users (name, first_name, last_name, email, password_hash, role, phone, address, city, department)
        VALUES ($1, $2, $3, $4, $5, 'ADMIN', $6, $7, $8, $9)
      `, [
        adminName,
        'Administrador',
        'ÁBICA',
        adminEmail,
        hash,
        '+57 300 000 0000',
        'Sede Principal ÁBICA, Bogotá',
        'Bogotá D.C.',
        'Bogotá D.C.'
      ]);
      console.log(`[PostgreSQL] Usuario Administrador creado: ${adminEmail} (Contraseña: ${adminPass})`);
    }

    // 7. Verificar usuario demo de cliente
    for (const demoUser of demoUsers) {
      const checkUser = await query('SELECT id FROM users WHERE email = $1', [demoUser.email]);
      if (checkUser.rows.length === 0) {
        const userHash = await bcrypt.hash(demoUser.password, 10);
        await query(`
          INSERT INTO users (name, first_name, last_name, email, password_hash, role, phone, address, city, department)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          demoUser.name,
          demoUser.firstName,
          demoUser.lastName,
          demoUser.email,
          userHash,
          demoUser.role || 'CUSTOMER',
          demoUser.phone,
          demoUser.address,
          demoUser.city,
          demoUser.department
        ]);
        console.log(`[PostgreSQL] Usuario demo creado: ${demoUser.email}`);
      }
    }

    // 8. Poblar catálogo de productos si está vacío
    const checkProducts = await query('SELECT COUNT(*) FROM products');
    const count = parseInt(checkProducts.rows[0].count, 10);
    if (count === 0) {
      console.log('[PostgreSQL] Poblando catálogo inicial de 18 productos en base de datos...');
      for (const p of initialProducts) {
        await query(`
          INSERT INTO products (
            id, name, price, original_price, category, material, color, color_hex,
            dimensions, image, gallery, description, features, rating, reviews_count,
            badge, in_stock, stock_quantity
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
          )
        `, [
          p.id,
          p.name,
          p.price,
          p.originalPrice,
          p.category,
          p.material,
          p.color,
          p.colorHex,
          p.dimensions,
          p.image,
          JSON.stringify(p.gallery || []),
          p.description,
          JSON.stringify(p.features || []),
          p.rating,
          p.reviewsCount,
          p.badge,
          p.inStock,
          p.stockQuantity || 15
        ]);
      }
      // Actualizar secuencia de autoincremento para IDs siguientes
      await query(`SELECT setval(pg_get_serial_sequence('products', 'id'), (SELECT MAX(id) FROM products));`);
      console.log(`[PostgreSQL] ${initialProducts.length} productos insertados exitosamente.`);
    } else {
      console.log(`[PostgreSQL] El catálogo ya cuenta con ${count} productos.`);
    }

    // 9. Insertar pedido de ejemplo si la tabla de pedidos está vacía para que el Admin Dashboard tenga datos
    const checkOrders = await query('SELECT COUNT(*) FROM orders');
    const ordersCount = parseInt(checkOrders.rows[0].count, 10);
    if (ordersCount === 0) {
      const sampleOrderNum = `AB-${new Date().getFullYear()}-1001`;
      const orderInsert = await query(`
        INSERT INTO orders (
          order_number, customer_name, customer_email, customer_phone,
          customer_address, payment_method, subtotal, shipping_cost, discount, total, status, notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        ) RETURNING id
      `, [
        sampleOrderNum,
        'Camila Restrepo',
        'camila.restrepo@email.com',
        '3104567890',
        'Calle 85 # 11-53, Apto 402, Bogotá D.C.',
        'Transferencia / PSE',
        4780000,
        0,
        0,
        4780000,
        'CONFIRMADO',
        'Primer pedido de demostración de inauguración'
      ]);

      const orderId = orderInsert.rows[0].id;
      await query(`
        INSERT INTO order_items (order_id, product_id, product_name, price, quantity, color, image, subtotal)
        VALUES
          ($1, 1, 'Sofá Modular Malmö', 3290000, 1, 'Beige Marfil', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80', 3290000),
          ($1, 2, 'Sillón Lounge Vester', 1490000, 1, 'Roble Natural', 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=80', 1490000)
      `, [orderId]);
      console.log('[PostgreSQL] Pedido de muestra inicial registrado.');
    }

    console.log('[PostgreSQL] Base de datos inicializada correctamente.');
    return true;
  } catch (err) {
    console.error('[PostgreSQL] Error al inicializar base de datos:', err);
    throw err;
  }
}

module.exports = { initDatabase };
