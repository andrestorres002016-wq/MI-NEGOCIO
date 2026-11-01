/**
 * ÁBICA Muebles Contemporáneos
 * Carrito de Compras, Favoritos y Persistencia Local
 */

const STORAGE_KEYS = {
  CART: "abica_furniture_cart_v1",
  WISHLIST: "abica_furniture_wishlist_v1"
};

const FREE_SHIPPING_THRESHOLD = 2500000; // COP $2.500.000 para envío gratis
const STANDARD_SHIPPING_COST = 85000;    // COP $85.000 tarifa fija si no alcanza el umbral

// Estado en memoria
let cart = [];
let wishlist = [];

// Inicialización de persistencia local segura con verificación de integridad de precios
function initCartAndWishlist() {
  try {
    const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      if (Array.isArray(parsed)) {
        // Blindaje Anti-Tampering: Revalidar cada artículo con el catálogo oficial
        cart = parsed
          .map(item => (window.Security ? window.Security.sanitizeAndVerifyCartItem(item, products) : item))
          .filter(item => item && item.id && item.quantity > 0);
      }
    }
  } catch (e) {
    console.warn("[Security] Error al cargar carrito de localStorage, reiniciando:", e);
    cart = [];
  }

  try {
    const savedWishlist = localStorage.getItem(STORAGE_KEYS.WISHLIST);
    if (savedWishlist) {
      const parsed = JSON.parse(savedWishlist);
      if (Array.isArray(parsed)) {
        // Solo aceptar IDs numéricos que correspondan a productos reales
        wishlist = parsed.filter(id => typeof id === "number" && products.some(p => p.id === id));
      }
    }
  } catch (e) {
    console.warn("[Security] Error al cargar favoritos de localStorage, reiniciando:", e);
    wishlist = [];
  }

  updateBadges();
}

function saveCartToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  } catch (e) {
    console.error("No se pudo guardar el carrito:", e);
  }
  updateBadges();
}

function saveWishlistToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
  } catch (e) {
    console.error("No se pudo guardar la lista de deseos:", e);
  }
  updateBadges();
}

// ----------------- OPERACIONES DEL CARRITO -----------------

function addToCart(productId, quantity = 1, selectedColor = null) {
  const cleanId = parseInt(productId, 10);
  const product = products.find(p => p.id === cleanId);
  if (!product) return false;

  // Validación estricta de cantidad: entero entre 1 y 99
  const cleanQty = Math.min(99, Math.max(1, parseInt(quantity, 10) || 1));
  const rawColor = selectedColor || product.color;
  const colorToSave = window.Security ? window.Security.sanitizeHTML(rawColor) : rawColor;

  const existingItemIndex = cart.findIndex(item => item.id === cleanId && item.color === colorToSave);

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity = Math.min(99, cart[existingItemIndex].quantity + cleanQty);
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price, // Precio canónico inmutable
      image: product.image,
      category: product.category,
      material: product.material,
      color: colorToSave,
      quantity: cleanQty
    });
  }

  saveCartToStorage();
  renderCartDrawer();
  showToast(`"${product.name}" agregado al carrito`, "success");
  return true;
}

function removeFromCart(productId, color) {
  const cleanId = parseInt(productId, 10);
  const initialLength = cart.length;
  cart = cart.filter(item => !(item.id === cleanId && (!color || item.color === color)));
  if (cart.length < initialLength) {
    saveCartToStorage();
    renderCartDrawer();
    showToast("Producto eliminado del carrito", "info");
  }
}

function updateCartQuantity(productId, color, delta) {
  const cleanId = parseInt(productId, 10);
  const item = cart.find(item => item.id === cleanId && (!color || item.color === color));
  if (!item) return;

  const cleanDelta = parseInt(delta, 10) || 0;
  const newQty = item.quantity + cleanDelta;
  if (newQty <= 0) {
    removeFromCart(cleanId, color);
  } else {
    item.quantity = Math.min(99, newQty);
    saveCartToStorage();
    renderCartDrawer();
  }
}

function setCartQuantity(productId, color, exactQty) {
  const cleanId = parseInt(productId, 10);
  const item = cart.find(item => item.id === cleanId && (!color || item.color === color));
  if (!item) return;

  const qty = parseInt(exactQty, 10);
  if (isNaN(qty) || qty <= 0) {
    removeFromCart(cleanId, color);
  } else {
    item.quantity = Math.min(Math.max(1, qty), 99);
    saveCartToStorage();
    renderCartDrawer();
  }
}

function clearCart() {
  cart = [];
  saveCartToStorage();
  renderCartDrawer();
}

