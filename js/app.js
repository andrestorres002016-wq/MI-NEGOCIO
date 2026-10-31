/**
 * ÁBICA Muebles Contemporáneos
 * Aplicación Principal — Modales, Checkout Demostrativo, UI & Navegación
 */

// Estado del modal de producto activo
let currentModalProductId = null;
let currentModalSelectedColor = null;
let currentModalQuantity = 1;

// Inicialización de la aplicación
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initCartAndWishlist();
  initFilters();
  initAuth();
  initInteractiveSearch();
  setupEventListeners();
  setupStickyHeader();
  setupFaqAccordion();
});

// Configuración de escuchadores globales
function setupEventListeners() {
  // Botones para abrir carrito
  const cartBtn = document.getElementById("headerCartBtn");
  const cartBtnMobile = document.getElementById("headerCartBtnMobile");
  if (cartBtn) cartBtn.addEventListener("click", () => openDrawer("cartDrawer"));
  if (cartBtnMobile) cartBtnMobile.addEventListener("click", () => openDrawer("cartDrawer"));

  // Botones para abrir lista de deseos
  const wishlistBtn = document.getElementById("headerWishlistBtn");
  const wishlistBtnMobile = document.getElementById("headerWishlistBtnMobile");
  if (wishlistBtn) wishlistBtn.addEventListener("click", () => openDrawer("wishlistDrawer"));
  if (wishlistBtnMobile) wishlistBtnMobile.addEventListener("click", () => openDrawer("wishlistDrawer"));

  // Menú hamburguesa móvil
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", () => {
      openDrawer("mobileNavDrawer");
    });
  }

  // Botón para filtros en versión móvil
  const mobileFilterToggle = document.getElementById("mobileFilterToggle");
  if (mobileFilterToggle) {
    mobileFilterToggle.addEventListener("click", () => {
      openDrawer("filterDrawer");
    });
  }

  // Cierre de drawers y modales con tecla Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllDrawers();
      closeModal("productDetailModal");
      closeModal("checkoutModal");
      closeModal("orderSuccessModal");
      closeModal("authModal");
      closeModal("searchModal");
      closeUserDropdown();
    }
  });

  // Cerrar menú desplegable de usuario al hacer clic fuera
  document.addEventListener("click", (e) => {
    const authContainer = document.getElementById("headerAuthContainer");
    if (authContainer && !authContainer.contains(e.target)) {
      closeUserDropdown();
    }
  });

  // Suscripción al Newsletter con protección Anti-Spam y Rate Limiting
  const newsletterForm = document.getElementById("newsletterForm");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Verificación Honeypot Anti-Spam
      if (window.Security && window.Security.isHoneypotTriggered(newsletterForm)) {
        console.warn("[Security] Newsletter bloqueado por bot honeypot.");
        return;
      }

      // Control de frecuencia (Rate Limiting)
      if (window.Security && window.Security.rateLimiter) {
        const rateCheck = window.Security.rateLimiter.check("newsletter", 2, 60000);
        if (!rateCheck.allowed) {
          showToast(`Por favor espera ${rateCheck.waitTimeSeconds} segundos para volver a enviar.`, "warning");
          return;
        }
      }

      const emailInput = document.getElementById("newsletterEmail");
      if (emailInput && emailInput.value) {
        const emailVal = emailInput.value.trim();
        if (window.Security && !window.Security.isValidEmail(emailVal)) {
          showToast("Ingresa un formato de correo electrónico válido", "warning");
          return;
        }
        fetch("/api/subscribers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailVal })
        }).catch(() => {});
        showToast("¡Gracias por suscribirte! Recibirás nuestro catálogo de temporada.", "success");
        emailInput.value = "";
      }
    });
  }

  // Checkout Form Submission
  const checkoutForm = document.getElementById("checkoutForm");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", handleCheckoutSubmit);
  }
}

// ----------------- CONTROL DE DRAWERS (PANELES LATERALES) -----------------

function openDrawer(drawerId) {
  closeAllDrawers();
  const drawer = document.getElementById(drawerId);
  const backdrop = document.getElementById("appBackdrop");
  if (drawer && backdrop) {
    drawer.classList.add("drawer--open");
    backdrop.classList.add("backdrop--visible");
    document.body.style.overflow = "hidden";

    if (drawerId === "cartDrawer") renderCartDrawer();
    if (drawerId === "wishlistDrawer") renderWishlistDrawer();
  }
}

function closeDrawer(drawerId) {
  const drawer = document.getElementById(drawerId);
  const backdrop = document.getElementById("appBackdrop");
  if (drawer) drawer.classList.remove("drawer--open");
  if (backdrop) backdrop.classList.remove("backdrop--visible");
  document.body.style.overflow = "";
}

function closeAllDrawers() {
  document.querySelectorAll(".drawer").forEach(drawer => drawer.classList.remove("drawer--open"));
  const backdrop = document.getElementById("appBackdrop");
  if (backdrop) backdrop.classList.remove("backdrop--visible");
  document.body.style.overflow = "";
}

// ----------------- MODAL DE DETALLE DE PRODUCTO -----------------

function openProductModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  currentModalProductId = productId;
  currentModalSelectedColor = product.color;
  currentModalQuantity = 1;

  const modal = document.getElementById("productDetailModal");
  const backdrop = document.getElementById("modalBackdrop");
  const modalBody = document.getElementById("productModalContent");

  if (!modal || !modalBody) return;

  const isFav = isFavorited(product.id);
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  modalBody.innerHTML = `
    <div class="product-modal__grid">
      <!-- Galería de imágenes -->
      <div class="product-modal__gallery">
        <div class="product-modal__main-image-wrap">
          <img id="modalMainImg" src="${product.image}" alt="${product.name}" class="product-modal__main-img">
          ${product.badge ? `<span class="product-badge product-badge--accent">${product.badge}</span>` : ''}
        </div>
        <div class="product-modal__thumbnails">
          ${(product.gallery || [product.image]).map((imgUrl, idx) => `
            <button class="thumb-btn ${idx === 0 ? 'active' : ''}" onclick="changeModalMainImage('${imgUrl}', this)" aria-label="Ver imagen ${idx + 1}">
              <img src="${imgUrl}" alt="${product.name} miniatura ${idx + 1}">
            </button>
          `).join("")}
        </div>
      </div>

      <!-- Información y opciones -->
      <div class="product-modal__info">
        <div class="product-modal__header">
          <div class="product-modal__tags">
            <span class="product-modal__category">${product.category}</span>
            <div class="product-card__rating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#A87950" stroke="#A87950">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>${product.rating.toFixed(1)} (${product.reviewsCount} reseñas verificadas)</span>
            </div>
          </div>
          <h2 class="product-modal__title">${product.name}</h2>
          
          <div class="product-modal__price-wrap">
            <span class="product-modal__price">${formatCurrency(product.price)}</span>
            ${hasDiscount ? `
              <span class="product-modal__original-price">${formatCurrency(product.originalPrice)}</span>
              <span class="product-modal__discount-tag">Ahorras ${formatCurrency(product.originalPrice - product.price)}</span>
            ` : ''}
          </div>
        </div>

        <p class="product-modal__description">${product.description}</p>

        <!-- Especificaciones -->
        <div class="product-specs-box">
          <div class="spec-row">
            <span class="spec-label">Materiales & Acabado:</span>
            <span class="spec-value">${product.material}</span>
          </div>
          <div class="spec-row">
            <span class="spec-label">Dimensiones exactas:</span>
            <span class="spec-value">${product.dimensions}</span>
          </div>
          <div class="spec-row">
            <span class="spec-label">Disponibilidad:</span>
            <span class="spec-value text-success">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              En stock para despacho inmediato
            </span>
          </div>
        </div>

        <!-- Características destacadas -->
        <div class="product-modal__features">
          <h4 class="features-title">Garantía artesanal y detalles:</h4>
          <ul class="features-list">
            ${product.features.map(f => `<li><span class="bullet-check">✓</span> ${f}</li>`).join("")}
          </ul>
        </div>

        <!-- Selector de color -->
        <div class="product-modal__option-group">
          <label class="option-label">Acabado disponible: <strong>${product.color}</strong></label>
          <div class="color-swatches-inline">
            <button class="color-swatch-inline active" style="background-color: ${product.colorHex};" title="${product.color}">
              <span class="visually-hidden">${product.color}</span>
            </button>
          </div>
        </div>

        <!-- Selector de cantidad y acciones -->
        <div class="product-modal__actions">
          <div class="modal-qty-container">
            <button class="qty-btn" onclick="updateModalQuantity(-1)" aria-label="Disminuir cantidad">−</button>
            <span id="modalQuantityValue" class="modal-qty-value">1</span>
            <button class="qty-btn" onclick="updateModalQuantity(1)" aria-label="Aumentar cantidad">+</button>
          </div>

          <button class="btn btn--primary btn--modal-add" onclick="addProductFromModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span>Agregar al Carrito</span>
          </button>

          <button class="btn btn--icon-secondary ${isFav ? 'active' : ''}" 
                  id="modalFavoriteBtn"
                  onclick="toggleFavoriteFromModal(${product.id})"
                  aria-label="${isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}"
                  title="Guardar en favoritos">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="${isFav ? '#A87950' : 'none'}" stroke="${isFav ? '#A87950' : 'currentColor'}" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>

          <!-- Botón Compartir con Vista Previa Open Graph -->
          <button class="btn btn--icon-secondary" 
                  id="modalShareBtn"
                  onclick="shareProduct(${product.id})"
                  aria-label="Compartir enlace de producto con vista previa Open Graph"
                  title="Compartir producto (WhatsApp, Redes, Portapapeles)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>

        <!-- Consulta directa por WhatsApp -->
        <div style="margin-top: 0.5rem; margin-bottom: 1.25rem;">
          <a href="https://wa.me/573114006915?text=Hola%20ÁBICA,%20deseo%20consultar%20sobre%20el%20producto:%20${encodeURIComponent(product.name)}%20(${formatCurrency(product.price)})" 
             target="_blank" 
             rel="noopener noreferrer" 
             class="btn btn--outline btn--full btn--sm" 
             style="border-color: #25D366; color: #128C7E; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.16C10.57 20.16 9.12 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.05 20.16ZM16.56 14.33C16.31 14.21 15.09 13.61 14.86 13.53C14.64 13.45 14.47 13.41 14.31 13.65C14.14 13.9 13.66 14.46 13.51 14.63C13.37 14.8 13.22 14.82 12.97 14.7C12.72 14.58 11.92 14.32 10.97 13.47C10.23 12.81 9.73 11.99 9.59 11.75C9.44 11.5 9.57 11.37 9.7 11.24C9.81 11.13 9.94 10.95 10.07 10.8C10.19 10.65 10.23 10.55 10.31 10.38C10.39 10.21 10.35 10.07 10.29 9.95C10.23 9.83 9.74 8.63 9.54 8.14C9.34 7.66 9.14 7.73 8.99 7.72C8.85 7.71 8.68 7.71 8.52 7.71C8.35 7.71 8.08 7.77 7.85 8.02C7.62 8.27 6.98 8.87 6.98 10.09C6.98 11.31 7.87 12.49 8 12.65C8.12 12.82 9.72 15.29 12.18 16.35C12.77 16.6 13.22 16.75 13.58 16.86C14.17 17.05 14.71 17.02 15.13 16.96C15.6 16.89 16.57 16.37 16.77 15.8C16.98 15.23 16.98 14.74 16.91 14.63C16.85 14.52 16.7 14.46 16.45 14.33H16.56Z"/>
            </svg>
            <span>Preguntar por WhatsApp (311 400 6915)</span>
          </a>
        </div>

        <!-- Sellos de confianza -->
        <div class="product-modal__badges-row">
          <div class="trust-badge-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            <span>Envío asegurado a toda Colombia</span>
          </div>
          <div class="trust-badge-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Garantía estructural de 5 años</span>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add("modal--open");
  if (backdrop) backdrop.classList.add("backdrop--visible");
  document.body.style.overflow = "hidden";

  // Actualización dinámica de etiquetas Open Graph para indexación y compartición
  if (window.AbicaSEO && typeof window.AbicaSEO.setProductOpenGraph === "function") {
    window.AbicaSEO.setProductOpenGraph(product);
  }
}

function changeModalMainImage(src, btn) {
  const mainImg = document.getElementById("modalMainImg");
  if (mainImg) {
    mainImg.src = src;
  }
  document.querySelectorAll(".thumb-btn").forEach(t => t.classList.remove("active"));
  if (btn) btn.classList.add("active");
}

function updateModalQuantity(delta) {
  currentModalQuantity = Math.max(1, Math.min(99, currentModalQuantity + delta));
  const qtyEl = document.getElementById("modalQuantityValue");
  if (qtyEl) {
    qtyEl.textContent = currentModalQuantity;
  }
}

function addProductFromModal() {
  if (!currentModalProductId) return;
  addToCart(currentModalProductId, currentModalQuantity, currentModalSelectedColor);
  closeModal("productDetailModal");
  openDrawer("cartDrawer");
}

function toggleFavoriteFromModal(productId) {
  const isFav = toggleFavorite(productId);
  const btn = document.getElementById("modalFavoriteBtn");
  if (btn) {
    btn.classList.toggle("active", isFav);
    const icon = btn.querySelector("svg");
    if (icon) {
      icon.style.fill = isFav ? "#A87950" : "none";
      icon.style.stroke = isFav ? "#A87950" : "currentColor";
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  const backdrop = document.getElementById("modalBackdrop");
  if (modal) modal.classList.remove("modal--open");
  if (backdrop) backdrop.classList.remove("backdrop--visible");
  document.body.style.overflow = "";

  // Restaurar Open Graph por defecto si se cierra el modal de producto
  if (modalId === "productDetailModal") {
    if (window.AbicaSEO && typeof window.AbicaSEO.resetOpenGraph === "function") {
      window.AbicaSEO.resetOpenGraph();
    }
  }
}

// ----------------- CHECKOUT DEMOSTRATIVO -----------------

function openCheckoutModal() {
  if (cart.length === 0) {
    showToast("Tu carrito está vacío para procesar compra", "warning");
    return;
  }

  closeAllDrawers();

  const { subtotal, totalItems, isFreeShipping, shippingCost, total } = getCartCalculations();

  // Renderizar resumen de artículos dentro del modal de checkout
  const checkoutItemsContainer = document.getElementById("checkoutOrderItems");
  const checkoutSubtotalEl = document.getElementById("checkoutSubtotal");
  const checkoutShippingEl = document.getElementById("checkoutShippingCost");
  const checkoutTotalEl = document.getElementById("checkoutTotal");

  if (checkoutItemsContainer) {
    checkoutItemsContainer.innerHTML = cart.map(item => `
      <div class="checkout-summary-item">
        <div class="checkout-summary-item__img-wrap">
          <img src="${item.image}" alt="${item.name}">
          <span class="checkout-item-badge">${item.quantity}</span>
        </div>
        <div class="checkout-summary-item__details">
          <h4>${item.name}</h4>
          <span class="checkout-item-color">Color: ${item.color}</span>
        </div>
        <span class="checkout-summary-item__price">${formatCurrency(item.price * item.quantity)}</span>
      </div>
    `).join("");
  }

  if (checkoutSubtotalEl) checkoutSubtotalEl.textContent = formatCurrency(subtotal);
  if (checkoutShippingEl) {
    checkoutShippingEl.innerHTML = isFreeShipping ? '<span class="text-success font-bold">GRATIS</span>' : formatCurrency(shippingCost);
  }
  if (checkoutTotalEl) checkoutTotalEl.textContent = formatCurrency(total);

  // Auto-completar datos si el usuario ha iniciado sesión
  if (currentUser) {
    const fName = document.getElementById("customerFirstName");
    const lName = document.getElementById("customerLastName");
    const email = document.getElementById("customerEmail");
    const phone = document.getElementById("customerPhone");
    const addr = document.getElementById("customerAddress");
    const city = document.getElementById("customerCity");

    if (fName && !fName.value) fName.value = currentUser.firstName || currentUser.name.split(" ")[0];
    if (lName && !lName.value) lName.value = currentUser.lastName || (currentUser.name.split(" ").slice(1).join(" ") || "");
    if (email && !email.value) email.value = currentUser.email || "";
    if (phone && !phone.value) phone.value = currentUser.phone || "";
    if (addr && !addr.value && currentUser.address) addr.value = currentUser.address;
    if (city && !city.value && currentUser.city) city.value = currentUser.city;
  }

  const modal = document.getElementById("checkoutModal");
  const backdrop = document.getElementById("modalBackdrop");
  if (modal) modal.classList.add("modal--open");
  if (backdrop) backdrop.classList.add("backdrop--visible");
  document.body.style.overflow = "hidden";
}

function handleCheckoutSubmit(e) {
  e.preventDefault();

  const form = e.target;
  let isValid = true;

  // Validación de campos obligatorios
  const requiredFields = [
    { id: "customerFirstName", name: "Nombre" },
    { id: "customerLastName", name: "Apellidos" },
    { id: "customerEmail", name: "Correo electrónico" },
    { id: "customerPhone", name: "Teléfono de contacto" },
    { id: "customerAddress", name: "Dirección de entrega" },
    { id: "customerCity", name: "Ciudad / Municipio" },
    { id: "customerDepartment", name: "Departamento" }
  ];

  requiredFields.forEach(field => {
    const input = document.getElementById(field.id);
    const errorMsg = document.getElementById(`${field.id}Error`);
    if (!input) return;

    if (!input.value.trim()) {
      isValid = false;
      input.classList.add("input--error");
      if (errorMsg) {
        errorMsg.textContent = `El campo ${field.name} es obligatorio.`;
        errorMsg.style.display = "block";
      }
    } else {
      // Validaciones específicas
      if (field.id === "customerEmail") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value.trim())) {
          isValid = false;
          input.classList.add("input--error");
          if (errorMsg) {
            errorMsg.textContent = "Ingresa un correo electrónico válido.";
            errorMsg.style.display = "block";
          }
          return;
        }
      }

      if (field.id === "customerPhone") {
        const cleanPhone = input.value.replace(/\D/g, "");
        if (cleanPhone.length < 7) {
          isValid = false;
          input.classList.add("input--error");
          if (errorMsg) {
            errorMsg.textContent = "Ingresa un número telefónico válido (mínimo 7 dígitos).";
            errorMsg.style.display = "block";
          }
          return;
        }
      }

      input.classList.remove("input--error");
      if (errorMsg) errorMsg.style.display = "none";
    }
  });

  if (!isValid) {
    showToast("Por favor completa los campos obligatorios del formulario", "warning");
    return;
  }

  // 1. Verificación de Honeypot Anti-Bot
  if (window.Security && window.Security.isHoneypotTriggered(form)) {
    console.warn("[Security] Checkout bloqueado por activación de honeypot bot.");
    return;
  }

  // 2. Control de Frecuencia / Rate Limiting (Máx 3 pedidos por minuto)
  if (window.Security && window.Security.rateLimiter) {
    const rateCheck = window.Security.rateLimiter.check("checkout", 3, 60000);
    if (!rateCheck.allowed) {
      showToast(`Has realizado múltiples intentos de pedido. Por favor espera ${rateCheck.waitTimeSeconds} segundos.`, "warning");
      return;
    }
  }

  // Capturar y sanitizar datos del pedido
  const rawFirstName = document.getElementById("customerFirstName").value.trim();
  const rawLastName = document.getElementById("customerLastName").value.trim();
  const rawEmail = document.getElementById("customerEmail").value.trim();
  const rawAddress = document.getElementById("customerAddress").value.trim();
  const rawCity = document.getElementById("customerCity").value.trim();
  const rawDepartment = document.getElementById("customerDepartment").value;
  const paymentMethodEl = document.querySelector('input[name="paymentMethod"]:checked');
  const rawPaymentMethod = paymentMethodEl ? paymentMethodEl.value : "Transferencia / PSE";

  const customerName = window.Security ? window.Security.sanitizeHTML(`${rawFirstName} ${rawLastName}`) : `${rawFirstName} ${rawLastName}`;
  const customerEmail = window.Security ? window.Security.sanitizeHTML(rawEmail) : rawEmail;
  const customerAddress = window.Security ? window.Security.sanitizeHTML(`${rawAddress}, ${rawCity}, ${rawDepartment}`) : `${rawAddress}, ${rawCity}, ${rawDepartment}`;
  const paymentMethod = window.Security ? window.Security.sanitizeHTML(rawPaymentMethod) : rawPaymentMethod;

  const orderCalculation = getCartCalculations();
  const orderNumber = `AB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Procesar pedido y persistir en backend PostgreSQL
  const submitBtn = document.getElementById("submitCheckoutBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="spinner-circle"></span>
      <span>Procesando y Guardando en Servidor...</span>
    `;
  }

  const rawPhone = document.getElementById("customerPhone") ? document.getElementById("customerPhone").value.trim() : "";
  let finalOrderNumber = orderNumber;

  fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName,
      customerEmail,
      customerPhone: rawPhone,
      customerAddress,
      paymentMethod,
      items: [...cart],
      subtotal: orderCalculation.subtotal,
      shippingCost: orderCalculation.shipping,
      discount: orderCalculation.discount,
      total: orderCalculation.total,
      notes: "Pedido registrado desde la tienda web"
    })
  })
  .then(res => res.ok ? res.json() : null)
  .then(data => {
    if (data && data.success && data.order) {
      finalOrderNumber = data.order.orderNumber;
    }
  })
  .catch(err => {
    console.info("Continuando con simulación de pedido:", err);
  })
  .finally(() => {
    setTimeout(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Confirmar Pedido Demostrativo</span>
        `;
      }

      closeModal("checkoutModal");
      showOrderConfirmation({
        orderNumber: finalOrderNumber,
        customerName,
        customerEmail,
        customerAddress,
        paymentMethod,
        items: [...cart],
        total: orderCalculation.total
      });

      // Limpiar carrito tras la compra exitosa
      clearCart();
      form.reset();
    }, 600);
  });
}

