/**
 * ÁBICA Muebles Contemporáneos
 * Módulo de Seguridad Centralizado (Multi-Layer Security Engine)
 * 
 * Capas de Protección:
 * 1. Anti-Clickjacking / Frame-Busting
 * 2. Sanitización contra Cross-Site Scripting (XSS)
 * 3. Validación y Sanitización de URLs seguras
 * 4. Rate Limiter (Protección contra Brute Force y Spam)
 * 5. Protección de Integridad de Datos y Precios (Anti-Tampering)
 * 6. Validación Criptográfica y Validación de Tarjetas (Luhn Algorithm)
 */

(function (window, document) {
  "use strict";

  // 1. ANTI-CLICKJACKING (Frame-Busting Guard)
  // Previene que el sitio sea embebido en un iframe malicioso para robar clics o datos
  try {
    if (window.top !== window.self) {
      window.top.location = window.self.location;
    }
  } catch (e) {
    console.warn("[Security] Frame-busting activado.");
  }

  // 2. SANITIZACIÓN ESTRICTA CONTRA XSS (Cross-Site Scripting)
  const HTML_ESCAPE_MAP = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;"
  };

  /**
   * Sanitiza cualquier cadena de texto convirtiendo caracteres especiales HTML a entidades seguras
   * @param {string|any} str - Texto a escapar
   * @returns {string} - Texto sanitizado
   */
  function sanitizeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/[&<>"'`/=\\]/g, match => HTML_ESCAPE_MAP[match] || match);
  }

  /**
   * Sanitiza y valida que una URL pertenezca a un protocolo seguro (https, http, mailto, tel)
   * Previene inyecciones como javascript:alert(1) o data:text/html
   * @param {string} url - URL a validar
   * @param {string} fallback - URL de respaldo si la original es insegura
   * @returns {string}
   */
  function sanitizeURL(url, fallback = "#") {
    if (!url || typeof url !== "string") return fallback;
    const cleanUrl = url.trim();
    // Bloquear explícitamente protocolos peligrosos
    if (/^(javascript:|data:|vbscript:|file:)/i.test(cleanUrl)) {
      console.warn("[Security] Intento de inyección de protocolo inseguro bloqueado:", cleanUrl);
      return fallback;
    }
    // Permitir enlaces relativos seguros o protocolos seguros
    if (/^(https?:|\/|#|mailto:|tel:)/i.test(cleanUrl)) {
      return cleanUrl;
    }
    return fallback;
  }

  /**
   * Asigna texto a un elemento del DOM de forma 100% segura mediante textContent
   */
  function safeSetText(elementIdOrNode, text) {
    const el = typeof elementIdOrNode === "string" ? document.getElementById(elementIdOrNode) : elementIdOrNode;
    if (el) {
      el.textContent = text !== null && text !== undefined ? String(text) : "";
    }
  }

  // 3. VALIDACIÓN DE ENTRADAS Y PATRONES
  const VALIDATION_PATTERNS = {
    EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
    PHONE: /^[+]?[0-9\s().-]{7,20}$/,
    NAME: /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'.]{2,60}$/,
    ORDER_NUMBER: /^AB-[0-9]{4}-[0-9]{4}$/
  };

  function isValidEmail(email) {
    if (!email || typeof email !== "string") return false;
    return VALIDATION_PATTERNS.EMAIL.test(email.trim());
  }

  function isValidPhone(phone) {
    if (!phone || typeof phone !== "string") return false;
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  }

  function isValidName(name) {
    if (!name || typeof name !== "string") return false;
    return VALIDATION_PATTERNS.NAME.test(name.trim());
  }

  // Algoritmo de Luhn para verificación de tarjetas de crédito
  function isValidLuhnCard(number) {
    const cleanNum = String(number).replace(/\D/g, "");
    if (cleanNum.length < 13 || cleanNum.length > 19) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = cleanNum.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNum.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  function maskCardNumber(number) {
    const clean = String(number).replace(/\D/g, "");
    if (clean.length < 4) return "••••";
    const last4 = clean.slice(-4);
    return `•••• •••• •••• ${last4}`;
  }

  // 4. RATE LIMITING (Protección contra Brute Force, Flood y Spam)
  class RateLimiter {
    constructor() {
      this.attempts = new Map();
    }

    /**
     * Comprueba si una acción está permitida dentro de una ventana de tiempo
     * @param {string} actionKey - Identificador de la acción (ej. 'login', 'checkout', 'newsletter')
     * @param {number} maxAttempts - Intentos máximos permitidos
     * @param {number} windowMs - Ventana en milisegundos
     * @returns {Object} { allowed: boolean, remainingAttempts: number, waitTimeSeconds: number }
     */
    check(actionKey, maxAttempts = 5, windowMs = 60000) {
      const now = Date.now();
      let record = this.attempts.get(actionKey);

      if (!record || now - record.startTime > windowMs) {
        record = { count: 1, startTime: now, resetTime: now + windowMs };
        this.attempts.set(actionKey, record);
        return { allowed: true, remainingAttempts: maxAttempts - 1, waitTimeSeconds: 0 };
      }

      if (record.count >= maxAttempts) {
        const waitTimeSeconds = Math.ceil((record.resetTime - now) / 1000);
        return { allowed: false, remainingAttempts: 0, waitTimeSeconds: Math.max(1, waitTimeSeconds) };
      }

      record.count += 1;
      return { allowed: true, remainingAttempts: maxAttempts - record.count, waitTimeSeconds: 0 };
    }

    reset(actionKey) {
      this.attempts.delete(actionKey);
    }
  }

  const rateLimiter = new RateLimiter();

  // 5. HONEYPOT ANTI-BOT CHECKER
  // Si un bot autocompleta el campo trampa oculto, se descarta la solicitud silenciosamente
  function isHoneypotTriggered(formElement) {
    if (!formElement) return false;
    const hp = formElement.querySelector('input[name="website_hp"], input[name="company_hp"]');
    if (hp && hp.value && hp.value.trim().length > 0) {
      console.warn("[Security] Bot detectado mediante honeypot:", hp.name);
      return true;
    }
    return false;
  }

  // 6. PROTECCIÓN DE INTEGRIDAD DE PRECIOS Y PRODUCTOS (Anti-Tampering)
  /**
   * Revalida un artículo del carrito contrastándolo con la base de datos oficial
   * Si el usuario manipuló el precio en localStorage, este método lo restaura forzosamente
   * @param {Object} item - Artículo en carrito
   * @param {Array} catalog - Catálogo oficial
   * @returns {Object|null}
   */
  function sanitizeAndVerifyCartItem(item, catalog) {
    if (!item || typeof item !== "object" || !item.id) return null;
    const officialProduct = catalog.find(p => p.id === Number(item.id));
    if (!officialProduct) {
      console.warn("[Security] Producto inválido o inexistente descartado:", item.id);
      return null;
    }

    // Validar cantidad dentro de rango seguro de enteros [1, 99]
    let safeQty = parseInt(item.quantity, 10);
    if (isNaN(safeQty) || safeQty < 1) safeQty = 1;
    if (safeQty > 99) safeQty = 99;

    // Sanitizar acabado/color
    const safeColor = sanitizeHTML(item.color || officialProduct.color);

    // RESTAURAR SIEMPRE PRECIO Y METADATOS OFICIALES (Blindaje Anti-Tampering)
    return {
      id: officialProduct.id,
      name: officialProduct.name,
      price: officialProduct.price, // Precio oficial verificado, no del storage
      image: sanitizeURL(officialProduct.image),
      category: officialProduct.category,
      material: officialProduct.material,
      color: safeColor,
      quantity: safeQty
    };
  }

  /**
   * Sanitiza un objeto de usuario eliminando contraseñas y escapando campos de texto
   * @param {Object} user 
   * @returns {Object}
   */
  function sanitizeUserData(user) {
    if (!user || typeof user !== "object") return null;
    return {
      id: sanitizeHTML(user.id || "user-" + Date.now()),
      name: sanitizeHTML(user.name || "Usuario ÁBICA"),
      firstName: sanitizeHTML(user.firstName || ""),
      lastName: sanitizeHTML(user.lastName || ""),
      email: sanitizeHTML(user.email || ""),
      phone: sanitizeHTML(user.phone || ""),
      address: sanitizeHTML(user.address || ""),
      city: sanitizeHTML(user.city || "Bogotá D.C."),
      department: sanitizeHTML(user.department || "Bogotá D.C.")
      // NOTA DE SEGURIDAD: Nunca persistir contraseñas en texto plano ni tokens sensibles
    };
  }

  // 7. FUNCIÓN CRIPTOGRÁFICA RÁPIDA (SHA-256) PARA TOKENS DE SESIÓN SEGUROS
  async function hashStringSHA256(str) {
    if (!window.crypto || !window.crypto.subtle) {
      // Fallback básico si Web Crypto API no está disponible
      return "hash-" + Math.abs(str.split("").reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  // Exportar API de Seguridad Global
  window.Security = Object.freeze({
    sanitizeHTML: sanitizeHTML,
    sanitizeURL: sanitizeURL,
    safeSetText: safeSetText,
    isValidEmail: isValidEmail,
    isValidPhone: isValidPhone,
    isValidName: isValidName,
    isValidLuhnCard: isValidLuhnCard,
    maskCardNumber: maskCardNumber,
    rateLimiter: rateLimiter,
    isHoneypotTriggered: isHoneypotTriggered,
    sanitizeAndVerifyCartItem: sanitizeAndVerifyCartItem,
    sanitizeUserData: sanitizeUserData,
    hashStringSHA256: hashStringSHA256
  });

})(window, document);
