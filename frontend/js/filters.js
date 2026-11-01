/**
 * ÁBICA Muebles Contemporáneos
 * Sistema de Filtros, Búsqueda y Ordenamiento
 */

// Estado global de los filtros
const filterState = {
  searchQuery: "",
  category: "Todos",
  material: "Todos",
  color: "Todos",
  minPrice: 0,
  maxPrice: 5000000,
  sortBy: "default"
};

// Referencias a elementos del DOM
let searchInputEl;
let searchClearBtnEl;
let categoryPillsContainerEl;
let materialSelectEl;
let colorSelectContainerEl;
let priceSliderEl;
let priceDisplayEl;
let sortSelectEl;
let activeFiltersContainerEl;
let productsGridEl;
let productCountBadgeEl;

function initFilters() {
  searchInputEl = document.getElementById("catalogSearchInput");
  searchClearBtnEl = document.getElementById("searchClearBtn");
  categoryPillsContainerEl = document.getElementById("categoryPillsContainer");
  materialSelectEl = document.getElementById("filterMaterialSelect");
  colorSelectContainerEl = document.getElementById("filterColorContainer");
  priceSliderEl = document.getElementById("filterPriceRange");
  priceDisplayEl = document.getElementById("filterPriceDisplay");
  sortSelectEl = document.getElementById("catalogSortSelect");
  activeFiltersContainerEl = document.getElementById("activeFilterChips");
  productsGridEl = document.getElementById("productsGrid");
  productCountBadgeEl = document.getElementById("productCountBadge");

  // Renderizar pills de categoría
  renderCategoryPills();

  // Renderizar swatches de color en panel de filtros
  renderColorSwatches();

  // Renderizar select de materiales
  renderMaterialOptions();

  // Escuchadores de eventos
  if (searchInputEl) {
    searchInputEl.addEventListener("input", (e) => {
      filterState.searchQuery = e.target.value.trim().toLowerCase();
      if (searchClearBtnEl) {
        searchClearBtnEl.style.display = filterState.searchQuery ? "flex" : "none";
      }
      applyFilters();
    });
  }

  if (searchClearBtnEl) {
    searchClearBtnEl.addEventListener("click", () => {
      if (searchInputEl) {
        searchInputEl.value = "";
        filterState.searchQuery = "";
        searchClearBtnEl.style.display = "none";
        searchInputEl.focus();
        applyFilters();
      }
    });
  }

  if (materialSelectEl) {
    materialSelectEl.addEventListener("change", (e) => {
      filterState.material = e.target.value;
      applyFilters();
    });
  }

  if (priceSliderEl) {
    priceSliderEl.addEventListener("input", (e) => {
      filterState.maxPrice = Number(e.target.value);
      if (priceDisplayEl) {
        priceDisplayEl.textContent = formatCurrency(filterState.maxPrice);
      }
      applyFilters();
    });
  }

  if (sortSelectEl) {
    sortSelectEl.addEventListener("change", (e) => {
      filterState.sortBy = e.target.value;
      applyFilters();
    });
  }

  // Ejecución inicial
  applyFilters();
}

function renderCategoryPills() {
  if (!categoryPillsContainerEl) return;
  categoryPillsContainerEl.innerHTML = categories.map(cat => `
    <button class="pill-btn ${cat === filterState.category ? 'active' : ''}" 
            onclick="setCategoryFilter('${cat}')" 
            role="button" 
            aria-pressed="${cat === filterState.category}">
      ${cat}
    </button>
  `).join("");
}

function setCategoryFilter(category) {
  filterState.category = category;
  renderCategoryPills();
  applyFilters();
}

function renderMaterialOptions() {
  if (!materialSelectEl) return;
  materialSelectEl.innerHTML = materials.map(mat => `
    <option value="${mat}" ${mat === filterState.material ? 'selected' : ''}>${mat}</option>
  `).join("");
}

