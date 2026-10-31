/**
 * Test Suite Integral para Backend de ÁBICA (Node.js + Express + PostgreSQL + Consola)
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let adminToken = '';
let testOrderId = null;
let testOrderNumber = '';
let testProductId = null;

let passed = 0;
let failed = 0;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = { ...headers };
    let postData = null;

    if (body) {
      postData = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      url,
      { method, headers: reqHeaders },
      (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          let data;
          try {
            data = JSON.parse(raw);
          } catch (e) {
            data = raw;
          }
          resolve({ status: res.statusCode, headers: res.headers, data });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTest(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  \x1b[32m[PASS]\x1b[0m ${name}`);
  } catch (err) {
    failed++;
    console.error(`  \x1b[31m[FAIL]\x1b[0m ${name}: ${err.message}`);
  }
}

async function runAll() {
  console.log('\n======================================================');
  console.log(' SUITE DE PRUEBAS AUTOMATIZADAS DE BACKEND (ÁBICA)');
  console.log('======================================================');

  // 1. Health Check
  await runTest('Health Check responde 200 y confirma PostgreSQL Docker', async () => {
    const res = await request('GET', '/api/health');
    if (res.status !== 200 || res.data.database !== 'PostgreSQL Dockerized') {
      throw new Error(`Estado inesperado: ${res.status}`);
    }
  });

  // 2. Ruta /consola
  await runTest('Ruta /consola devuelve consola.html con HTTP 200', async () => {
    const res = await request('GET', '/consola');
    if (res.status !== 200 || typeof res.data !== 'string' || !res.data.includes('ÁBICA Consola')) {
      throw new Error('No se sirvió la página de la Consola Administrativa');
    }
  });

  // 3. Catálogo de 18 productos en PostgreSQL
  await runTest('GET /api/products retorna los 18 productos de la base de datos', async () => {
    const res = await request('GET', '/api/products');
    if (res.status !== 200 || !res.data.success || res.data.count !== 18) {
      throw new Error(`Conteo de productos inválido: ${res.data?.count}`);
    }
  });

  // 4. Autenticación Administrador
  await runTest('POST /api/auth/login valida credenciales admin@abica.com y devuelve JWT', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'admin@abica.com',
      password: 'admin1234'
    });
    if (res.status !== 200 || !res.data.token || res.data.user.role !== 'ADMIN') {
      throw new Error('Fallo al autenticar administrador');
    }
    adminToken = res.data.token;
  });

  // 5. Estadísticas de Admin (Ruta protegida)
  await runTest('GET /api/admin/stats devuelve KPIs protegidos por JWT', async () => {
    const res = await request('GET', '/api/admin/stats', null, {
      'Authorization': `Bearer ${adminToken}`
    });
    if (res.status !== 200 || !res.data.success || !res.data.stats.financial) {
      throw new Error('No se obtuvieron las estadísticas');
    }
  });

  // 6. Creación de Pedido (Checkout público)
  await runTest('POST /api/orders guarda compra y genera código único en PostgreSQL', async () => {
    const res = await request('POST', '/api/orders', {
      customerName: 'Prueba Automatizada',
      customerEmail: 'cliente.prueba@abica.com',
      customerPhone: '3001234567',
      customerAddress: 'Carrera 7 # 72-10, Bogotá',
      paymentMethod: 'Transferencia / PSE',
      subtotal: 3290000,
      shippingCost: 0,
      discount: 0,
      total: 3290000,
      items: [
        {
          productId: 1,
          productName: 'Sofá Modular Malmö',
          price: 3290000,
          quantity: 1,
          color: 'Beige Marfil',
          image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=200&q=80'
        }
      ]
    });
    if (res.status !== 201 || !res.data.order || !res.data.order.orderNumber) {
      throw new Error('No se creó la orden correctamente');
    }
    testOrderId = res.data.order.id;
    testOrderNumber = res.data.order.orderNumber;
  });

  // 7. Actualización de Estado de la Orden por Admin
  await runTest('PATCH /api/orders/:id/status actualiza estado a CONFIRMADO', async () => {
    const res = await request('PATCH', `/api/orders/${testOrderId}/status`, {
      status: 'CONFIRMADO',
      notes: 'Confirmado por prueba automática'
    }, {
      'Authorization': `Bearer ${adminToken}`
    });
    if (res.status !== 200 || res.data.order.status !== 'CONFIRMADO') {
      throw new Error('Fallo al actualizar estado del pedido');
    }
  });

  // 8. Suscriptor de Newsletter
  await runTest('POST /api/subscribers almacena correo en tabla subscribers', async () => {
    const res = await request('POST', '/api/subscribers', {
      email: 'newsletter.test@abica.com'
    });
    if (res.status !== 200 || !res.data.success) {
      throw new Error('Fallo al guardar suscriptor');
    }
  });

  // 9. CRUD de Muebles por Administrador (Creación y Eliminación)
  await runTest('POST & DELETE /api/products crea y elimina mueble en PostgreSQL', async () => {
    // Crear
    const createRes = await request('POST', '/api/products', {
      name: 'Mueble Test Exclusivo',
      price: 990000,
      category: 'Mesas auxiliares',
      material: 'Roble macizo',
      color: 'Roble Natural',
      dimensions: '40 x 40 x 50 cm',
      image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=300&q=80',
      badge: 'Nuevo',
      inStock: true,
      stockQuantity: 10
    }, {
      'Authorization': `Bearer ${adminToken}`
    });

    if (createRes.status !== 201 || !createRes.data.product) {
      throw new Error('Fallo al crear producto');
    }

    testProductId = createRes.data.product.id;

    // Eliminar
    const delRes = await request('DELETE', `/api/products/${testProductId}`, null, {
      'Authorization': `Bearer ${adminToken}`
    });

    if (delRes.status !== 200 || !delRes.data.success) {
      throw new Error('Fallo al eliminar producto creado');
    }
  });

  // 10. Directorio de Usuarios
  await runTest('GET /api/auth/users lista usuarios registrados (Admin only)', async () => {
    const res = await request('GET', '/api/auth/users', null, {
      'Authorization': `Bearer ${adminToken}`
    });
    if (res.status !== 200 || !res.data.users || res.data.users.length < 2) {
      throw new Error('No se obtuvo el listado de usuarios');
    }
  });

  console.log('======================================================');
  console.log(` RESULTADOS: ${passed} pasadas de ${passed + failed} pruebas (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runAll();
