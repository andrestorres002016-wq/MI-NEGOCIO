/**
 * ÁBICA — Consola Administrativa
 * Lógica interactiva del Backoffice, autenticación JWT y operaciones CRUD
 */

const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? `${window.location.origin}/api`
  : '/api';

const ADMIN_TOKEN_KEY = 'abica_admin_jwt_token';
const ADMIN_USER_KEY = 'abica_admin_current_user';

let currentAdminUser = null;
let currentProducts = [];
let currentOrders = [];
let currentEditingProductId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupLoginForm();
  setupProductForm();
  checkAuthAndInit();
});

// ---------------- AUTENTICACIÓN ADMIN ----------------

async function checkAuthAndInit() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  const loginOverlay = document.getElementById('adminLoginOverlay');

  if (!token) {
    if (loginOverlay) loginOverlay.style.display = 'flex';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok || !data.success || data.user.role !== 'ADMIN') {
      logoutAdmin(false);
      if (loginOverlay) loginOverlay.style.display = 'flex';
      return;
    }

    currentAdminUser = data.user;
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(currentAdminUser));

    if (loginOverlay) loginOverlay.style.display = 'none';
    renderAdminProfile();
    loadDashboardStats();
  } catch (err) {
    console.error('Error al verificar sesión de administrador:', err);
    if (loginOverlay) loginOverlay.style.display = 'flex';
  }
}

function setupLoginForm() {
  const form = document.getElementById('adminLoginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminLoginEmail').value.trim();
    const password = document.getElementById('adminLoginPassword').value.trim();
    const errorBox = document.getElementById('adminLoginError');
    const submitBtn = document.getElementById('adminLoginSubmitBtn');

    if (!email || !password) {
      if (errorBox) {
        errorBox.textContent = 'Por favor ingresa usuario y contraseña.';
        errorBox.style.display = 'block';
      }
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Autenticando en PostgreSQL...';
      if (errorBox) errorBox.style.display = 'none';

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Credenciales inválidas.');
      }

      if (data.user.role !== 'ADMIN') {
        throw new Error('Esta cuenta no posee privilegios de Administrador.');
      }

      // Guardar sesión
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user));
      currentAdminUser = data.user;

      document.getElementById('adminLoginOverlay').style.display = 'none';
      renderAdminProfile();
      loadDashboardStats();
      showAdminToast('¡Bienvenido a la Consola Administrativa de ÁBICA!', 'success');
    } catch (err) {
      if (errorBox) {
        errorBox.textContent = err.message;
        errorBox.style.display = 'block';
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Ingresar a la Consola';
    }
  });
}

function quickFillAdmin() {
  const emailInput = document.getElementById('adminLoginEmail');
  const passInput = document.getElementById('adminLoginPassword');
  if (emailInput) emailInput.value = 'admin@abica.com';
  if (passInput) passInput.value = 'admin1234';
}

function logoutAdmin(showAlert = true) {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
  currentAdminUser = null;
  document.getElementById('adminLoginOverlay').style.display = 'flex';
  if (showAlert) showAdminToast('Sesión cerrada correctamente.', 'info');
}

function renderAdminProfile() {
  if (!currentAdminUser) return;
  const nameEl = document.getElementById('sidebarAdminName');
  const avatarEl = document.getElementById('sidebarAdminAvatar');
  const profileNameEl = document.getElementById('settingsAdminName');
  const profileEmailEl = document.getElementById('settingsAdminEmail');

  if (nameEl) nameEl.textContent = currentAdminUser.name || 'Administrador';
  if (avatarEl) avatarEl.textContent = (currentAdminUser.name || 'AD').substring(0, 2).toUpperCase();
  if (profileNameEl) profileNameEl.textContent = currentAdminUser.name;
  if (profileEmailEl) profileEmailEl.textContent = currentAdminUser.email;
}

// ---------------- NAVEGACIÓN LATERAL (SIDEBAR) ----------------

