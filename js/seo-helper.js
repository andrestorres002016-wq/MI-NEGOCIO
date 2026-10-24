/**
 * ÁBICA Muebles Contemporáneos
 * Módulo de Gestión de Metadatos Open Graph (OG) y Redes Sociales
 * Optimizado para páginas actuales y futuras (productos dinámicos, colecciones, enlaces compartidos)
 */

(function (window, document) {
  "use strict";

  // Metadatos predeterminados del sitio oficial (Home / Tienda)
  const DEFAULT_OG = {
    title: "ÁBICA — Muebles Contemporáneos en Roble Macizo | Tienda Online Colombia",
    description: "Tienda virtual de muebles contemporáneos en roble macizo y lino europeo en Colombia. Sofás modulares, comedores nórdicos y diseño atemporal. Despacho nacional con 5 años de garantía.",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Sofá modular contemporáneo en lino y roble ÁBICA",
    url: "https://abica.com.co/",
    type: "website",
    siteName: "ÁBICA Muebles Contemporáneos",
    locale: "es_CO",
    price: "3290000",
    currency: "COP",
    availability: "in stock"
  };

  /**
   * Actualiza o crea una etiqueta meta en el <head>
   * @param {string} attributeName - 'property' (para OG) o 'name' (para Twitter/SEO)
   * @param {string} attributeValue - Nombre de la propiedad (ej. 'og:title')
   * @param {string} content - Valor de contenido
   */
  function setMetaTag(attributeName, attributeValue, content) {
    if (!content) return;
    let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(attributeName, attributeValue);
      document.head.appendChild(element);
    }
    element.setAttribute("content", content);
  }

  /**
   * Actualiza el <link rel="canonical">
   * @param {string} url - URL canónica
   */
  function setCanonicalUrl(url) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", url);
  }

  /**
   * Aplica metadatos Open Graph completos para cualquier página o vista
   * @param {Object} data - Objeto de configuración con metadatos
   */
  function applyOpenGraph(data) {
    const config = Object.assign({}, DEFAULT_OG, data);

    // Título de la pestaña
    if (config.title) {
      document.title = config.title;
    }

    // Canonical
    if (config.url) {
      setCanonicalUrl(config.url);
    }

    // Meta Description
    setMetaTag("name", "description", config.description);

    // Open Graph Primarios
    setMetaTag("property", "og:type", config.type || "website");
    setMetaTag("property", "og:title", config.title);
    setMetaTag("property", "og:description", config.description);
    setMetaTag("property", "og:url", config.url);
    setMetaTag("property", "og:image", config.image);
    setMetaTag("property", "og:image:secure_url", config.image);
    setMetaTag("property", "og:image:type", "image/jpeg");
    setMetaTag("property", "og:image:width", "1200");
    setMetaTag("property", "og:image:height", "630");
    setMetaTag("property", "og:image:alt", config.imageAlt || config.title);
    setMetaTag("property", "og:site_name", config.siteName || DEFAULT_OG.siteName);
    setMetaTag("property", "og:locale", config.locale || DEFAULT_OG.locale);
    setMetaTag("property", "og:updated_time", new Date().toISOString());

    // Open Graph E-Commerce (para productos)
    if (config.type === "product" || config.price) {
      setMetaTag("property", "product:price:amount", String(config.price || ""));
      setMetaTag("property", "product:price:currency", config.currency || "COP");
      setMetaTag("property", "product:availability", config.availability || "in stock");
      setMetaTag("property", "product:condition", "new");
      setMetaTag("property", "product:brand", "ÁBICA");
      if (config.category) setMetaTag("property", "product:category", config.category);
      if (config.material) setMetaTag("property", "product:material", config.material);
    }

    // Twitter Card
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", config.title);
    setMetaTag("name", "twitter:description", config.description);
    setMetaTag("name", "twitter:image", config.image);
    setMetaTag("name", "twitter:image:alt", config.imageAlt || config.title);
    if (config.url) setMetaTag("name", "twitter:url", config.url);
  }

  /**
   * Establece las etiquetas Open Graph para un producto específico (actual o futuro)
   * @param {Object} product - Objeto producto de la tienda
   */
  function setProductOpenGraph(product) {
    if (!product) return;
    const productUrl = `${window.location.origin}${window.location.pathname}#product-${product.id}`;

    applyOpenGraph({
      title: `${product.name} — Mobiliario Contemporáneo | ÁBICA`,
      description: `${product.description} Dimensiones: ${product.dimensions}. Material: ${product.material}. Despacho asegurado a toda Colombia con 5 años de garantía.`,
      image: product.image,
      imageAlt: `${product.name} en roble macizo y diseño contemporáneo ÁBICA`,
      url: productUrl,
      type: "product",
      price: product.price,
      currency: "COP",
      availability: product.inStock ? "in stock" : "out of stock",
      category: product.category,
      material: product.material
    });

    // Actualiza el hash de la URL de forma limpia sin salto de pantalla
    try {
      history.replaceState({ productId: product.id }, product.name, `#product-${product.id}`);
    } catch (e) {
      window.location.hash = `product-${product.id}`;
    }
  }

  /**
   * Restaura los metadatos Open Graph por defecto al cerrar modales o volver al inicio
   */
  function resetOpenGraph() {
    applyOpenGraph(DEFAULT_OG);
    try {
      if (window.location.hash.startsWith("#product-")) {
        history.replaceState(null, document.title, window.location.pathname + window.location.search);
      }
    } catch (e) {
      // Ignorar fallback
    }
  }

  /**
   * Función para compartir un producto en redes sociales (WhatsApp, Facebook, Twitter o Portapapeles)
   * aprovechando los metadatos Open Graph enriquecidos
   * @param {number|string} productId - ID del producto
   */
  async function shareProduct(productId) {
    const product = (typeof products !== "undefined") ? products.find(p => p.id === Number(productId)) : null;
    if (!product) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}#product-${product.id}`;
    const shareText = `Descubre "${product.name}" en ÁBICA (${formatProductPrice(product.price)} COP). Mobiliario de autor en roble macizo con garantía de 5 años:`;

    // 1. Si el navegador soporta Web Share API nativa (Móviles / Tablets)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} | ÁBICA Muebles`,
          text: shareText,
          url: shareUrl
        });
        if (typeof showToast === "function") {
          showToast("Enlace de producto compartido con éxito", "success");
        }
        return;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Share API falló, usando portapapeles:", err);
        } else {
          return; // Usuario canceló el modal nativo
        }
      }
    }

    // 2. Fallback: Copiar al portapapeles
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const tempInput = document.createElement("input");
        tempInput.value = shareUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
      }

      if (typeof showToast === "function") {
        showToast("Enlace directo con vista previa Open Graph copiado al portapapeles", "success");
      } else {
        alert("Enlace copiado al portapapeles: " + shareUrl);
      }
    } catch (err) {
      console.error("Error al copiar enlace:", err);
      prompt("Copia este enlace para compartir el producto con vista previa Open Graph:", shareUrl);
    }
  }

  /**
   * Helper para formatear precio si no está disponible formatCurrency
   */
  function formatProductPrice(amount) {
    if (typeof formatCurrency === "function") return formatCurrency(amount);
    return "$" + Number(amount).toLocaleString("es-CO");
  }

  /**
   * Auto-detección de enlace profundo en la URL (Deep Linking para compartir productos)
   * Si alguien abre https://abica.com.co/#product-3, abre automáticamente el modal con sus OG tags
   */
  function checkUrlForDeepLink() {
    const hash = window.location.hash;
    const match = hash.match(/^#product-(\d+)$/);
    if (match) {
      const productId = parseInt(match[1], 10);
      setTimeout(() => {
        if (typeof openProductModal === "function") {
          openProductModal(productId);
        }
      }, 400);
      return;
    }

    // También soporte para parámetro ?product=3
    const urlParams = new URLSearchParams(window.location.search);
    const paramId = urlParams.get("product");
    if (paramId) {
      const productId = parseInt(paramId, 10);
      setTimeout(() => {
        if (typeof openProductModal === "function") {
          openProductModal(productId);
        }
      }, 400);
    }
  }

  // Inicializar al cargar el DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkUrlForDeepLink);
  } else {
    checkUrlForDeepLink();
  }

  // Exponer API global para el sitio actual y páginas/módulos futuros
  window.AbicaSEO = {
    DEFAULT_OG: DEFAULT_OG,
    applyOpenGraph: applyOpenGraph,
    setProductOpenGraph: setProductOpenGraph,
    resetOpenGraph: resetOpenGraph,
    shareProduct: shareProduct,
    setMetaTag: setMetaTag
  };

  // Exponer shareProduct directamente a nivel global para llamadas onclick
  window.shareProduct = shareProduct;

})(window, document);
