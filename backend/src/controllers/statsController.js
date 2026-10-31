const { query } = require('../config/db');

// Métricas y estadísticas para el panel administrativo
async function getAdminStats(req, res, next) {
  try {
    // 1. Total ventas (excluyendo cancelados)
    const salesResult = await query(`
      SELECT COALESCE(SUM(total), 0) AS total_sales
      FROM orders
      WHERE status != 'CANCELADO'
    `);
    const totalSales = Number(salesResult.rows[0].total_sales);

    // 2. Conteo de pedidos por estado
    const ordersStatsResult = await query(`
      SELECT
        COUNT(*) AS total_orders,
        COUNT(CASE WHEN status = 'PENDIENTE' THEN 1 END) AS pending_orders,
        COUNT(CASE WHEN status = 'CONFIRMADO' THEN 1 END) AS confirmed_orders,
        COUNT(CASE WHEN status = 'ENVIADO' THEN 1 END) AS shipped_orders,
        COUNT(CASE WHEN status = 'ENTREGADO' THEN 1 END) AS delivered_orders,
        COUNT(CASE WHEN status = 'CANCELADO' THEN 1 END) AS cancelled_orders
      FROM orders
    `);
    const ordersStats = ordersStatsResult.rows[0];

    // 3. Conteo de productos e inventario
    const productsStatsResult = await query(`
      SELECT
        COUNT(*) AS total_products,
        COUNT(CASE WHEN in_stock = true THEN 1 END) AS active_products,
        COUNT(CASE WHEN in_stock = false OR stock_quantity <= 5 THEN 1 END) AS low_stock_products
      FROM products
    `);
    const productsStats = productsStatsResult.rows[0];

    // 4. Conteo de suscriptores y clientes
    const usersCountResult = await query(`
      SELECT
        COUNT(CASE WHEN role = 'CUSTOMER' THEN 1 END) AS total_customers,
        COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) AS total_admins
      FROM users
    `);
    const subscribersCountResult = await query(`SELECT COUNT(*) AS total_subscribers FROM subscribers`);

    // 5. Últimos 5 pedidos recientes
    const recentOrdersResult = await query(`
      SELECT id, order_number, customer_name, customer_email, total, status, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // 6. Distribución de catálogo por categoría
    const categoryDistributionResult = await query(`
      SELECT category, COUNT(*) as count
      FROM products
      GROUP BY category
      ORDER BY count DESC
    `);

    return res.json({
      success: true,
      stats: {
        financial: {
          totalSales,
          totalSalesFormatted: new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
          }).format(totalSales)
        },
        orders: {
          total: Number(ordersStats.total_orders),
          pending: Number(ordersStats.pending_orders),
          confirmed: Number(ordersStats.confirmed_orders),
          shipped: Number(ordersStats.shipped_orders),
          delivered: Number(ordersStats.delivered_orders),
          cancelled: Number(ordersStats.cancelled_orders)
        },
        inventory: {
          totalProducts: Number(productsStats.total_products),
          activeProducts: Number(productsStats.active_products),
          lowStockProducts: Number(productsStats.low_stock_products)
        },
        audience: {
          customers: Number(usersCountResult.rows[0].total_customers),
          admins: Number(usersCountResult.rows[0].total_admins),
          subscribers: Number(subscribersCountResult.rows[0].total_subscribers)
        },
        recentOrders: recentOrdersResult.rows.map(o => ({
          id: o.id,
          orderNumber: o.order_number,
          customerName: o.customer_name,
          customerEmail: o.customer_email,
          total: Number(o.total),
          status: o.status,
          createdAt: o.created_at
        })),
        categories: categoryDistributionResult.rows.map(c => ({
          category: c.category,
          count: Number(c.count)
        }))
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminStats
};