function setupNavigation() {
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  navItems.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSection = btn.getAttribute('data-section');
      if (!targetSection) return;

      switchSection(targetSection);

      // Si está en pantalla pequeña, cerrar sidebar
      const sidebar = document.getElementById('adminSidebar');
      if (sidebar && window.innerWidth <= 992) {
        sidebar.classList.remove('open');
      }
    });
  });

  const mobileToggle = document.getElementById('mobileSidebarToggle');
  const sidebar = document.getElementById('adminSidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

function switchSection(sectionId) {
  // Actualizar botones del sidebar
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-section') === sectionId);
  });

  // Actualizar áreas de contenido
  document.querySelectorAll('.admin-section').forEach(sec => {
    sec.classList.remove('active');
  });

  const targetSec = document.getElementById(`section-${sectionId}`);
  if (targetSec) {
    targetSec.classList.add('active');
  }

  // Título superior dinámico
  const titleEl = document.getElementById('currentSectionTitle');
  const subtitleEl = document.getElementById('currentSectionSubtitle');

  const titles = {
    'dashboard': { title: 'Panel de Control', sub: 'Métricas generales, ventas y rendimiento en tiempo real' },
    'products': { title: 'Catálogo de Muebles', sub: 'Administra colecciones, inventario y disponibilidad' },
    'orders': { title: 'Gestión de Pedidos', sub: 'Monitoreo de órdenes de compra, clientes y envíos' },
    'users': { title: 'Clientes y Cuentas', sub: 'Directorio de usuarios registrados en la plataforma' },
    'subscribers': { title: 'Suscriptores Newsletter', sub: 'Comunidad de correos inscritos a novedades' },
    'settings': { title: 'Configuración & Sistema', sub: 'Parámetros del servidor y estado de la base de datos' }
  };

  if (titles[sectionId]) {
    if (titleEl) titleEl.textContent = titles[sectionId].title;
    if (subtitleEl) subtitleEl.textContent = titles[sectionId].sub;
  }

  // Carga de datos según sección
  if (sectionId === 'dashboard') loadDashboardStats();
  if (sectionId === 'products') loadProductsTable();
  if (sectionId === 'orders') loadOrdersTable();
  if (sectionId === 'users') loadUsersTable();
  if (sectionId === 'subscribers') loadSubscribersTable();
}

// ---------------- CARGA DE DATOS DEL DASHBOARD ----------------

async function loadDashboardStats() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok || !data.success) throw new Error(data.message);

    const s = data.stats;

    // Actualizar KPIs
    document.getElementById('statTotalSales').textContent = s.financial.totalSalesFormatted;
    document.getElementById('statTotalOrders').textContent = s.orders.total;
    document.getElementById('statActiveProducts').textContent = `${s.inventory.activeProducts} de ${s.inventory.totalProducts}`;
    document.getElementById('statPendingOrders').textContent = s.orders.pending;

    // Badges en sidebar
    const badgeOrders = document.getElementById('badgeOrdersCount');
    if (badgeOrders) badgeOrders.textContent = s.orders.pending > 0 ? s.orders.pending : s.orders.total;

    // Pedidos recientes en tabla del dashboard
    renderRecentOrdersDashboard(s.recentOrders);

    // Distribución de categorías
    renderCategoryDistribution(s.categories);
  } catch (err) {
    console.error('Error al cargar estadísticas:', err);
  }
}

function renderRecentOrdersDashboard(orders) {
  const container = document.getElementById('dashboardRecentOrdersBody');
  if (!container) return;

  if (!orders || orders.length === 0) {
    container.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--admin-text-muted);">No hay pedidos registrados aún.</td></tr>`;
    return;
  }

  container.innerHTML = orders.map(o => `
    <tr>
      <td><strong>${o.orderNumber}</strong></td>
      <td>${o.customerName}</td>
      <td>${formatPriceCOP(o.total)}</td>
      <td><span class="status-badge status-badge--${o.status.toLowerCase()}">${o.status}</span></td>
      <td>
        <button class="btn-admin btn-admin--outline btn-admin--sm" onclick="viewOrderDetailById(${o.id})">
          Ver Detalle
        </button>
      </td>
    </tr>
  `).join('');
}