function getCartCalculations() {
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0;
  const shippingCost = isFreeShipping ? 0 : STANDARD_SHIPPING_COST;
  const total = subtotal + shippingCost;
  const missingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  return {
    subtotal,
    totalItems,
    isFreeShipping,
    shippingCost,
    total,
    missingForFreeShipping,
    progressPercent
  };
}

// ----------------- OPERACIONES DE FAVORITOS -----------------

function isFavorited(productId) {
  return wishlist.includes(productId);
}

function toggleFavorite(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return false;

  const index = wishlist.indexOf(productId);
  let status = false;

  if (index > -1) {
    wishlist.splice(index, 1);
    status = false;
    showToast(`Eliminado de favoritos`, "info");
  } else {
    wishlist.push(productId);
    status = true;
    showToast(`"${product.name}" guardado en favoritos`, "success");
  }

  saveWishlistToStorage();
  updateWishlistButtons(productId, status);
  renderWishlistDrawer();
  return status;
}

function removeFromWishlist(productId) {
  const index = wishlist.indexOf(productId);
  if (index > -1) {
    wishlist.splice(index, 1);
    saveWishlistToStorage();
    updateWishlistButtons(productId, false);
    renderWishlistDrawer();
    showToast("Producto eliminado de favoritos", "info");
  }
}

function moveFromWishlistToCart(productId) {
  const success = addToCart(productId, 1);
  if (success) {
    removeFromWishlist(productId);
  }
}

// ----------------- ACTUALIZACIÓN DE BADGES -----------------

function updateBadges() {
  const cartBadge = document.getElementById("cartCountBadge");
  const cartBadgeMobile = document.getElementById("cartCountBadgeMobile");
  const wishlistBadge = document.getElementById("wishlistCountBadge");
  const wishlistBadgeMobile = document.getElementById("wishlistCountBadgeMobile");

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalWishlistCount = wishlist.length;

  if (cartBadge) {
    cartBadge.textContent = totalCartCount;
    cartBadge.classList.toggle("badge--visible", totalCartCount > 0);
  }
  if (cartBadgeMobile) {
    cartBadgeMobile.textContent = totalCartCount;
    cartBadgeMobile.classList.toggle("badge--visible", totalCartCount > 0);
  }

  if (wishlistBadge) {
    wishlistBadge.textContent = totalWishlistCount;
    wishlistBadge.classList.toggle("badge--visible", totalWishlistCount > 0);
  }
  if (wishlistBadgeMobile) {
    wishlistBadgeMobile.textContent = totalWishlistCount;
    wishlistBadgeMobile.classList.toggle("badge--visible", totalWishlistCount > 0);
  }
}

function updateWishlistButtons(productId, isFav) {
  const buttons = document.querySelectorAll(`[data-favorite-id="${productId}"]`);
  buttons.forEach(btn => {
    btn.classList.toggle("active", isFav);
    btn.setAttribute("aria-label", isFav ? "Quitar de favoritos" : "Añadir a favoritos");
    const icon = btn.querySelector("svg");
    if (icon) {
      icon.style.fill = isFav ? "#A87950" : "none";
      icon.style.stroke = isFav ? "#A87950" : "currentColor";
    }
  });
}

// ----------------- RENDERIZADO DEL CARRITO -----------------

