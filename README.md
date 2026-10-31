# ÁBICA — Muebles & Espacios Contemporáneos
### Plataforma E-Commerce Full-Stack (Frontend UI/UX + Backend Node.js/Express + PostgreSQL Dockerizado)

Plataforma de comercio electrónico de diseño contemporáneo para mobiliario de alta gama, integrada con **HTML5**, **CSS3**, **JavaScript**, **Node.js con Express** y base de datos relacional **PostgreSQL** dockerizada en Docker Desktop, con **Consola Administrativa (`/consola`)** para gestión integral del negocio.

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

## 2. Arquitectura del Proyecto

```
MI NEGOCIO/
├── docker-compose.yml        # Configuración del contenedor PostgreSQL 16 Alpine en Docker Desktop
├── index.html                # Tienda pública (Catálogo, carrito, checkout, modales)
├── consola.html              # Consola Administrativa con menú lateral izquierdo (/consola)
├── backend/                  # SERVIDOR BACKEND (Node.js & Express)
│   ├── .env                  # Variables de entorno (puerto, conexión DB, JWT secret)
│   ├── .env.example          # Plantilla de variables de entorno
│   ├── package.json          # Dependencias (express, pg, bcryptjs, jsonwebtoken, cors, etc.)
│   ├── server.js             # Punto de entrada del servidor
│   ├── test-backend.js       # Suite de pruebas automatizadas de integración
│   └── src/
│       ├── app.js            # Configuración de Express, CORS, rutas y servicio estático
│       ├── config/
│       │   ├── db.js         # Pool de conexiones a PostgreSQL con reintentos
│       │   └── initDb.js     # Creación automática de tablas (DDL) y seed de datos
│       ├── controllers/
│       │   ├── authController.js       # Login, registro y listado de usuarios
│       │   ├── productController.js    # CRUD de muebles, stock e imágenes
│       │   ├── orderController.js      # Procesamiento de checkout y estados de pedidos
│       │   ├── statsController.js      # Métricas y KPIs para el dashboard admin
│       │   └── subscriberController.js # Gestión de newsletter
│       ├── middleware/
│       │   ├── auth.js                 # Verificación JWT y control de rol ADMIN
│       │   └── errorHandler.js         # Manejador centralizado de errores
│       ├── routes/                     # Enrutadores REST (/api/...)
│       └── seed/
│           └── seedData.js             # 18 productos iniciales y usuarios demo
├── css/
│   ├── styles.css            # Estilos de la tienda pública
│   └── consola.css           # Estilos de la Consola Administrativa (layout y componentes)
├── js/
│   ├── app.js                # Lógica de la tienda pública conectada a APIs
│   ├── consola.js            # Lógica interactiva de la Consola Admin y llamadas fetch
│   ├── products.js           # Catálogo sincronizado con backend PostgreSQL
│   ├── cart.js               # Carrito de compras y favoritos
│   ├── filters.js            # Filtros multicriterio y búsqueda
│   ├── security.js           # Sanitización, honeypots y rate limiting
│   └── seo-helper.js         # Metadatos dinámicos Open Graph
└── assets/                   # Iconos vectoriales e imágenes
```

---

## 3. Consola Administrativa (`/consola`)

La sección administrativa está accesible directamente desde la URL con barra inclinada:
👉 **`http://localhost:3000/consola`**

### Características de la Consola:
- **Menú en la Parte Izquierda (Sidebar)**:
  - 📊 **Dashboard**: KPIs financieros (Ventas Totales COP), Pedidos Totales, Catálogo Activo y Pedidos Pendientes, tabla de pedidos recientes y distribución de categorías.
  - 🛋️ **Catálogo de Muebles**: CRUD completo (Crear, Editar, Pausar/Activar stock en tiempo real, Eliminar con confirmación), buscador instantáneo y filtro por categoría.
  - 📦 **Gestión de Pedidos**: Listado de compras de clientes, detalle de entrega, desglose de artículos y selector para cambiar estado (`PENDIENTE`, `CONFIRMADO`, `ENVIADO`, `ENTREGADO`, `CANCELADO`).
  - 👥 **Clientes y Usuarios**: Directorio con roles (`ADMIN` / `CUSTOMER`).
  - ✉️ **Suscriptores**: Lista de correos inscritos al boletín de temporada.
  - ⚙️ **Configuración & BD**: Información de conexión al contenedor Docker PostgreSQL.
  - 🌐 **Ver Tienda Pública**: Acceso directo a la vitrina comercial.
  - 🚪 **Cerrar Sesión**: Salida segura invalidando el token JWT.

### Credenciales de Administrador por Defecto:
- **Correo:** `admin@abica.com`
- **Contraseña:** `admin1234`
*(Incluye botón rápido "Rellenar" en la pantalla de inicio de sesión de la consola).*

---

## 4. Puesta en Marcha (Paso a Paso)

### Paso 1: Iniciar el Contenedor PostgreSQL con Docker Desktop
Asegúrate de tener Docker Desktop abierto y ejecuta en la raíz del proyecto:
```bash
docker compose up -d
```
Esto descargará la imagen `postgres:16-alpine` y levantará el contenedor `abica_postgres` en el puerto `5432` con datos persistentes en el volumen `abica_postgres_data`.

### Paso 2: Iniciar el Servidor Backend (Node.js & Express)
Accede a la carpeta `backend` e inicia el servidor:
```bash
cd backend
npm install   # (solo la primera vez)
npm start
```
El servidor automáticamente:
1. Conecta con PostgreSQL en Docker.
2. Crea las tablas (`users`, `products`, `orders`, `order_items`, `subscribers`) e índices si no existen.
3. Inserta el usuario administrador por defecto con contraseña cifrada (`bcrypt`).
4. Si la tabla de productos está vacía, puebla automáticamente los 18 muebles del catálogo.
5. Inicia en el puerto `3000`.

### Paso 3: Abrir la Aplicación en tu Navegador
- **Tienda Pública:** `http://localhost:3000/`
- **Consola Administrativa:** `http://localhost:3000/consola`
- **Health Check API:** `http://localhost:3000/api/health`

---

## 5. Pruebas Automatizadas

Para validar la correcta integración entre el backend, la base de datos PostgreSQL dockerizada y la consola:
```bash
cd backend
node test-backend.js
```
*Resultado: 10 pruebas automatizadas de integración aprobadas (100% éxito).*