function renderCategoryDistribution(categories) {
  const container = document.getElementById('dashboardCategoryBars');
  if (!container) return;

  if (!categories || categories.length === 0) {
    container.innerHTML = `<p style="color: var(--admin-text-muted);">Sin datos de categorías.</p>`;
    return;
  }

  const maxCount = Math.max(...categories.map(c => c.count), 1);

  container.innerHTML = categories.map(c => {
    const percentage = Math.round((c.count / maxCount) * 100);
    return `
      <div style="margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 4px; font-weight: 500;">
          <span>${c.category}</span>
          <strong>${c.count} muebles</strong>
        </div>
        <div style="height: 8px; background: #EFECE6; border-radius: 4px; overflow: hidden;">
          <div style="width: ${percentage}%; height: 100%; background: var(--admin-primary); border-radius: 4px;"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ---------------- GESTIÓN DE PRODUCTOS (CRUD) ----------------

async function loadProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 32px;"><span class="spinner-circle"></span> Cargando catálogo de PostgreSQL...</td></tr>`;

  try {
    const search = document.getElementById('productSearchInput')?.value || '';
    const category = document.getElementById('productCategoryFilter')?.value || 'Todos';

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'Todos') params.append('category', category);

    const res = await fetch(`${API_BASE}/products?${params.toString()}`);
    const data = await res.json();

    if (!res.ok || !data.success) throw new Error(data.message);

    currentProducts = data.products;
    document.getElementById('totalProductsCountLabel').textContent = `${data.count} muebles en catálogo`;

    if (currentProducts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 32px; color: var(--admin-text-muted);">No se encontraron productos con los filtros seleccionados.</td></tr>`;
      return;
    }

    tbody.innerHTML = currentProducts.map(p => `
      <tr>
        <td>
          <div class="product-row-info">
            <img class="product-row-img" src="${p.image}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=200&q=80'" />
            <div class="product-row-title">
              <h5>${p.name}</h5>
              <span>${p.dimensions || 'Estándar'} • ${p.material || 'Roble'}</span>
            </div>
          </div>
        </td>
        <td><span style="font-size: 0.82rem; background: #FAF5EE; padding: 4px 8px; border-radius: 4px; border: 1px solid #EBDDCF;">${p.category}</span></td>
        <td>
          <strong>${formatPriceCOP(p.price)}</strong>
          ${p.originalPrice ? `<br><small style="color: #999; text-decoration: line-through;">${formatPriceCOP(p.originalPrice)}</small>` : ''}
        </td>
        <td>
          <span class="stock-pill ${p.inStock ? 'stock-pill--in' : 'stock-pill--out'}">
            ${p.inStock ? `Disponible (${p.stockQuantity} un)` : 'Agotado'}
          </span>
        </td>
        <td>${p.badge ? `<span style="font-size:0.75rem; font-weight:600; color:var(--admin-primary); background:#FDF2E9; padding:2px 8px; border-radius:10px;">${p.badge}</span>` : '—'}</td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn-icon" title="Editar Mueble" onclick="openEditProductModal(${p.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon" title="${p.inStock ? 'Pausar Stock' : 'Activar Stock'}" onclick="toggleProductStock(${p.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${p.inStock ? '<path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>' : '<polygon points="5 3 19 12 5 21 5 3"/>'}</svg>
            </button>
            <button class="btn-icon btn-icon--danger" title="Eliminar Mueble" onclick="deleteProductById(${p.id}, '${p.name.replace(/'/g, "\\'")}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--admin-danger); padding: 24px;">Error al cargar productos: ${err.message}</td></tr>`;
  }
}

function openCreateProductModal() {
  currentEditingProductId = null;
  document.getElementById('productModalTitle').textContent = 'Nuevo Mueble para el Catálogo';
  document.getElementById('productForm').reset();
  document.getElementById('prodId').value = '';
  document.getElementById('prodInStock').checked = true;
  document.getElementById('prodStockQty').value = '15';
  openAdminModal('productModal');
}

function openEditProductModal(productId) {
  const p = currentProducts.find(item => item.id === productId);
  if (!p) return;

  currentEditingProductId = productId;
  document.getElementById('productModalTitle').textContent = `Editar Mueble #${p.id} — ${p.name}`;
  document.getElementById('prodId').value = p.id;
  document.getElementById('prodName').value = p.name;
  document.getElementById('prodPrice').value = p.price;
  document.getElementById('prodOriginalPrice').value = p.originalPrice || '';
  document.getElementById('prodCategory').value = p.category;
  document.getElementById('prodMaterial').value = p.material || '';
  document.getElementById('prodColor').value = p.color || '';
  document.getElementById('prodColorHex').value = p.colorHex || '#A87950';
  document.getElementById('prodDimensions').value = p.dimensions || '';
  document.getElementById('prodImage').value = p.image;
  document.getElementById('prodBadge').value = p.badge || '';
  document.getElementById('prodStockQty').value = p.stockQuantity || 15;
  document.getElementById('prodInStock').checked = Boolean(p.inStock);
  document.getElementById('prodDescription').value = p.description || '';
  document.getElementById('prodFeatures').value = (p.features || []).join('\n');

  openAdminModal('productModal');
}

function setupProductForm() {
  const form = document.getElementById('productForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;

    const submitBtn = document.getElementById('saveProductBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando en Base de Datos...';

    const featuresText = document.getElementById('prodFeatures').value;
    const featuresArray = featuresText.split('\n').map(f => f.trim()).filter(f => f.length > 0);

    const payload = {
      name: document.getElementById('prodName').value.trim(),
      price: Number(document.getElementById('prodPrice').value),
      originalPrice: document.getElementById('prodOriginalPrice').value ? Number(document.getElementById('prodOriginalPrice').value) : null,
      category: document.getElementById('prodCategory').value,
      material: document.getElementById('prodMaterial').value.trim(),
      color: document.getElementById('prodColor').value.trim(),
      colorHex: document.getElementById('prodColorHex').value.trim(),
      dimensions: document.getElementById('prodDimensions').value.trim(),
      image: document.getElementById('prodImage').value.trim(),
      badge: document.getElementById('prodBadge').value || null,
      stockQuantity: Number(document.getElementById('prodStockQty').value || 10),
      inStock: document.getElementById('prodInStock').checked,
      description: document.getElementById('prodDescription').value.trim(),
      features: featuresArray
    };

    try {
      let url = `${API_BASE}/products`;
      let method = 'POST';

      if (currentEditingProductId) {
        url = `${API_BASE}/products/${currentEditingProductId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      closeAdminModal('productModal');
      showAdminToast(data.message || 'Mueble guardado con éxito.', 'success');
      loadProductsTable();
      loadDashboardStats();
    } catch (err) {
      showAdminToast(`Error: ${err.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar Mueble';
    }
  });
}

async function toggleProductStock(productId) {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/products/${productId}/toggle-stock`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);

    showAdminToast(data.message, 'success');
    loadProductsTable();
    loadDashboardStats();
  } catch (err) {
    showAdminToast(`Error al alternar stock: ${err.message}`, 'error');
  }
}

async function deleteProductById(productId, productName) {
  if (!confirm(`¿Estás seguro de eliminar "${productName}" del catálogo? Esta acción no se puede deshacer.`)) {
    return;
  }

  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/products/${productId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);

    showAdminToast(data.message, 'success');
    loadProductsTable();
    loadDashboardStats();
  } catch (err) {
    showAdminToast(`Error al eliminar: ${err.message}`, 'error');
  }
}

// ---------------- GESTIÓN DE PEDIDOS (ÓRDENES) ----------------

async function loadOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 32px;"><span class="spinner-circle"></span> Consultando órdenes registradas en PostgreSQL...</td></tr>`;

  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) return;

  try {
    const statusFilter = document.getElementById('orderStatusFilter')?.value || 'TODOS';
    const search = document.getElementById('orderSearchInput')?.value || '';

    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'TODOS') params.append('status', statusFilter);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE}/orders?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok || !data.success) throw new Error(data.message);

    currentOrders = data.orders;
    document.getElementById('totalOrdersCountLabel').textContent = `${data.count} pedidos registrados`;

    if (currentOrders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 32px; color: var(--admin-text-muted);">No hay pedidos para mostrar.</td></tr>`;
      return;
    }

    tbody.innerHTML = currentOrders.map(o => `
      <tr>
        <td><strong>${o.orderNumber}</strong></td>
        <td>
          <div style="font-weight: 600;">${o.customerName}</div>
          <small style="color: var(--admin-text-muted);">${o.customerEmail} • ${o.customerPhone || 'Sin tel.'}</small>
        </td>
        <td><small>${formatDateString(o.createdAt)}</small></td>
        <td><strong>${formatPriceCOP(o.total)}</strong></td>
        <td>
          <select class="admin-select" style="font-size: 0.78rem; padding: 4px 8px;" onchange="updateOrderStatusLive(${o.id}, this.value)">
            <option value="PENDIENTE" ${o.status === 'PENDIENTE' ? 'selected' : ''}>Pendiente</option>
            <option value="CONFIRMADO" ${o.status === 'CONFIRMADO' ? 'selected' : ''}>Confirmado</option>
            <option value="ENVIADO" ${o.status === 'ENVIADO' ? 'selected' : ''}>Enviado</option>
            <option value="ENTREGADO" ${o.status === 'ENTREGADO' ? 'selected' : ''}>Entregado</option>
            <option value="CANCELADO" ${o.status === 'CANCELADO' ? 'selected' : ''}>Cancelado</option>
          </select>
        </td>
        <td><span class="status-badge status-badge--${o.status.toLowerCase()}">${o.status}</span></td>
        <td>
          <button class="btn-admin btn-admin--outline btn-admin--sm" onclick="viewOrderDetailById(${o.id})">
            Ver Orden
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--admin-danger); padding: 24px;">Error: ${err.message}</td></tr>`;
  }
}

async function updateOrderStatusLive(orderId, newStatus) {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);

    showAdminToast(data.message, 'success');
    loadOrdersTable();
    loadDashboardStats();
  } catch (err) {
    showAdminToast(`Error al actualizar estado: ${err.message}`, 'error');
  }
}