function renderCartDrawer() {
  const container = document.getElementById("cartDrawerItems");
  const footerContainer = document.getElementById("cartDrawerFooter");
  const shippingProgressBar = document.getElementById("cartShippingProgress");
  const shippingMsg = document.getElementById("cartShippingMessage");

  if (!container || !footerContainer) return;

  const { subtotal, totalItems, isFreeShipping, shippingCost, total, missingForFreeShipping, progressPercent } = getCartCalculations();

  // Barra de progreso de envío gratis
  if (shippingProgressBar && shippingMsg) {
    shippingProgressBar.style.width = `${progressPercent}%`;
    if (subtotal === 0) {
      shippingMsg.innerHTML = `¡Envío gratis a toda Colombia por compras superiores a <strong>${formatCurrency(FREE_SHIPPING_THRESHOLD)}</strong>!`;
    } else if (isFreeShipping) {
      shippingMsg.innerHTML = `<span class="shipping-success"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> ¡Felicidades! Tienes <strong>Envío Gratis</strong> asegurado.</span>`;
    } else {
      shippingMsg.innerHTML = `Te faltan <strong>${formatCurrency(missingForFreeShipping)}</strong> para obtener <strong>Envío Gratis</strong>.`;
    }
  }

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
        <h3 class="empty-state__title">Tu carrito está vacío</h3>
        <p class="empty-state__description">Descubre nuestras piezas de diseño artesanal y llena tu hogar de armonía.</p>
        <button class="btn btn--primary" onclick="closeAllDrawers(); document.getElementById('catalogSection').scrollIntoView({behavior: 'smooth'});">
          Explorar Catálogo
        </button>
      </div>
    `;
    footerContainer.style.display = "none";
    return;
  }

  footerContainer.style.display = "block";

  // Items en lista
  container.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}" data-color="${item.color}">
      <img src="${item.image}" alt="${item.name}" class="cart-item__image" loading="lazy">
      <div class="cart-item__details">
        <div class="cart-item__top">
          <span class="cart-item__category">${item.category}</span>
          <button class="cart-item__remove" onclick="removeFromCart(${item.id}, '${item.color}')" title="Eliminar producto" aria-label="Eliminar ${item.name}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <h4 class="cart-item__name">${item.name}</h4>
        <div class="cart-item__meta">
          <span class="cart-item__color">Acabado: <strong>${item.color}</strong></span>
        </div>
        <div class="cart-item__bottom">
          <div class="qty-control">
            <button class="qty-btn" onclick="updateCartQuantity(${item.id}, '${item.color}', -1)" aria-label="Disminuir cantidad">−</button>
            <input type="number" class="qty-input" value="${item.quantity}" min="1" max="99" onchange="setCartQuantity(${item.id}, '${item.color}', this.value)" aria-label="Cantidad">
            <button class="qty-btn" onclick="updateCartQuantity(${item.id}, '${item.color}', 1)" aria-label="Aumentar cantidad">+</button>
          </div>
          <div class="cart-item__price">
            <span class="cart-item__subtotal">${formatCurrency(item.price * item.quantity)}</span>
            ${item.quantity > 1 ? `<span class="cart-item__unit-price">(${formatCurrency(item.price)} c/u)</span>` : ''}
          </div>
        </div>
      </div>
    </div>
  `).join("");

  // Footer con subtotales
  footerContainer.innerHTML = `
    <div class="cart-summary-line">
      <span>Subtotal (${totalItems} ${totalItems === 1 ? 'artículo' : 'artículos'})</span>
      <span class="font-bold">${formatCurrency(subtotal)}</span>
    </div>
    <div class="cart-summary-line">
      <span>Envío nacional asegurado</span>
      <span>${isFreeShipping ? '<strong class="text-success">GRATIS</strong>' : formatCurrency(shippingCost)}</span>
    </div>
    <div class="cart-summary-line cart-summary-line--total">
      <span>Total Estimado</span>
      <span class="cart-total-amount">${formatCurrency(total)}</span>
    </div>
    <p class="cart-guarantee-note">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      Garantía de satisfacción de 5 años y devolución sin costo.
    </p>
    <button class="btn btn--primary btn--full btn--checkout" onclick="openCheckoutModal()">
      <span>Continuar a la Compra</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
    </button>
    <button class="btn btn--link btn--full mt-2" onclick="closeAllDrawers()">
      Seguir explorando muebles
    </button>
  `;
}

// ----------------- RENDERIZADO DE FAVORITOS -----------------

function renderWishlistDrawer() {
  const container = document.getElementById("wishlistDrawerItems");
  if (!container) return;

  const favoriteProducts = products.filter(p => wishlist.includes(p.id));

  if (favoriteProducts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
        <h3 class="empty-state__title">Aún no tienes favoritos</h3>
        <p class="empty-state__description">Guarda las piezas que más te inspiren tocando el icono del corazón en cada producto.</p>
        <button class="btn btn--secondary" onclick="closeAllDrawers(); document.getElementById('catalogSection').scrollIntoView({behavior: 'smooth'});">
          Ver Productos
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = favoriteProducts.map(product => `
    <div class="wishlist-item" data-id="${product.id}">
      <img src="${product.image}" alt="${product.name}" class="wishlist-item__image" loading="lazy">
      <div class="wishlist-item__details">
        <div class="wishlist-item__top">
          <span class="wishlist-item__category">${product.category}</span>
          <button class="wishlist-item__remove" onclick="removeFromWishlist(${product.id})" title="Quitar de favoritos" aria-label="Quitar de favoritos">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <h4 class="wishlist-item__name">${product.name}</h4>
        <span class="wishlist-item__material">${product.material}</span>
        <div class="wishlist-item__price">${formatCurrency(product.price)}</div>
        <div class="wishlist-item__actions">
          <button class="btn btn--sm btn--primary" onclick="moveFromWishlistToCart(${product.id})">
            Mover al Carrito
          </button>
          <button class="btn btn--sm btn--outline" onclick="openProductModal(${product.id})">
            Ver Detalle
          </button>
        </div>
      </div>
    </div>
  `).join("");
}