function showOrderConfirmation(orderData) {
  const modal = document.getElementById("orderSuccessModal");
  const detailsContainer = document.getElementById("orderSuccessDetails");
  const backdrop = document.getElementById("modalBackdrop");

  if (!modal || !detailsContainer) return;

  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + 5);
  const formattedDate = estimatedDate.toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const safeName = window.Security ? window.Security.sanitizeHTML(orderData.customerName) : orderData.customerName;
  const safeAddress = window.Security ? window.Security.sanitizeHTML(orderData.customerAddress) : orderData.customerAddress;
  const safeEmail = window.Security ? window.Security.sanitizeHTML(orderData.customerEmail) : orderData.customerEmail;
  const safeOrderNumber = window.Security ? window.Security.sanitizeHTML(orderData.orderNumber) : orderData.orderNumber;
  const safePaymentMethod = window.Security ? window.Security.sanitizeHTML(orderData.paymentMethod) : orderData.paymentMethod;

  detailsContainer.innerHTML = `
    <div class="order-confirmation-badge">
      <div class="success-icon-wrap">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#69745A" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h2 class="order-title">¡Compra Demostrativa Exitosa!</h2>
      <p class="order-subtitle">Gracias por recorrer la experiencia de compra de <strong>ÁBICA</strong>.</p>
      <div class="order-ref-pill">Número de Orden: <strong>#${safeOrderNumber}</strong></div>
    </div>

    <div class="order-details-grid">
      <div class="order-info-card">
        <h4>Destinatario & Envío</h4>
        <p><strong>${safeName}</strong></p>
        <p>${safeAddress}</p>
        <p>${safeEmail}</p>
        <p class="delivery-estimate-text">Entrega estimada: <strong>${formattedDate}</strong></p>
      </div>
      <div class="order-info-card">
        <h4>Método & Liquidación</h4>
        <p>Modalidad: <strong>${safePaymentMethod} (Simulado)</strong></p>
        <p>Estado de pago: <span class="badge-status-paid">Aprobado / Simulación</span></p>
        <p class="total-paid-highlight">Total Liquidado: <strong>${formatCurrency(orderData.total)}</strong></p>
      </div>
    </div>

    <div class="order-items-list-box">
      <h4>Piezas de Mobiliario Ordenadas</h4>
      <div class="order-items-scroll">
        ${orderData.items.map(item => `
          <div class="order-item-row">
            <img src="${window.Security ? window.Security.sanitizeURL(item.image) : item.image}" alt="${window.Security ? window.Security.sanitizeHTML(item.name) : item.name}">
            <div class="order-item-desc">
              <h5>${window.Security ? window.Security.sanitizeHTML(item.name) : item.name}</h5>
              <span>Acabado: ${window.Security ? window.Security.sanitizeHTML(item.color) : item.color} | Cantidad: ${Math.min(99, Math.max(1, parseInt(item.quantity, 10)))}</span>
            </div>
            <span class="order-item-price">${formatCurrency(item.price * item.quantity)}</span>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="order-confirmation-actions">
      <button class="btn btn--outline" onclick="window.print()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Imprimir Comprobante
      </button>
      <button class="btn btn--primary" onclick="closeModal('orderSuccessModal'); document.getElementById('catalogSection').scrollIntoView({behavior: 'smooth'});">
        Regresar a la Tienda
      </button>
    </div>
  `;

  modal.classList.add("modal--open");
  if (backdrop) backdrop.classList.add("backdrop--visible");
  document.body.style.overflow = "hidden";
}

// ----------------- TOAST DE NOTIFICACIONES -----------------

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;

  const iconSvg = type === "success" 
    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#69745A" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
    : type === "warning"
    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A87950" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#252722" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

  toast.innerHTML = `
    <span class="toast__icon">${iconSvg}</span>
    <span class="toast__message">${message}</span>
    <button class="toast__close" onclick="this.parentElement.remove()" aria-label="Cerrar notificación">&times;</button>
  `;

  container.appendChild(toast);

  // Auto-eliminar a los 3.8 segundos
  setTimeout(() => {
    toast.classList.add("toast--hiding");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3800);
}

// ----------------- STICKY HEADER & ACCORDION -----------------

function setupStickyHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 40) {
      header.classList.add("site-header--scrolled");
    } else {
      header.classList.remove("site-header--scrolled");
    }
  }, { passive: true });
}

function setupFaqAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(item => {
    const trigger = item.querySelector(".faq-question");
    if (trigger) {
      trigger.addEventListener("click", () => {
        const isOpen = item.classList.contains("active");
        faqItems.forEach(i => i.classList.remove("active"));
        if (!isOpen) {
          item.classList.add("active");
        }
      });
    }
  });
}

// ==========================================================================
// MÓDULO DE AUTENTICACIÓN (LOGIN, REGISTRO, PERFIL Y MENÚ DESPLEGABLE)
// ==========================================================================

const AUTH_STORAGE_KEY = "abica_user_session_v1";
const REGISTERED_USERS_KEY = "abica_registered_users_v1";

// Usuario demostrativo por defecto
const DEFAULT_DEMO_USER = {
  id: "user-demo-01",
  name: "Camila Restrepo",
  firstName: "Camila",
  lastName: "Restrepo Gómez",
  email: "camila@ejemplo.com",
  phone: "3104567890",
  address: "Calle 93 # 14-20 Apto 402",
  city: "Bogotá D.C.",
  department: "Bogotá D.C."
};

let currentUser = null;

function initAuth() {
  // Cargar usuario autenticado de localStorage
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      currentUser = JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Error al cargar sesión de usuario:", e);
    currentUser = null;
  }

  renderHeaderAuth();
  renderMobileAuth();

  // Escuchadores de formularios
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);
  }

  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegisterSubmit);
  }
}

function getUserInitials(name) {
  if (!name) return "US";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function renderHeaderAuth() {
  const container = document.getElementById("headerAuthContainer");
  if (!container) return;

  if (!currentUser) {
    container.innerHTML = `
      <button class="header-login-btn" onclick="openAuthModal('login')" aria-label="Iniciar Sesión en ÁBICA">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>Iniciar Sesión</span>
      </button>
    `;
  } else {
    const safeName = window.Security ? window.Security.sanitizeHTML(currentUser.name) : currentUser.name;
    const safeEmail = window.Security ? window.Security.sanitizeHTML(currentUser.email) : currentUser.email;
    const safeShortName = window.Security ? window.Security.sanitizeHTML(currentUser.firstName || currentUser.name.split(" ")[0]) : (currentUser.firstName || currentUser.name.split(" ")[0]);
    const initials = window.Security ? window.Security.sanitizeHTML(getUserInitials(currentUser.name)) : getUserInitials(currentUser.name);

    container.innerHTML = `
      <button class="header-user-btn" id="headerUserBtn" onclick="toggleUserDropdown(event)" aria-expanded="false" aria-label="Menú de cuenta de ${safeName}">
        <span class="user-avatar-circle">${initials}</span>
        <span class="user-display-name">${safeShortName}</span>
        <svg class="user-dropdown-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      <div class="user-dropdown-menu" id="userDropdownMenu">
        <div class="user-dropdown-header">
          <h5>${safeName}</h5>
          <p>${safeEmail}</p>
        </div>
        ${currentUser && currentUser.role === 'ADMIN' ? `
        <a class="user-dropdown-item" href="/consola" style="background: #FDF2E9; color: #A87950; font-weight: 700; text-decoration: none;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span>Consola Admin (/consola)</span>
        </a>
        ` : ''}
        <button class="user-dropdown-item" onclick="closeUserDropdown(); openDrawer('wishlistDrawer');">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <span>Mis Favoritos</span>
        </button>
        <button class="user-dropdown-item" onclick="closeUserDropdown(); openDrawer('cartDrawer');">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span>Mi Carrito</span>
        </button>
        <button class="user-dropdown-item" onclick="closeUserDropdown(); document.getElementById('catalogSection').scrollIntoView({behavior: 'smooth'});">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span>Explorar Catálogo</span>
        </button>
        <div class="user-dropdown-divider"></div>
        <button class="user-dropdown-item user-dropdown-item--danger" onclick="logoutUser()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    `;
  }
}