function renderColorSwatches() {
  if (!colorSelectContainerEl) return;
  colorSelectContainerEl.innerHTML = colors.map(col => `
    <button class="color-swatch-btn ${col.name === filterState.color ? 'active' : ''}" 
            onclick="setColorFilter('${col.name}')"
            title="${col.name}" 
            aria-label="Color ${col.name}">
      ${col.hex ? `<span class="swatch-circle" style="background-color: ${col.hex};"></span>` : '<span class="swatch-circle swatch-circle--all"></span>'}
      <span class="swatch-name">${col.name}</span>
    </button>
  `).join("");
}

function setColorFilter(colorName) {
  filterState.color = colorName;
  renderColorSwatches();
  applyFilters();
}

function resetAllFilters() {
  filterState.searchQuery = "";
  filterState.category = "Todos";
  filterState.material = "Todos";
  filterState.color = "Todos";
  filterState.maxPrice = 5000000;
  filterState.sortBy = "default";

  if (searchInputEl) searchInputEl.value = "";
  if (searchClearBtnEl) searchClearBtnEl.style.display = "none";
  if (materialSelectEl) materialSelectEl.value = "Todos";
  if (priceSliderEl) {
    priceSliderEl.value = 5000000;
    if (priceDisplayEl) priceDisplayEl.textContent = formatCurrency(5000000);
  }
  if (sortSelectEl) sortSelectEl.value = "default";

  renderCategoryPills();
  renderColorSwatches();
  applyFilters();
  showToast("Filtros restablecidos", "info");
}

function removeSingleFilter(key) {
  if (key === "search") {
    filterState.searchQuery = "";
    if (searchInputEl) searchInputEl.value = "";
    if (searchClearBtnEl) searchClearBtnEl.style.display = "none";
  } else if (key === "category") {
    filterState.category = "Todos";
    renderCategoryPills();
  } else if (key === "material") {
    filterState.material = "Todos";
    if (materialSelectEl) materialSelectEl.value = "Todos";
  } else if (key === "color") {
    filterState.color = "Todos";
    renderColorSwatches();
  } else if (key === "price") {
    filterState.maxPrice = 5000000;
    if (priceSliderEl) priceSliderEl.value = 5000000;
    if (priceDisplayEl) priceDisplayEl.textContent = formatCurrency(5000000);
  }
  applyFilters();
}

function renderActiveFilterChips() {
  if (!activeFiltersContainerEl) return;

  const chips = [];

  if (filterState.searchQuery) {
    chips.push(`
      <span class="filter-chip">
        Búsqueda: "${filterState.searchQuery}"
        <button onclick="removeSingleFilter('search')" aria-label="Quitar búsqueda">&times;</button>
      </span>
    `);
  }

  if (filterState.category !== "Todos") {
    chips.push(`
      <span class="filter-chip">
        Categoría: ${filterState.category}
        <button onclick="removeSingleFilter('category')" aria-label="Quitar filtro de categoría">&times;</button>
      </span>
    `);
  }

  if (filterState.material !== "Todos") {
    chips.push(`
      <span class="filter-chip">
        Material: ${filterState.material}
        <button onclick="removeSingleFilter('material')" aria-label="Quitar filtro de material">&times;</button>
      </span>
    `);
  }

  if (filterState.color !== "Todos") {
    chips.push(`
      <span class="filter-chip">
        Color: ${filterState.color}
        <button onclick="removeSingleFilter('color')" aria-label="Quitar filtro de color">&times;</button>
      </span>
    `);
  }

  if (filterState.maxPrice < 5000000) {
    chips.push(`
      <span class="filter-chip">
        Hasta ${formatCurrency(filterState.maxPrice)}
        <button onclick="removeSingleFilter('price')" aria-label="Quitar filtro de precio">&times;</button>
      </span>
    `);
  }

  if (chips.length > 0) {
    chips.push(`
      <button class="clear-all-chips-btn" onclick="resetAllFilters()">
        Limpiar todos los filtros
      </button>
    `);
    activeFiltersContainerEl.innerHTML = chips.join("");
    activeFiltersContainerEl.style.display = "flex";
  } else {
    activeFiltersContainerEl.innerHTML = "";
    activeFiltersContainerEl.style.display = "none";
  }
}

