const { query, pool } = require('../config/db');

// Formato helper para devolver órdenes estructuradas
function formatOrder(orderRow, itemsRows = []) {
  return {
    id: orderRow.id,
    orderNumber: orderRow.order_number,
    customerName: orderRow.customer_name,
    customerEmail: orderRow.customer_email,
    customerPhone: orderRow.customer_phone,
    customerAddress: orderRow.customer_address,
    paymentMethod: orderRow.payment_method,
    subtotal: Number(orderRow.subtotal),
    shippingCost: Number(orderRow.shipping_cost || 0),
    discount: Number(orderRow.discount || 0),
    total: Number(orderRow.total),
    status: orderRow.status,
    notes: orderRow.notes,
    createdAt: orderRow.created_at,
    updatedAt: orderRow.updated_at,
    items: itemsRows.map(item => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      price: Number(item.price),
      quantity: Number(item.quantity),
      color: item.color,
      image: item.image,
      subtotal: Number(item.subtotal)
    }))
  };
}

// Crear nuevo pedido (Checkout)
async function createOrder(req, res, next) {
  const client = await pool.connect();
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      paymentMethod,
      items,
      subtotal,
      shippingCost,
      discount,
      total,
      notes
    } = req.body;

    if (!customerName || !customerEmail || !customerAddress || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos para procesar la orden de compra.'
      });
    }

    // Generar código de pedido único: AB-YYYY-XXXX
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `AB-${year}-${randomSuffix}`;

    await client.query('BEGIN');

    // 1. Insertar orden principal
    const orderInsert = await client.query(`
      INSERT INTO orders (
        order_number, customer_name, customer_email, customer_phone,
        customer_address, payment_method, subtotal, shipping_cost, discount, total, status, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDIENTE', $11
      ) RETURNING *
    `, [
      orderNumber,
      customerName.trim(),
      customerEmail.trim(),
      customerPhone || '',
      customerAddress.trim(),
      paymentMethod || 'Transferencia / PSE',
      Number(subtotal || total),
      Number(shippingCost || 0),
      Number(discount || 0),
      Number(total),
      notes || ''
    ]);

    const createdOrder = orderInsert.rows[0];
    const insertedItems = [];

    // 2. Insertar cada producto del carrito en order_items
    for (const item of items) {
      const itemPrice = Number(item.price);
      const itemQty = Number(item.quantity || 1);
      const itemSubtotal = itemPrice * itemQty;

      const itemInsert = await client.query(`
        INSERT INTO order_items (
          order_id, product_id, product_name, price, quantity, color, image, subtotal
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        ) RETURNING *
      `, [
        createdOrder.id,
        item.productId || item.id || null,
        item.productName || item.name,
        itemPrice,
        itemQty,
        item.selectedColor || item.color || '',
        item.image || '',
        itemSubtotal
      ]);

      insertedItems.push(itemInsert.rows[0]);

      // Descontar inventario si existe product_id
      const pId = item.productId || item.id;
      if (pId) {
        await client.query(`
          UPDATE products
          SET stock_quantity = GREATEST(0, stock_quantity - $1),
              in_stock = CASE WHEN (stock_quantity - $1) <= 0 THEN false ELSE in_stock END,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [itemQty, pId]);
      }
    }

    await client.query('COMMIT');

    const formattedOrder = formatOrder(createdOrder, insertedItems);

    return res.status(201).json({
      success: true,
      message: '¡Pedido registrado con éxito en el servidor!',
      order: formattedOrder
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// Obtener todas las órdenes (solo ADMIN)
async function getAllOrders(req, res, next) {
  try {
    const { status, search } = req.query;

    let queryText = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status && status !== 'TODOS') {
      params.push(status.toUpperCase());
      queryText += ` AND status = $${params.length}`;
    }

    if (search && search.trim() !== '') {
      params.push(`%${search.trim().toLowerCase()}%`);
      queryText += ` AND (LOWER(order_number) LIKE $${params.length} OR LOWER(customer_name) LIKE $${params.length} OR LOWER(customer_email) LIKE $${params.length})`;
    }

    queryText += ' ORDER BY created_at DESC';

    const ordersResult = await query(queryText, params);
    const ordersList = [];

    // Obtener items para cada orden
    for (const order of ordersResult.rows) {
      const itemsResult = await query(
        'SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC',
        [order.id]
      );
      ordersList.push(formatOrder(order, itemsResult.rows));
    }

    return res.json({
      success: true,
      count: ordersList.length,
      orders: ordersList
    });
  } catch (err) {
    next(err);
  }
}

// Obtener orden por ID
async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Orden con ID #${id} no encontrada.`
      });
    }

    const itemsResult = await query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC',
      [id]
    );

    return res.json({
      success: true,
      order: formatOrder(orderResult.rows[0], itemsResult.rows)
    });
  } catch (err) {
    next(err);
  }
}

// Actualizar estado de una orden (solo ADMIN)
async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['PENDIENTE', 'CONFIRMADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}`
      });
    }

    const upperStatus = status.toUpperCase();

    const result = await query(`
      UPDATE orders
      SET status = $1,
          notes = COALESCE($2, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [upperStatus, notes !== undefined ? notes : null, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Orden con ID #${id} no encontrada.`
      });
    }

    const itemsResult = await query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC',
      [id]
    );

    return res.json({
      success: true,
      message: `Estado de la orden #${result.rows[0].order_number} actualizado a "${upperStatus}".`,
      order: formatOrder(result.rows[0], itemsResult.rows)
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus
};