function renderMobileAuth() {
  const mobileContainer = document.getElementById("mobileNavUserBox");
  if (!mobileContainer) return;

  if (!currentUser) {
    mobileContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.6rem;">
        <span style="font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-carbon-muted);">Mi Cuenta</span>
        <button class="btn btn--primary btn--full btn--sm" onclick="closeAllDrawers(); openAuthModal('login');">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>Iniciar Sesión / Registro</span>
        </button>
      </div>
    `;
  } else {
    const initials = window.Security ? window.Security.sanitizeHTML(getUserInitials(currentUser.name)) : getUserInitials(currentUser.name);
    const safeName = window.Security ? window.Security.sanitizeHTML(currentUser.name) : currentUser.name;
    const safeEmail = window.Security ? window.Security.sanitizeHTML(currentUser.email) : currentUser.email;

    mobileContainer.innerHTML = `
      <div class="mobile-user-card">
        <span class="user-avatar-circle">${initials}</span>
        <div class="mobile-user-details">
          <h5>${safeName}</h5>
          <p>${safeEmail}</p>
        </div>
      </div>
      ${currentUser && currentUser.role === 'ADMIN' ? `
      <a class="btn btn--primary btn--full btn--sm" href="/consola" style="margin-bottom: 8px; text-decoration: none; justify-content: center; background-color: var(--color-roble);">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <span>Consola Admin (/consola)</span>
      </a>
      ` : ''}
      <button class="mobile-logout-btn" onclick="logoutUser()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        <span>Cerrar Sesión</span>
      </button>
    `;
  }
}

function toggleUserDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById("userDropdownMenu");
  const btn = document.getElementById("headerUserBtn");
  if (dropdown && btn) {
    const isShown = dropdown.classList.contains("show");
    dropdown.classList.toggle("show", !isShown);
    btn.classList.toggle("active", !isShown);
    btn.setAttribute("aria-expanded", !isShown ? "true" : "false");
  }
}

function closeUserDropdown() {
  const dropdown = document.getElementById("userDropdownMenu");
  const btn = document.getElementById("headerUserBtn");
  if (dropdown) dropdown.classList.remove("show");
  if (btn) {
    btn.classList.remove("active");
    btn.setAttribute("aria-expanded", "false");
  }
}

function openAuthModal(defaultTab = "login") {
  closeAllDrawers();
  closeUserDropdown();

  // Limpiar mensajes de error previos
  document.querySelectorAll(".auth-modal .form-error-msg").forEach(el => el.style.display = "none");
  document.querySelectorAll(".auth-modal .form-input").forEach(el => el.classList.remove("input--error"));

  switchAuthTab(defaultTab);

  const modal = document.getElementById("authModal");
  const backdrop = document.getElementById("modalBackdrop");
  if (modal) modal.classList.add("modal--open");
  if (backdrop) backdrop.classList.add("backdrop--visible");
  document.body.style.overflow = "hidden";
}

function switchAuthTab(tabName) {
  const tabBtnLogin = document.getElementById("tabBtnLogin");
  const tabBtnRegister = document.getElementById("tabBtnRegister");
  const authTabLogin = document.getElementById("authTabLogin");
  const authTabRegister = document.getElementById("authTabRegister");

  if (tabName === "login") {
    if (tabBtnLogin) tabBtnLogin.classList.add("active");
    if (tabBtnRegister) tabBtnRegister.classList.remove("active");
    if (authTabLogin) authTabLogin.classList.add("active");
    if (authTabRegister) authTabRegister.classList.remove("active");
  } else {
    if (tabBtnLogin) tabBtnLogin.classList.remove("active");
    if (tabBtnRegister) tabBtnRegister.classList.add("active");
    if (authTabLogin) authTabLogin.classList.remove("active");
    if (authTabRegister) authTabRegister.classList.add("active");
  }
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";

  if (btn) {
    btn.innerHTML = isPassword
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }
}

function handleLoginSubmit(e) {
  e.preventDefault();

  // 1. Verificación Honeypot Anti-Bot
  if (window.Security && window.Security.isHoneypotTriggered(e.target)) {
    console.warn("[Security] Login bloqueado por honeypot bot.");
    return;
  }

  // 2. Rate Limiting contra ataques de fuerza bruta (máximo 5 intentos por cada 2 minutos)
  if (window.Security && window.Security.rateLimiter) {
    const rateCheck = window.Security.rateLimiter.check("auth_login", 5, 120000);
    if (!rateCheck.allowed) {
      showToast(`Has superado los intentos de acceso. Por seguridad, espera ${rateCheck.waitTimeSeconds} segundos para reintentar.`, "warning");
      return;
    }
  }

  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const emailError = document.getElementById("loginEmailError");
  const passwordError = document.getElementById("loginPasswordError");

  let isValid = true;
  const rawEmail = emailInput ? emailInput.value.trim() : "";
  const passVal = passwordInput ? passwordInput.value.trim() : "";
  const emailVal = window.Security ? window.Security.sanitizeHTML(rawEmail) : rawEmail;

  // Validación de Correo
  if (!emailVal) {
    isValid = false;
    if (emailInput) emailInput.classList.add("input--error");
    if (emailError) {
      emailError.textContent = "Ingresa tu correo electrónico.";
      emailError.style.display = "block";
    }
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
    isValid = false;
    if (emailInput) emailInput.classList.add("input--error");
    if (emailError) {
      emailError.textContent = "El formato de correo no es válido.";
      emailError.style.display = "block";
    }
  } else {
    if (emailInput) emailInput.classList.remove("input--error");
    if (emailError) emailError.style.display = "none";
  }

  // Validación de Contraseña
  if (!passVal) {
    isValid = false;
    if (passwordInput) passwordInput.classList.add("input--error");
    if (passwordError) {
      passwordError.textContent = "Ingresa tu contraseña.";
      passwordError.style.display = "block";
    }
  } else if (passVal.length < 4) {
    isValid = false;
    if (passwordInput) passwordInput.classList.add("input--error");
    if (passwordError) {
      passwordError.textContent = "La contraseña debe tener al menos 4 caracteres.";
      passwordError.style.display = "block";
    }
  } else {
    if (passwordInput) passwordInput.classList.remove("input--error");
    if (passwordError) passwordError.style.display = "none";
  }

  if (!isValid) return;

  // 1. Intentar autenticación con el backend Node.js + PostgreSQL
  fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: emailVal, password: passVal })
  })
  .then(res => res.ok ? res.json() : null)
  .then(data => {
    if (data && data.success && data.user) {
      if (data.token) {
        localStorage.setItem("abica_jwt_token", data.token);
        if (data.user.role === "ADMIN") {
          localStorage.setItem("abica_admin_jwt_token", data.token);
          localStorage.setItem("abica_admin_current_user", JSON.stringify(data.user));
        }
      }
      currentUser = data.user;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      renderHeaderAuth();
      renderMobileAuth();
      closeModal("authModal");
      showToast(`¡Bienvenido de nuevo, ${currentUser.firstName || currentUser.name}!`, "success");
      return;
    }
  })
  .catch(() => {
    // Si la API no está disponible en este momento, continuar con fallback local
  });

  // 2. Fallback de usuarios registrados o demo
  let registered = [];
  try {
    registered = JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) || "[]");
  } catch (err) {
    registered = [];
  }

  let matchedUser = registered.find(u => u.email.toLowerCase() === emailVal.toLowerCase());

  if (!matchedUser) {
    if (emailVal.toLowerCase() === "admin@abica.com") {
      matchedUser = {
        id: "admin-1",
        name: "Administrador ÁBICA",
        firstName: "Administrador",
        lastName: "ÁBICA",
        email: "admin@abica.com",
        role: "ADMIN",
        phone: "+57 300 000 0000",
        address: "Sede Principal ÁBICA",
        city: "Bogotá D.C.",
        department: "Bogotá D.C."
      };
    } else if (emailVal.toLowerCase() === DEFAULT_DEMO_USER.email.toLowerCase()) {
      matchedUser = DEFAULT_DEMO_USER;
    } else {
      const generatedName = emailVal.split("@")[0].replace(/[._-]/g, " ");
      matchedUser = {
        id: "user-" + Date.now(),
        name: generatedName.charAt(0).toUpperCase() + generatedName.slice(1),
        firstName: generatedName.charAt(0).toUpperCase() + generatedName.slice(1),
        lastName: "",
        email: emailVal,
        role: "CUSTOMER",
        phone: "",
        address: "",
        city: "Bogotá D.C.",
        department: "Bogotá D.C."
      };
    }
  }

  // Sanitizar objeto antes de persistir
  currentUser = window.Security ? window.Security.sanitizeUserData(matchedUser) : matchedUser;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
  } catch (err) {
    console.error("No se pudo guardar la sesión:", err);
  }

  renderHeaderAuth();
  renderMobileAuth();
  closeModal("authModal");
  showToast(`¡Bienvenido de nuevo, ${currentUser.firstName || currentUser.name}!`, "success");
}

function handleRegisterSubmit(e) {
  e.preventDefault();

  // 1. Verificación Honeypot Anti-Bot
  if (window.Security && window.Security.isHoneypotTriggered(e.target)) {
    console.warn("[Security] Registro bloqueado por honeypot bot.");
    return;
  }

  // 2. Rate Limiting contra creación masiva de cuentas
  if (window.Security && window.Security.rateLimiter) {
    const rateCheck = window.Security.rateLimiter.check("auth_register", 3, 120000);
    if (!rateCheck.allowed) {
      showToast(`Por seguridad, espera ${rateCheck.waitTimeSeconds} segundos antes de enviar otro registro.`, "warning");
      return;
    }
  }

  const nameInput = document.getElementById("registerName");
  const emailInput = document.getElementById("registerEmail");
  const phoneInput = document.getElementById("registerPhone");
  const passInput = document.getElementById("registerPassword");
  const confirmPassInput = document.getElementById("registerConfirmPassword");
  const termsInput = document.getElementById("registerTerms");

  const nameError = document.getElementById("registerNameError");
  const emailError = document.getElementById("registerEmailError");
  const phoneError = document.getElementById("registerPhoneError");
  const passError = document.getElementById("registerPasswordError");
  const confirmPassError = document.getElementById("registerConfirmPasswordError");
  const termsError = document.getElementById("registerTermsError");

  let isValid = true;

  // Nombre
  const rawName = nameInput ? nameInput.value.trim() : "";
  const nameVal = window.Security ? window.Security.sanitizeHTML(rawName) : rawName;
  if (!nameVal) {
    isValid = false;
    if (nameInput) nameInput.classList.add("input--error");
    if (nameError) { nameError.textContent = "Ingresa tu nombre completo."; nameError.style.display = "block"; }
  } else {
    if (nameInput) nameInput.classList.remove("input--error");
    if (nameError) nameError.style.display = "none";
  }

  // Correo
  const rawEmail = emailInput ? emailInput.value.trim() : "";
  const emailVal = window.Security ? window.Security.sanitizeHTML(rawEmail) : rawEmail;
  if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
    isValid = false;
    if (emailInput) emailInput.classList.add("input--error");
    if (emailError) { emailError.textContent = "Ingresa un correo electrónico válido."; emailError.style.display = "block"; }
  } else {
    if (emailInput) emailInput.classList.remove("input--error");
    if (emailError) emailError.style.display = "none";
  }

  // Teléfono
  const rawPhone = phoneInput ? phoneInput.value.trim() : "";
  const phoneVal = window.Security ? window.Security.sanitizeHTML(rawPhone) : rawPhone;
  if (!phoneVal || phoneVal.replace(/\D/g, "").length < 7) {
    isValid = false;
    if (phoneInput) phoneInput.classList.add("input--error");
    if (phoneError) { phoneError.textContent = "Ingresa un número telefónico de al menos 7 dígitos."; phoneError.style.display = "block"; }
  } else {
    if (phoneInput) phoneInput.classList.remove("input--error");
    if (phoneError) phoneError.style.display = "none";
  }

  // Contraseña
  const passVal = passInput ? passInput.value.trim() : "";
  if (!passVal || passVal.length < 6) {
    isValid = false;
    if (passInput) passInput.classList.add("input--error");
    if (passError) { passError.textContent = "La contraseña debe tener mínimo 6 caracteres."; passError.style.display = "block"; }
  } else {
    if (passInput) passInput.classList.remove("input--error");
    if (passError) passError.style.display = "none";
  }

  // Confirmar Contraseña
  const confirmVal = confirmPassInput ? confirmPassInput.value.trim() : "";
  if (confirmVal !== passVal) {
    isValid = false;
    if (confirmPassInput) confirmPassInput.classList.add("input--error");
    if (confirmPassError) { confirmPassError.textContent = "Las contraseñas no coinciden."; confirmPassError.style.display = "block"; }
  } else {
    if (confirmPassInput) confirmPassInput.classList.remove("input--error");
    if (confirmPassError) confirmPassError.style.display = "none";
  }

  // Términos
  if (termsInput && !termsInput.checked) {
    isValid = false;
    if (termsError) { termsError.textContent = "Debes aceptar los términos demostrativos."; termsError.style.display = "block"; }
  } else {
    if (termsError) termsError.style.display = "none";
  }

  if (!isValid) return;

  const parts = nameVal.split(" ");
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");

  const newUser = {
    id: "user-" + Date.now(),
    name: nameVal,
    firstName: firstName,
    lastName: lastName,
    email: emailVal,
    phone: phoneVal,
    address: "",
    city: "Bogotá D.C.",
    department: "Bogotá D.C."
  };

  const safeNewUser = window.Security ? window.Security.sanitizeUserData(newUser) : newUser;

  // Guardar en usuarios registrados
  let registered = [];
  try {
    registered = JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) || "[]");
  } catch (err) {
    registered = [];
  }
  registered.push(safeNewUser);
  try {
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registered));
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safeNewUser));
  } catch (err) {
    console.error("No se pudo guardar la sesión:", err);
  }

  currentUser = safeNewUser;
  renderHeaderAuth();
  renderMobileAuth();
  closeModal("authModal");
  showToast(`¡Cuenta creada con éxito! Bienvenido, ${safeNewUser.firstName || safeNewUser.name}`, "success");
}

function quickLoginDemo() {
  currentUser = DEFAULT_DEMO_USER;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
  } catch (err) {
    console.error("Error al guardar demo:", err);
  }
  renderHeaderAuth();
  renderMobileAuth();
  closeModal("authModal");
  showToast("Has ingresado con la cuenta demo de Camila Restrepo.", "success");
}

function logoutUser() {
  currentUser = null;
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (err) {
    console.error("Error al cerrar sesión:", err);
  }
  closeUserDropdown();
  closeAllDrawers();
  renderHeaderAuth();
  renderMobileAuth();
  showToast("Has cerrado sesión correctamente.", "info");
}

function showForgotPasswordDemo() {
  showToast("Se ha enviado un enlace de recuperación simulado a tu correo.", "info");
}

// ==========================================================================
// MÓDULO DE MODO OSCURO (DARK MODE THEME CONTROLLER)
// ==========================================================================

const THEME_STORAGE_KEY = "abica_theme_preference_v1";

function initTheme() {
  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  } catch (e) {
    console.warn("Error al leer tema guardado:", e);
  }

  // Si el usuario no tiene preferencia guardada, verificar el sistema operativo
  if (!savedTheme) {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    savedTheme = prefersDark ? "dark" : "light";
  }

  applyTheme(savedTheme, false);

  // Escuchar cambios en la preferencia del sistema operativo si no se ha guardado una elección manual
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      let currentStored = null;
      try {
        currentStored = localStorage.getItem(THEME_STORAGE_KEY);
      } catch (err) {}
      if (!currentStored) {
        applyTheme(e.matches ? "dark" : "light", false);
      }
    });
  }

  // Conectar botones de alternancia
  const desktopThemeBtn = document.getElementById("themeToggleBtn");
  const mobileThemeBtn = document.getElementById("themeToggleBtnMobile");

  if (desktopThemeBtn) {
    desktopThemeBtn.addEventListener("click", toggleTheme);
  }
  if (mobileThemeBtn) {
    mobileThemeBtn.addEventListener("click", toggleTheme);
  }
}

function applyTheme(theme, notify = false) {
  const isDark = theme === "dark";
  if (isDark) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  updateThemeIcons(isDark);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    console.warn("No se pudo persistir el tema:", e);
  }

  if (notify) {
    showToast(isDark ? "Modo oscuro contemporáneo activado" : "Modo luminoso editorial activado", "info");
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(nextTheme, true);
}

function updateThemeIcons(isDark) {
  const sunIcon = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  `;

  const moonIcon = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  `;

  const desktopBtn = document.getElementById("themeToggleBtn");
  const mobileBtn = document.getElementById("themeToggleBtnMobile");

  if (desktopBtn) {
    desktopBtn.innerHTML = isDark ? sunIcon : moonIcon;
    desktopBtn.title = isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
    desktopBtn.setAttribute("aria-label", isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  }

  if (mobileBtn) {
    mobileBtn.innerHTML = isDark ? sunIcon : moonIcon;
    mobileBtn.title = isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
    mobileBtn.setAttribute("aria-label", isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  }
}

// ==========================================================================
// MÓDULO DE BÚSQUEDA INTERACTIVA EN VIVO (LIVE SEARCH SYSTEM)
// ==========================================================================

let searchDebounceTimer = null;
let activeSearchIndex = -1;

function initInteractiveSearch() {
  const searchInput = document.getElementById("liveSearchModalInput");
  const clearBtn = document.getElementById("liveSearchModalClearBtn");

  if (searchInput) {
    // Filtrado en vivo con debounce de 150ms
    searchInput.addEventListener("input", (e) => {
      const val = e.target.value;
      if (clearBtn) {
        clearBtn.style.display = val.trim().length > 0 ? "block" : "none";
      }

      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        renderLiveSearchResults(val.trim());
      }, 150);
    });

    // Navegación con teclado dentro del input (Flechas y Enter)
    searchInput.addEventListener("keydown", handleSearchKeyboardNav);
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
        clearBtn.style.display = "none";
        searchInput.focus();
        renderLiveSearchResults("");
      }
    });
  }

  // Atajos globales de teclado: '/' y 'Ctrl+K' o 'Cmd+K'
  document.addEventListener("keydown", (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const isModifierKey = isMac ? e.metaKey : e.ctrlKey;
    const activeEl = document.activeElement;
    const isTyping = activeEl && (
      activeEl.tagName === "INPUT" || 
      activeEl.tagName === "TEXTAREA" || 
      activeEl.isContentEditable
    );

    // Ctrl+K o Cmd+K
    if (isModifierKey && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openSearchModal();
      return;
    }

    // '/' cuando no se está escribiendo en ningún campo
    if (e.key === "/" && !isTyping) {
      e.preventDefault();
      openSearchModal();
      return;
    }
  });

  // Render inicial de sugerencias
  renderLiveSearchResults("");
}

function openSearchModal(initialQuery = "") {
  closeAllDrawers();
  closeModal("productDetailModal");
  closeModal("checkoutModal");
  closeModal("authModal");

  const modal = document.getElementById("searchModal");
  const backdrop = document.getElementById("modalBackdrop");
  const input = document.getElementById("liveSearchModalInput");
  const clearBtn = document.getElementById("liveSearchModalClearBtn");

  if (modal) modal.classList.add("modal--open");
  if (backdrop) backdrop.classList.add("backdrop--visible");
  document.body.style.overflow = "hidden";

  if (input) {
    if (initialQuery) {
      input.value = initialQuery;
      if (clearBtn) clearBtn.style.display = "block";
      renderLiveSearchResults(initialQuery);
    } else if (!input.value) {
      renderLiveSearchResults("");
    }
    setTimeout(() => {
      input.focus();
      input.select();
    }, 60);
  }
}

function searchByQuickTag(tag) {
  openSearchModal(tag);
}

function normalizeSearchText(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function highlightSearchMatch(text, query) {
  if (!query || !query.trim()) return escapeSearchHtml(text);
  const safeQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${safeQuery})`, "gi");
  return escapeSearchHtml(text).replace(regex, '<mark class="highlight-match">$1</mark>');
}

function escapeSearchHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderLiveSearchResults(query) {
  const container = document.getElementById("liveSearchResultsContainer");
  if (!container) return;

  activeSearchIndex = -1;

  if (!query || !query.trim()) {
    container.innerHTML = `
      <div class="search-modal-prompt">
        <h4>Explorador en Vivo ÁBICA</h4>
        <p>Encuentra piezas contemporáneas escribiendo el nombre, madera, categoría o acabado.</p>
        <div class="popular-searches-list">
          <button type="button" class="popular-search-pill" onclick="searchByQuickTag('Sofá Modular')">Sofá Modular</button>
          <button type="button" class="popular-search-pill" onclick="searchByQuickTag('Roble')">Roble Macizo</button>
          <button type="button" class="popular-search-pill" onclick="searchByQuickTag('Comedor')">Comedor</button>
          <button type="button" class="popular-search-pill" onclick="searchByQuickTag('Lino')">Lino Natural</button>
          <button type="button" class="popular-search-pill" onclick="searchByQuickTag('Cama')">Dormitorios</button>
          <button type="button" class="popular-search-pill" onclick="searchByQuickTag('Aparador')">Aparadores</button>
        </div>
      </div>
    `;
    return;
  }

  const normQuery = normalizeSearchText(query.trim());
  const tokens = normQuery.split(/\s+/).filter(t => t.length > 0);

  const matchedProducts = products.filter(product => {
    const fullSearchString = normalizeSearchText(`
      ${product.name} 
      ${product.category} 
      ${product.material} 
      ${product.color} 
      ${product.description}
    `);
    return tokens.every(token => fullSearchString.includes(token));
  });

  if (matchedProducts.length === 0) {
    container.innerHTML = `
      <div class="search-modal-prompt">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-carbon-muted)" stroke-width="1.5" style="margin: 0 auto 0.6rem auto; display: block;">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
        <h4>Sin resultados para "${escapeSearchHtml(query)}"</h4>
        <p>No encontramos piezas que coincidan con este criterio. Prueba buscando por material (roble, lino, bouclé) o categoría general.</p>
        <div class="popular-searches-list">
          <button type="button" class="popular-search-pill" onclick="searchByQuickTag('Sofás y sillones')">Sofás</button>
          <button type="button" class="popular-search-pill" onclick="searchByQuickTag('Mesas de comedor')">Mesas</button>
          <button type="button" class="popular-search-pill" onclick="searchByQuickTag('Sillas')">Sillas</button>
          <button type="button" class="popular-search-pill" onclick="searchByQuickTag('Roble')">Roble</button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="search-results-meta" style="padding: 0.6rem 1rem; font-size: 0.8rem; color: var(--color-carbon-muted); border-bottom: 1px solid var(--color-arena-tint); display: flex; justify-content: space-between; align-items: center;">
      <span><strong>${matchedProducts.length}</strong> ${matchedProducts.length === 1 ? 'pieza encontrada' : 'piezas encontradas'}</span>
      <span>Navega con <kbd style="background: var(--color-arena-light); padding: 0.1rem 0.3rem; border-radius: 3px; font-size: 0.72rem;">↑</kbd> <kbd style="background: var(--color-arena-light); padding: 0.1rem 0.3rem; border-radius: 3px; font-size: 0.72rem;">↓</kbd> y <kbd style="background: var(--color-arena-light); padding: 0.1rem 0.3rem; border-radius: 3px; font-size: 0.72rem;">Enter</kbd></span>
    </div>
    <div class="live-search-items-list" role="listbox" style="display: flex; flex-direction: column; gap: 0.5rem; padding: 0.75rem 0.25rem;">
      ${matchedProducts.map((p, idx) => {
        const highlightedName = highlightSearchMatch(p.name, query);
        const highlightedCategory = highlightSearchMatch(p.category, query);
        const highlightedMaterial = highlightSearchMatch(p.material, query);

        return `
          <div class="live-search-item" 
               role="option" 
               tabindex="0"
               data-product-id="${p.id}"
               data-index="${idx}"
               onclick="selectSearchResult(${p.id})">
            <img src="${p.image}" alt="${p.name}" class="live-search-item__thumb" loading="lazy">
            <div class="live-search-item__info">
              <span class="live-search-item__category">${highlightedCategory}</span>
              <h4 class="live-search-item__title">${highlightedName}</h4>
              <span class="live-search-item__material">${highlightedMaterial} • Acabado: ${p.color}</span>
            </div>
            <div class="live-search-item__price-actions">
              <span class="live-search-item__price">${formatCurrency(p.price)}</span>
              <button type="button" 
                      class="btn btn--secondary btn--sm" 
                      style="padding: 0.4rem 0.75rem; font-size: 0.78rem;" 
                      onclick="event.stopPropagation(); closeModal('searchModal'); openProductModal(${p.id});" 
                      title="Ver detalles de la pieza">
                Ver
              </button>
              <button type="button" 
                      class="btn btn--primary btn--sm" 
                      style="padding: 0.4rem 0.75rem; font-size: 0.78rem;" 
                      onclick="event.stopPropagation(); addToCart(${p.id}, 1, '${p.color}'); showToast('Añadido a la bolsa: ${escapeSearchHtml(p.name)}', 'success');" 
                      title="Añadir al carrito">
                + Bolsa
              </button>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function selectSearchResult(productId) {
  closeModal("searchModal");
  openProductModal(productId);
}

function handleSearchKeyboardNav(e) {
  const items = document.querySelectorAll("#liveSearchResultsContainer .live-search-item");
  if (!items.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeSearchIndex = Math.min(items.length - 1, activeSearchIndex + 1);
    updateActiveSearchItem(items);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeSearchIndex = Math.max(0, activeSearchIndex - 1);
    updateActiveSearchItem(items);
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (activeSearchIndex >= 0 && items[activeSearchIndex]) {
      const pid = parseInt(items[activeSearchIndex].getAttribute("data-product-id"), 10);
      if (pid) selectSearchResult(pid);
    } else if (items[0]) {
      const pid = parseInt(items[0].getAttribute("data-product-id"), 10);
      if (pid) selectSearchResult(pid);
    }
  }
}

function updateActiveSearchItem(items) {
  items.forEach((item, idx) => {
    if (idx === activeSearchIndex) {
      item.classList.add("selected");
      item.classList.add("active");
      item.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else {
      item.classList.remove("selected");
      item.classList.remove("active");
    }
  });
}