function applyFilters() {
  let filtered = [...products];

  // 1. Filtrado por Búsqueda de texto (Nombre, descripción, categoría, material)
  if (filterState.searchQuery) {
    const q = filterState.searchQuery;
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.material.toLowerCase().includes(q) ||
      p.color.toLowerCase().includes(q)
    );
  }

  // 2. Filtrado por Categoría
  if (filterState.category !== "Todos") {
    filtered = filtered.filter(p => p.category === filterState.category);
  }

  // 3. Filtrado por Material
  if (filterState.material !== "Todos") {
    filtered = filtered.filter(p => p.material.toLowerCase().includes(filterState.material.toLowerCase()));
  }

  // 4. Filtrado por Color
  if (filterState.color !== "Todos") {
    filtered = filtered.filter(p => p.color.toLowerCase() === filterState.color.toLowerCase());
  }

  // 5. Filtrado por Rango de Precio
  filtered = filtered.filter(p => p.price <= filterState.maxPrice);

  // 6. Ordenamiento
  switch (filterState.sortBy) {
    case "price-asc":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "name-asc":
      filtered.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
      break;
    case "name-desc":
      filtered.sort((a, b) => b.name.localeCompare(a.name, "es", { sensitivity: "base" }));
      break;
    case "rating-desc":
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    default:
      // Orden predeterminado (por ID / destacados)
      filtered.sort((a, b) => a.id - b.id);
      break;
  }

  // Actualizar contador y renderizado
  if (productCountBadgeEl) {
    productCountBadgeEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'producto' : 'productos'}`;
  }

  renderActiveFilterChips();
  renderProducts(filtered);
}

function renderProducts(productList) {
  if (!productsGridEl) return;

  if (productList.length === 0) {
    productsGridEl.innerHTML = `
      <div class="no-results-card">
        <div class="no-results__icon">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </div>
        <h3 class="no-results__title">No encontramos muebles que coincidan</h3>
        <p class="no-results__text">Prueba ajustando los términos de búsqueda o eliminando algunos filtros activos para descubrir más piezas.</p>
        <button class="btn btn--primary" onclick="resetAllFilters()">
          Restablecer Filtros
        </button>
      </div>
    `;
    return;
  }

  productsGridEl.innerHTML = productList.map(product => {
    const isFav = isFavorited(product.id);
    const hasDiscount = product.originalPrice && product.originalPrice > product.price;

    return `
      <article class="product-card" data-product-id="${product.id}">
        <div class="product-card__image-wrapper">
          ${product.badge ? `<span class="product-badge product-badge--${product.badge === 'Más Vendido' ? 'accent' : 'neutral'}">${product.badge}</span>` : ''}
          <button class="favorite-toggle-btn ${isFav ? 'active' : ''}" 
                  data-favorite-id="${product.id}"
                  onclick="toggleFavorite(${product.id})"
                  aria-label="${isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFav ? '#A87950' : 'none'}" stroke="${isFav ? '#A87950' : 'currentColor'}" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          
          <img src="${product.image}" 
               alt="${product.name} — ${product.material}" 
               class="product-card__img" 
               loading="lazy"
               onclick="openProductModal(${product.id})">
          
          <button class="quick-view-overlay-btn" onclick="openProductModal(${product.id})">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Vista Rápida
          </button>
        </div>

        <div class="product-card__content">
          <div class="product-card__meta">
            <span class="product-card__category">${product.category}</span>
            <div class="product-card__rating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#A87950" stroke="#A87950">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>${product.rating.toFixed(1)}</span>
            </div>
          </div>

          <h3 class="product-card__title">
            <a href="javascript:void(0)" onclick="openProductModal(${product.id})">${product.name}</a>
          </h3>

          <p class="product-card__material">${product.material}</p>

          <div class="product-card__footer">
            <div class="product-card__pricing">
              <span class="product-card__price">${formatCurrency(product.price)}</span>
              ${hasDiscount ? `<span class="product-card__original-price">${formatCurrency(product.originalPrice)}</span>` : ''}
            </div>
            
            <button class="btn btn--icon-add" 
                    onclick="addToCart(${product.id}, 1)" 
                    aria-label="Agregar ${product.name} al carrito"
                    title="Agregar al carrito">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Agregar</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}
