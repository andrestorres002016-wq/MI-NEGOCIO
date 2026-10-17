# ÁBICA — Muebles & Espacios Contemporáneos
### Tienda Virtual Front-End UI/UX (Versión 1.0)

Proyecto demostrativo de comercio electrónico desarrollado con **HTML5 semántico**, **CSS3 moderno** y **JavaScript Vanilla**, sin dependencias de frameworks ni librerías externas.

---

## 1. Identidad Visual & Inspiración
Inspirado en el diseño editorial y contemporáneo de **West Elm**, **Article** e **IKEA Colombia**, combinando líneas limpias escandinavas con calidez natural.

### Paleta Cromática
- **Marfil (`#F7F5F0`)**: Fondo principal y áreas de descanso visual.
- **Arena (`#D8C8B5`)**: Fondos secundarios, tarjetas y bordes suaves.
- **Roble (`#A87950`)**: Acentos cálidos, precios y elementos destacados.
- **Oliva (`#69745A`)**: Sellos de confianza, badges y elementos complementarios.
- **Carbón (`#252722`)**: Tipografía principal, botones oscuros y alto contraste.

### Tipografía
- **Titulares & Jerarquía**: *Outfit* (Google Fonts)
- **Cuerpo & Controles**: *Plus Jakarta Sans* (Google Fonts)

---

## 2. Arquitectura de Archivos
```
MI NEGOCIO/
├── index.html              # Estructura semántica, accesibilidad y contenedores
├── css/
│   └── styles.css          # Variables CSS, Grid, Flexbox, drawers, modales y responsive
├── js/
│   ├── products.js         # Catálogo de 18 productos con datos en pesos colombianos (COP)
│   ├── cart.js             # Lógica de carrito, cálculo de subtotales, favoritos y localStorage
│   ├── filters.js          # Búsqueda en vivo, filtrado multicriterio y ordenamiento
│   └── app.js              # Inicialización, modales, checkout simulado y notificaciones toast
└── assets/
    ├── icons/
    │   └── favicon.svg     # Logotipo vectorial e icono del sitio
    └── images/             # Fotografías y recursos visuales
```

---

## 3. Funcionalidades Implementadas

### A. Catálogo Interactivo
- **18 productos** con fotos en alta definición, dimensiones, materiales, colores, calificaciones y precios en COP.
- **Badges dinámicos**: "Más Vendido", "Nuevo", "15% OFF", "Edición Limitada".

### B. Búsqueda, Filtrado & Ordenamiento
- **Búsqueda instantánea**: Por nombre, categoría, materiales o descripción con botón para limpiar campo.
- **Filtrado por categoría**: Botones tipo píldora (Pills) con navegación horizontal deslizante.
- **Filtro por material**: Madera maciza de roble, bouclé, nogal, piedra travertino, lino, etc.
- **Filtro de precio**: Control deslizante interactivo (Slider) con visualización del valor en COP.
- **Filtro por color**: Botones circulares con muestras de color (swatches).
- **Chips de filtros activos**: Etiquetas removibles individualmente y botón de "Limpiar todos los filtros".
- **Ordenamiento**: Precio (menor a mayor, mayor a menor), alfabético (A-Z, Z-A) y mejor calificados.

### C. Detalle de Producto & Vista Rápida
- Modal con galería de miniaturas interactiva.
- Selector de acabados y selector de cantidades (+/-).
- Ficha técnica completa: dimensiones, materiales y bullets de garantía.
- Acceso directo a añadir al carrito o alternar favoritos.

### D. Carrito de Compras (Slide-over Drawer)
- Panel lateral deslizable con animación suave.
- Control de cantidades individual y eliminación de artículos.
- **Barra de progreso de Envío Gratis**: Meta dinámica para compras superiores a $2.500.000 COP.
- Persistencia total en el navegador mediante `localStorage`.

### E. Lista de Favoritos (Wishlist)
- Indicador de estado de favorito con corazón animado.
- Panel lateral de favoritos con acción para transferir artículos directamente al carrito de compras.

### F. Checkout Demostrativo & Confirmación
- Validación de campos obligatorios en el cliente (Nombre, Apellidos, Correo, Teléfono, Dirección, Ciudad y Departamento).
- Selección de modalidades de entrega y métodos de pago simulados (PSE / Transferencia, Tarjeta demo, Contra Entrega).
- **Modal de confirmación de compra**:
  - Código único de orden (ej. `#AB-2026-XXXX`).
  - Resumen detallado de productos adquiridos y valor total liquidado en COP.
  - Estimación de fecha de entrega.
  - Botón para imprimir o guardar comprobante en PDF.

---

## 4. Cómo Visualizar la Tienda

Al no requerir compilación ni backend:
1. Haz doble clic en `index.html` para abrirlo en tu navegador favorito (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
2. O bien abre la carpeta en cualquier servidor estático local si lo prefieres:
   - Extensión **Live Server** en VS Code.
   - O comando `npx serve .` / `python -m http.server` cuando dispongas de Node o Python.
