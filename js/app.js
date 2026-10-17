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
  initCartAndWishlist();
  initFilters();
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
    }
  });

  // Suscripción al Newsletter
  const newsletterForm = document.getElementById("newsletterForm");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("newsletterEmail");
      if (emailInput && emailInput.value) {
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

  // Capturar datos del pedido
  const customerName = `${document.getElementById("customerFirstName").value.trim()} ${document.getElementById("customerLastName").value.trim()}`;
  const customerEmail = document.getElementById("customerEmail").value.trim();
  const customerAddress = document.getElementById("customerAddress").value.trim();
  const customerCity = document.getElementById("customerCity").value.trim();
  const customerDepartment = document.getElementById("customerDepartment").value;
  const paymentMethodEl = document.querySelector('input[name="paymentMethod"]:checked');
  const paymentMethod = paymentMethodEl ? paymentMethodEl.value : "Transferencia / PSE";

  const orderCalculation = getCartCalculations();
  const orderNumber = `AB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Simular breve tiempo de confirmación (loading state)
  const submitBtn = document.getElementById("submitCheckoutBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="spinner-circle"></span>
      <span>Procesando Pedido Demostrativo...</span>
    `;
  }

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
      orderNumber,
      customerName,
      customerEmail,
      customerAddress: `${customerAddress}, ${customerCity}, ${customerDepartment}`,
      paymentMethod,
      items: [...cart],
      total: orderCalculation.total
    });

    // Limpiar carrito tras la compra exitosa simulada
    clearCart();
    form.reset();
  }, 900);
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

  detailsContainer.innerHTML = `
    <div class="order-confirmation-badge">
      <div class="success-icon-wrap">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#69745A" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h2 class="order-title">¡Compra Demostrativa Exitosa!</h2>
      <p class="order-subtitle">Gracias por recorrer la experiencia de compra de <strong>ÁBICA</strong>.</p>
      <div class="order-ref-pill">Número de Orden: <strong>#${orderData.orderNumber}</strong></div>
    </div>

    <div class="order-details-grid">
      <div class="order-info-card">
        <h4>Destinatario & Envío</h4>
        <p><strong>${orderData.customerName}</strong></p>
        <p>${orderData.customerAddress}</p>
        <p>${orderData.customerEmail}</p>
        <p class="delivery-estimate-text">Entrega estimada: <strong>${formattedDate}</strong></p>
      </div>
      <div class="order-info-card">
        <h4>Método & Liquidación</h4>
        <p>Modalidad: <strong>${orderData.paymentMethod} (Simulado)</strong></p>
        <p>Estado de pago: <span class="badge-status-paid">Aprobado / Simulación</span></p>
        <p class="total-paid-highlight">Total Liquidado: <strong>${formatCurrency(orderData.total)}</strong></p>
      </div>
    </div>

    <div class="order-items-list-box">
      <h4>Piezas de Mobiliario Ordenadas</h4>
      <div class="order-items-scroll">
        ${orderData.items.map(item => `
          <div class="order-item-row">
            <img src="${item.image}" alt="${item.name}">
            <div class="order-item-desc">
              <h5>${item.name}</h5>
              <span>Acabado: ${item.color} | Cantidad: ${item.quantity}</span>
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
