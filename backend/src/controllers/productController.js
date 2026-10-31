const { query } = require('../config/db');

// Función helper para mapear fila de base de datos a formato esperado por el frontend
function formatProduct(row) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : null,
    category: row.category,
    material: row.material,
    color: row.color,
    colorHex: row.color_hex,
    dimensions: row.dimensions,
    image: row.image,
    gallery: typeof row.gallery === 'string' ? JSON.parse(row.gallery) : (row.gallery || []),
    description: row.description,
    features: typeof row.features === 'string' ? JSON.parse(row.features) : (row.features || []),
    rating: Number(row.rating || 5.0),
    reviewsCount: Number(row.reviews_count || 0),
    badge: row.badge,
    inStock: Boolean(row.in_stock),
    stockQuantity: Number(row.stock_quantity || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Obtener todos los productos con soporte de filtros y ordenamiento
async function getAllProducts(req, res, next) {
  try {
    const { category, search, minPrice, maxPrice, inStock, sort } = req.query;

    let queryText = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category && category !== 'Todos') {
      params.push(category);
      queryText += ` AND category = $${params.length}`;
    }

    if (search && search.trim() !== '') {
      params.push(`%${search.trim().toLowerCase()}%`);
      queryText += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(description) LIKE $${params.length} OR LOWER(material) LIKE $${params.length})`;
    }

    if (minPrice) {
      params.push(Number(minPrice));
      queryText += ` AND price >= $${params.length}`;
    }

    if (maxPrice) {
      params.push(Number(maxPrice));
      queryText += ` AND price <= $${params.length}`;
    }

    if (inStock !== undefined) {
      params.push(inStock === 'true' || inStock === true);
      queryText += ` AND in_stock = $${params.length}`;
    }

    // Ordenamiento
    if (sort === 'price-asc') {
      queryText += ' ORDER BY price ASC';
    } else if (sort === 'price-desc') {
      queryText += ' ORDER BY price DESC';
    } else if (sort === 'name-asc') {
      queryText += ' ORDER BY name ASC';
    } else if (sort === 'name-desc') {
      queryText += ' ORDER BY name DESC';
    } else if (sort === 'rating') {
      queryText += ' ORDER BY rating DESC, reviews_count DESC';
    } else {
      queryText += ' ORDER BY id ASC';
    }

    const result = await query(queryText, params);
    const formatted = result.rows.map(formatProduct);

    return res.json({
      success: true,
      count: formatted.length,
      products: formatted
    });
  } catch (err) {
    next(err);
  }
}

// Obtener un producto por ID
async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Producto con ID #${id} no encontrado.`
      });
    }

    return res.json({
      success: true,
      product: formatProduct(result.rows[0])
    });
  } catch (err) {
    next(err);
  }
}

// Obtener categorías únicas disponibles
async function getCategories(req, res, next) {
  try {
    const result = await query('SELECT DISTINCT category FROM products ORDER BY category ASC');
    const categories = ['Todos', ...result.rows.map(r => r.category)];
    return res.json({
      success: true,
      categories
    });
  } catch (err) {
    next(err);
  }
}

// Crear nuevo producto (solo ADMIN)
async function createProduct(req, res, next) {
  try {
    const {
      name,
      price,
      originalPrice,
      category,
      material,
      color,
      colorHex,
      dimensions,
      image,
      gallery,
      description,
      features,
      badge,
      inStock,
      stockQuantity
    } = req.body;

    if (!name || !price || !category || !image) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, precio, categoría e imagen principal son requeridos.'
      });
    }

    const result = await query(`
      INSERT INTO products (
        name, price, original_price, category, material, color, color_hex,
        dimensions, image, gallery, description, features, badge, in_stock, stock_quantity
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      ) RETURNING *
    `, [
      name.trim(),
      Number(price),
      originalPrice ? Number(originalPrice) : null,
      category,
      material || 'Madera y tapicería',
      color || 'Natural',
      colorHex || '#A87950',
      dimensions || 'Estándar',
      image.trim(),
      JSON.stringify(gallery || [image.trim()]),
      description || '',
      JSON.stringify(features || []),
      badge || null,
      inStock !== undefined ? Boolean(inStock) : true,
      stockQuantity ? Number(stockQuantity) : 10
    ]);

    return res.status(201).json({
      success: true,
      message: 'Mueble agregado exitosamente al catálogo.',
      product: formatProduct(result.rows[0])
    });
  } catch (err) {
    next(err);
  }
}

// Actualizar un producto existente (solo ADMIN)
async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      originalPrice,
      category,
      material,
      color,
      colorHex,
      dimensions,
      image,
      gallery,
      description,
      features,
      badge,
      inStock,
      stockQuantity,
      rating,
      reviewsCount
    } = req.body;

    // Verificar si el producto existe
    const exists = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `El producto con ID #${id} no existe.`
      });
    }

    const current = exists.rows[0];

    const result = await query(`
      UPDATE products SET
        name = $1,
        price = $2,
        original_price = $3,
        category = $4,
        material = $5,
        color = $6,
        color_hex = $7,
        dimensions = $8,
        image = $9,
        gallery = $10,
        description = $11,
        features = $12,
        badge = $13,
        in_stock = $14,
        stock_quantity = $15,
        rating = $16,
        reviews_count = $17,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $18
      RETURNING *
    `, [
      name !== undefined ? name.trim() : current.name,
      price !== undefined ? Number(price) : current.price,
      originalPrice !== undefined ? (originalPrice ? Number(originalPrice) : null) : current.original_price,
      category !== undefined ? category : current.category,
      material !== undefined ? material : current.material,
      color !== undefined ? color : current.color,
      colorHex !== undefined ? colorHex : current.color_hex,
      dimensions !== undefined ? dimensions : current.dimensions,
      image !== undefined ? image.trim() : current.image,
      gallery !== undefined ? JSON.stringify(gallery) : current.gallery,
      description !== undefined ? description : current.description,
      features !== undefined ? JSON.stringify(features) : current.features,
      badge !== undefined ? (badge === 'null' || !badge ? null : badge) : current.badge,
      inStock !== undefined ? Boolean(inStock) : current.in_stock,
      stockQuantity !== undefined ? Number(stockQuantity) : current.stock_quantity,
      rating !== undefined ? Number(rating) : current.rating,
      reviewsCount !== undefined ? Number(reviewsCount) : current.reviews_count,
      id
    ]);

    return res.json({
      success: true,
      message: 'Producto actualizado correctamente.',
      product: formatProduct(result.rows[0])
    });
  } catch (err) {
    next(err);
  }
}

// Alternar disponibilidad de stock (solo ADMIN)
async function toggleStock(req, res, next) {
  try {
    const { id } = req.params;
    const exists = await query('SELECT in_stock FROM products WHERE id = $1', [id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `El producto con ID #${id} no existe.`
      });
    }

    const newStock = !exists.rows[0].in_stock;
    const result = await query(
      'UPDATE products SET in_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [newStock, id]
    );

    return res.json({
      success: true,
      message: `Stock ${newStock ? 'activado' : 'pausado'} exitosamente.`,
      product: formatProduct(result.rows[0])
    });
  } catch (err) {
    next(err);
  }
}

// Eliminar un producto (solo ADMIN)
async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING id, name', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `El producto con ID #${id} no existe.`
      });
    }

    return res.json({
      success: true,
      message: `Producto "${result.rows[0].name}" eliminado del catálogo.`
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  toggleStock,
  deleteProduct
};