function viewOrderDetailById(orderId) {
  const order = currentOrders.find(o => o.id === orderId);
  if (!order) return;

  document.getElementById('orderModalTitle').textContent = `Detalle del Pedido ${order.orderNumber}`;
  const body = document.getElementById('orderDetailModalBody');

  body.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; background: #FAF8F5; padding: 16px; border-radius: 8px;">
      <div>
        <h5 style="font-size: 0.8rem; text-transform: uppercase; color: var(--admin-text-muted); margin-bottom: 6px;">Cliente</h5>
        <p style="font-weight: 600;">${order.customerName}</p>
        <p style="font-size: 0.85rem; color: var(--admin-text-muted);">${order.customerEmail}</p>
        <p style="font-size: 0.85rem; color: var(--admin-text-muted);">${order.customerPhone || 'N/A'}</p>
      </div>
      <div>
        <h5 style="font-size: 0.8rem; text-transform: uppercase; color: var(--admin-text-muted); margin-bottom: 6px;">Entrega y Pago</h5>
        <p style="font-size: 0.88rem;"><strong>Dirección:</strong> ${order.customerAddress}</p>
        <p style="font-size: 0.88rem;"><strong>Método:</strong> ${order.paymentMethod}</p>
        <p style="font-size: 0.88rem;"><strong>Fecha:</strong> ${formatDateString(order.createdAt)}</p>
      </div>
    </div>

    <h4 style="font-family: var(--font-heading); margin-bottom: 12px; font-size: 1.1rem;">Artículos del Pedido (${order.items.length})</h4>
    <div style="border: 1px solid var(--admin-card-border); border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.86rem;">
        <thead>
          <tr style="background: #F4F1EA; text-align: left;">
            <th style="padding: 10px 12px;">Producto</th>
            <th style="padding: 10px 12px;">Color</th>
            <th style="padding: 10px 12px;">Cant.</th>
            <th style="padding: 10px 12px;">Unitario</th>
            <th style="padding: 10px 12px; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr style="border-bottom: 1px solid #ECE7DE;">
              <td style="padding: 10px 12px; display: flex; align-items: center; gap: 8px;">
                <img src="${item.image}" style="width: 32px; height: 32px; border-radius: 4px; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=100&q=80'" />
                <span>${item.productName}</span>
              </td>
              <td style="padding: 10px 12px;">${item.color || 'Estándar'}</td>
              <td style="padding: 10px 12px;">${item.quantity}</td>
              <td style="padding: 10px 12px;">${formatPriceCOP(item.price)}</td>
              <td style="padding: 10px 12px; text-align: right; font-weight: 600;">${formatPriceCOP(item.subtotal)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div style="background: #F8EFE6; padding: 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 1rem; font-weight: 600; color: #4B321D;">Total Liquidado COP:</span>
      <strong style="font-family: var(--font-heading); font-size: 1.4rem; color: #4B321D;">${formatPriceCOP(order.total)}</strong>
    </div>
  `;

  openAdminModal('orderModal');
}

// ---------------- CLIENTES Y SUSCRIPTORES ----------------

async function loadUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) return;

  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px;"><span class="spinner-circle"></span> Cargando usuarios de PostgreSQL...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/auth/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);

    if (data.users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px;">No hay usuarios registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.users.map(u => `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.phone || '—'}</td>
        <td>
          <span style="padding: 3px 8px; border-radius: 12px; font-size: 0.74rem; font-weight: 600; ${u.role === 'ADMIN' ? 'background: #FAF0E4; color: #A87950;' : 'background: #E8F5E9; color: #2E7D32;'}">
            ${u.role}
          </span>
        </td>
        <td><small>${formatDateString(u.created_at)}</small></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--admin-danger); padding: 24px;">Error: ${err.message}</td></tr>`;
  }
}

async function loadSubscribersTable() {
  const tbody = document.getElementById('subscribersTableBody');
  if (!tbody) return;

  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) return;

  tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 24px;"><span class="spinner-circle"></span> Cargando suscriptores de PostgreSQL...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/subscribers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);

    if (data.subscribers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 24px;">No hay suscriptores inscritos aún.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.subscribers.map(s => `
      <tr>
        <td><strong>${s.email}</strong></td>
        <td><span class="stock-pill stock-pill--in">ACTIVO</span></td>
        <td><small>${formatDateString(s.created_at)}</small></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color: var(--admin-danger); padding: 24px;">Error: ${err.message}</td></tr>`;
  }
}

// ---------------- UTILIDADES ----------------

function formatPriceCOP(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

function formatDateString(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function openAdminModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('open');
}

function closeAdminModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

function showAdminToast(message, type = 'info') {
  const container = document.getElementById('adminToastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `admin-toast admin-toast--${type}`;
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'success' ? '<polyline points="20 6 9 17 4 12"/>' : type === 'error' ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'}
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
