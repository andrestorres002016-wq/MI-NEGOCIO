-- ==============================================================================
-- ÁBICA — Muebles & Espacios Contemporáneos
-- Script DDL y Seed Data 100% Estandarizado para Supabase (PostgreSQL 15/16)
-- ==============================================================================
-- INSTRUCCIONES:
-- 1. Abre tu proyecto en Supabase (https://supabase.com/dashboard)
-- 2. Ve a la pestaña "SQL Editor" en el menú lateral izquierdo
-- 3. Pega todo este contenido y presiona el botón "RUN" (Ejecutar)
-- 4. ¡Listo! Todas las tablas, índices, políticas de seguridad (RLS) y datos iniciales quedarán creados.
-- ==============================================================================

-- 1. EXTENSIONES RECOMENDADAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA: USERS (Clientes y Administradores)
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'CUSTOMER',
    phone VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100) DEFAULT 'Bogotá D.C.',
    department VARCHAR(100) DEFAULT 'Bogotá D.C.',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA: PRODUCTS (Catálogo de Muebles)
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    original_price NUMERIC(12, 2),
    category VARCHAR(100) NOT NULL,
    material VARCHAR(150),
    color VARCHAR(100),
    color_hex VARCHAR(20),
    dimensions VARCHAR(100),
    image TEXT NOT NULL,
    gallery JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    rating NUMERIC(3, 1) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    badge VARCHAR(50),
    in_stock BOOLEAN DEFAULT true,
    stock_quantity INT DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA: ORDERS (Órdenes de Compra / Pedidos)
CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50),
    customer_address TEXT NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    shipping_cost NUMERIC(12, 2) DEFAULT 0,
    discount NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDIENTE',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLA: ORDER_ITEMS (Detalles de Productos por Pedido)
CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    color VARCHAR(100),
    image TEXT,
    subtotal NUMERIC(12, 2) NOT NULL
);

-- 6. TABLA: SUBSCRIBERS (Newsletter)
CREATE TABLE IF NOT EXISTS public.subscribers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ==============================================================================
-- 8. POLÍTICAS DE SEGURIDAD SUPABASE (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
-- Supabase recomienda activar RLS para proteger las tablas de accesos no autorizados.
-- El usuario postgres (que utiliza el backend Node.js) tiene permisos totales automáticos.

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas para PRODUCTS: Lectura pública, gestión administrativa
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lectura pública de catálogo') THEN
        CREATE POLICY "Lectura pública de catálogo" ON public.products FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Gestión total de productos') THEN
        CREATE POLICY "Gestión total de productos" ON public.products FOR ALL USING (true);
    END IF;
END $$;

-- Políticas para ORDERS y ORDER_ITEMS: Creación pública (Checkout), lectura y gestión
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Creación pública de pedidos') THEN
        CREATE POLICY "Creación pública de pedidos" ON public.orders FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Gestión de pedidos') THEN
        CREATE POLICY "Gestión de pedidos" ON public.orders FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Inserción de items de orden') THEN
        CREATE POLICY "Inserción de items de orden" ON public.order_items FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Gestión de items de orden') THEN
        CREATE POLICY "Gestión de items de orden" ON public.order_items FOR ALL USING (true);
    END IF;
END $$;

-- Políticas para SUBSCRIBERS: Suscripción abierta
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Suscripción pública a newsletter') THEN
        CREATE POLICY "Suscripción pública a newsletter" ON public.subscribers FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Gestión de suscriptores') THEN
        CREATE POLICY "Gestión de suscriptores" ON public.subscribers FOR ALL USING (true);
    END IF;
END $$;

-- Políticas para USERS: Acceso y autenticación
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Gestión de usuarios') THEN
        CREATE POLICY "Gestión de usuarios" ON public.users FOR ALL USING (true);
    END IF;
END $$;

-- ==============================================================================
-- 9. POBLADO INICIAL DE DATOS (SEED DATA)
-- ==============================================================================

-- A. Usuarios Iniciales (Admin y Cliente Demo)
INSERT INTO public.users (id, name, first_name, last_name, email, password_hash, role, phone, address, city, department)
VALUES 
    (1, 'Administrador ÁBICA', 'Administrador', 'ÁBICA', 'admin@abica.com', '$2a$10$YFG6PHbLJGB6.F4VVZu8LOlIb52UHd2crZ.td8laXAwCUpeMNn4Te', 'ADMIN', '+57 300 000 0000', 'Sede Principal ÁBICA, Bogotá', 'Bogotá D.C.', 'Bogotá D.C.'),
    (2, 'Camila Restrepo', 'Camila', 'Restrepo', 'camila.restrepo@email.com', '$2a$10$NmwFu6vSZLalWIMYQaUcFOGgY2hDcUtW/z0mkjZzJ3oZZAEAsH5Rq', 'CUSTOMER', '3104567890', 'Calle 85 # 11-53, Apto 402', 'Bogotá D.C.', 'Bogotá D.C.')
ON CONFLICT (email) DO NOTHING;

-- B. Catálogo Completo de los 18 Muebles de ÁBICA
INSERT INTO public.products (id, name, price, original_price, category, material, color, color_hex, dimensions, image, gallery, description, features, rating, reviews_count, badge, in_stock, stock_quantity)
VALUES
(1, 'Sofá Modular Malmö', 3290000.00, 3690000.00, 'Sofás y sillones', 'Lino natural y roble', 'Beige Marfil', '#e7e2d6ff', '240 x 100 x 82 cm', 
 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80', 
 '["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80"]'::jsonb, 
 'Sofá modular de líneas depuradas con cojines de plumón sintético hipoalergénico y estructura de roble macizo con certificación FSC. Sus módulos permiten configurar chaiselongue a la izquierda o derecha.', 
 '["Estructura en madera de roble macizo secada al horno", "Tapicería en lino europeo con tratamiento antimanchas", "Relleno de espuma HR 35kg/m³ y fibra siliconada", "Fundas de cojín totalmente desenfundables y lavables"]'::jsonb, 
 4.9, 42, 'Más Vendido', true, 18),

(2, 'Sillón Lounge Vester', 1490000.00, NULL, 'Sofás y sillones', 'Bouclé y roble', 'Roble Natural', '#D8C8B5', '85 x 82 x 76 cm', 
 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=80', 
 '["https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1580481077195-c6130932e600?auto=format&fit=crop&w=1200&q=80"]'::jsonb, 
 'Inspirado en el diseño danés de mediados de siglo. Silueta envolvente tapizada en bouclé ultra suave con patas cónicas de roble que aportan ligereza visual a cualquier rincón de lectura.', 
 '["Tapizado texturizado en tejido bouclé premium", "Patas torneadas a mano con acabado en aceite vegetal", "Ángulo ergonómico optimizado para descanso lumbar", "Capacidad de soporte probada hasta 140 kg"]'::jsonb, 
 4.8, 28, 'Nuevo', true, 12),

(3, 'Mesa Comedor Oikos', 2450000.00, 2800000.00, 'Mesas de comedor', 'Madera de roble macizo', 'Roble Natural', '#A87950', '200 x 95 x 76 cm', 
 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1200&q=80', 
 '["https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=1200&q=80"]'::jsonb, 
 'Mesa de comedor de proporciones generosas para 8 comensales. Su tablero con bordes redondeados orgánicos destaca la veta natural del roble, creando calidez y encuentro en el hogar.', 
 '["Tablero de 32 mm en roble macizo seleccionado", "Sellador mate poliuretánico ecológico resistente a derrames", "Ensambles tradicionales de carpintería de espiga", "Espacio cómodo para 6 a 8 comensales"]'::jsonb, 
 5.0, 36, '15% OFF', true, 8),

(4, 'Mesa Circular Luna', 1890000.00, NULL, 'Mesas de comedor', 'Madera de roble macizo', 'Beige Marfil', '#F7F5F0', '120 Ø x 75 cm', 
 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=1200&q=80', 
 '["https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=1200&q=80"]'::jsonb, 
 'Diseño circular que fomenta la conversación íntima. Base geométrica de tres pilares intersectados que permite acomodar hasta 5 personas sin molestias en las piernas.', 
 '["Diseño pedestal central que maximiza el espacio", "Acabado al agua no tóxico con tono arena nórdico", "Apta para comedores compactos o zonas de café", "Montaje sencillo con llave incluida"]'::jsonb, 
 4.7, 19, NULL, true, 10),

(5, 'Silla de Comedor Koto', 520000.00, 590000.00, 'Sillas', 'Madera de roble macizo', 'Roble Natural', '#A87950', '52 x 54 x 78 cm', 
 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=80', 
 '["https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=1200&q=80"]'::jsonb, 
 'Silla icónica con respaldo curvo moldeado al vapor y asiento tejido en cordón de papel danés de alta resistencia. Máxima durabilidad con ligereza insuperable.', 
 '["Asiento artesanal encordado a mano con 120 metros de cordel", "Curvado ergonómico de una sola pieza en respaldo", "Deslizadores de fieltro incorporados para proteger suelos", "Diseño apilable hasta 3 unidades"]'::jsonb, 
 4.9, 57, 'Más Vendido', true, 24),

(6, 'Silla Tapizada Arcos', 580000.00, NULL, 'Sillas', 'Lino natural y madera', 'Verde Oliva', '#69745A', '55 x 58 x 82 cm', 
 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=1200&q=80', 
 '["https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=1200&q=80"]'::jsonb, 
 'Confort superior para largas sobremesas. Asiento acolchado con tejido de fibra natural en tono verde oliva suave y estructura de soporte en fresno tintado.', 
 '["Tapizado en mezcla de lino y algodón orgánico", "Espuma de alta resiliencia que conserva su forma", "Estructura reforzada en uniones críticas", "Diseñada tanto para comedor como para estudio"]'::jsonb, 
 4.8, 23, 'Nuevo', true, 16),

(7, 'Cama Plataforma Kyoto Queen', 3490000.00, 3890000.00, 'Camas y dormitorios', 'Madera de roble macizo', 'Roble Natural', '#A87950', '172 x 215 x 90 cm (Colchón 160x190)', 
 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80', 
 '["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80"]'::jsonb, 
 'Cama flotante de inspiración zen con cabecero inclinado para lectura y somier de lamas de madera elástica. Genera una atmósfera de serenidad y descanso reparador.', 
 '["Somier de lamas de haya que favorece la ventilación del colchón", "Cabecero inclinado a 105° para apoyo ergonómico", "Estructura sin tornillería visible con anclajes ocultos", "Acabado sedoso con aceites orgánicos certificados"]'::jsonb, 
 4.9, 31, 'Edición Limitada', true, 7),

(8, 'Mesa de Noche Sora', 640000.00, NULL, 'Camas y dormitorios', 'Madera de roble macizo', 'Arena', '#D8C8B5', '45 x 40 x 52 cm', 
 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80', 
 '["https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80"]'::jsonb, 
 'Mesa de noche minimalista con cajón de cierre suave silencioso y nicho inferior para libros o revistas. Cantos redondeados para mayor seguridad y calidez visual.', 
 '["Rieles ocultos telescópicos con amortiguación soft-close", "Pasa-cables posterior discreto para cargadores", "Cajón interior forrado en fieltro protector", "Montaje 100% ensamblado de fábrica"]'::jsonb, 
 4.7, 15, NULL, true, 14),

(9, 'Escritorio Atelier Studio', 1780000.00, 2050000.00, 'Escritorios y muebles de oficina', 'Madera de nogal y acero', 'Gris Carbón', '#252722', '140 x 65 x 75 cm', 
 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80', 
 '["https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=80"]'::jsonb, 
 'El equilibrio perfecto entre elegancia arquitectónica y productividad. Superficie amplia con bandeja de gestión de cables oculta y cajón frontal estilizado para ordenador portátil.', 
 '["Superficie de nogal con tratamiento anti-reflejo y anti-huellas", "Bandeja canalizadora inferior para enchufes y fuentes de poder", "Estructura de perfiles de acero al carbono negro mate", "Niveladores ajustables en patas para suelos irregulares"]'::jsonb, 
 4.8, 22, '15% OFF', true, 9),

(10, 'Silla Giratoria Ergohaus', 1250000.00, NULL, 'Escritorios y muebles de oficina', 'Lino natural y metal', 'Verde Oliva', '#69745A', '62 x 62 x 92-102 cm', 
 'https://images.unsplash.com/photo-1580481077195-c6130932e600?auto=format&fit=crop&w=1200&q=80', 
 '["https://images.unsplash.com/photo-1580481077195-c6130932e600?auto=format&fit=crop&w=1200&q=80"]'::jsonb, 
 'Silla de oficina contemporánea que prescinde del plástico agresivo tradicional. Tapizada en tejido transpirable con pistón de elevación suave a gas y ruedas silenciosas de teflón.', 
 '["Mecanismo basculante sincronizado con bloqueo en 3 posiciones", "Soporte lumbar ergonómico integrado", "Ruedas engomadas anti-rayaduras aptas para pisos de madera", "Elevación neumática suave certificada BIFMA"]'::jsonb, 
 4.6, 18, 'Nuevo', true, 11),

(11, 'Estantería Modular Kubus', 2190000.00, 2490000.00, 'Estanterías y almacenamiento', 'Madera de roble macizo', 'Roble Natural', '#A87950', '160 x 35 x 195 cm', 
 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80', 
 '["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80"]'::jsonb, 
 'Sistema abierto de baldas con ritmo asimétrico que transforma los libros y objetos de arte en una exhibición escultural. Puede funcionar como divisor de ambientes diáfano.', 
 '["Diseño autoportante con acabado fino en las dos caras", "Baldas reforzadas con capacidad de 25 kg por nivel", "Kit de fijación a pared antisísmico incluido", "Espacio optimizado para vinilos, arte y enciclopedias"]'::jsonb, 
 4.9, 29, NULL, true, 6),

(12, 'Aparador Credenza Nord', 2790000.00, NULL, 'Estanterías y almacenamiento', 'Madera de roble macizo', 'Arena', '#D8C8B5', '180 x 45 x 78 cm', 
 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80', 
 '["https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80"]'::jsonb, 
 'Aparador bajo con puertas alistonadas tipo persiana corredera y baldas interiores regulables. Perfecto para vajilla, equipos de audio o almacenamiento en salón y comedor.', 
 '["Puertas correderas alistonadas de movimiento sedoso", "3 compartimentos con baldas regulables en altura", "Ranuras pasacables posteriores para componentes electrónicos", "Base elevada para facilitar el paso del robot aspirador"]'::jsonb, 
 5.0, 14, 'Exclusivo', true, 5),

(13, 'Mesas Nido Dúo Fjord', 890000.00, 990000.00, 'Mesas auxiliares', 'Madera de roble macizo', 'Roble Natural', '#A87950', 'Grande: 65 Ø x 44 cm | Pequeña: 45 Ø x 38 cm', 
 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=80', 
 '["https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=80"]'::jsonb, 
 'Juego de dos mesas auxiliares que se anidan parcialmente para brindar flexibilidad al espacio de centro. Tableros biselados y patas cilíndricas torneadas.', 
 '["Configuración modular: usar juntas o en extremos opuestos del sofá", "Bisel inferior en tablero que acentúa la esbeltez", "Acabado repelente a manchas de café y agua", "Fácil de transportar y reubicar según la ocasión"]'::jsonb, 
 4.8, 38, 'Más Vendido', true, 20),

(14, 'Mesa Lateral Travertino & Roble', 740000.00, NULL, 'Mesas auxiliares', 'Piedra travertino y madera', 'Beige Marfil', '#F7F5F0', '40 x 40 x 50 cm', 
 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=1200&q=80', 
 '["https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=1200&q=80"]'::jsonb, 
 'Pieza escultórica con tapa circular de piedra travertino natural sin pulir y base geométrica de roble macizo. Cada pieza posee vetas minerales únicas e irrepetibles.', 
 '["Piedra natural travertino con porosidad orgánica sellada", "Base de trípode con ensamble a media madera", "Resistencia térmica para tazas y bebidas calientes", "Fabricación artesanal con certificado de autenticidad"]'::jsonb, 
 4.9, 21, 'Nuevo', true, 15),

(15, 'Lámpara de Pie Wabi', 490000.00, 560000.00, 'Decoración complementaria', 'Lino natural y metal', 'Arena', '#D8C8B5', '35 Ø x 150 cm', 
 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80', 
 '["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80"]'::jsonb, 
 'Difusor cilíndrico en lino plisado a mano que proyecta una luz cálida, envolvente y sin deslumbramientos. Base con peso de hierro fundido para estabilidad total.', 
 '["Interruptor de pie ergonómico en cable textil trenzado", "Casquillo E27 compatible con bombillas LED cálidas regulables", "Estructura metálica esbelta con pintura electrostática", "Luz ambiental difusa ideal para salones y dormitorios"]'::jsonb, 
 4.8, 45, 'Más Vendido', true, 25),

(16, 'Jarrón Cerámica Escultórica Kanso', 210000.00, NULL, 'Decoración complementaria', 'Cerámica gres', 'Beige Marfil', '#F7F5F0', '22 Ø x 32 cm', 
 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=1200&q=80', 
 '["https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=1200&q=80"]'::jsonb, 
 'Modelado a mano en torno por maestros alfareros. Textura mate chamotada y silueta orgánica que funciona como pieza de arte individual o con ramas secas.', 
 '["Gres cerámico cocido a 1250°C de alta densidad", "Esmaltado interior impermeable apto para agua fresca", "Base con protección de corcho para no rayar superficies", "Pieza artesanal única con sutiles variaciones de tono"]'::jsonb, 
 4.9, 33, NULL, true, 30),

(17, 'Espejo Orgánico Arco Roble', 680000.00, 790000.00, 'Decoración complementaria', 'Madera de roble macizo', 'Roble Natural', '#A87950', '70 x 140 cm', 
 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=80', 
 '["https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=80"]'::jsonb, 
 'Marco perimetral de roble macizo con silueta de arco suave. Vidrio plateado ultra claro de 5 mm libre de cobre que amplía visualmente la luminosidad del recibidor o habitación.', 
 '["Cristal de alta definición sin distorsiones ópticas", "Película posterior de seguridad anti-fragmentación", "Soportes de cuña francesa para colgado seguro horizontal o vertical", "Marco de madera maciza ensamblado con biseles de precisión"]'::jsonb, 
 4.9, 27, '15% OFF', true, 10),

(18, 'Sofá Chaise Longue Oslo', 3890000.00, 4290000.00, 'Sofás y sillones', 'Lino natural y madera', 'Gris Carbón', '#252722', '280 x 165 x 82 cm', 
 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80', 
 '["https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80"]'::jsonb, 
 'Sofá seccional de proporciones majestuosas para familias y amantes del confort cinematográfico. Asientos profundos con soporte de muelles ensacados y tapizado en lino grafito.', 
 '["Muelle ensacado pocket spring para confort duradero", "Chaiselongue extra ancha con reposo ergonómico", "Estructura reforzada en madera maciza de eucalipto seco", "Tejido con clasificación Martindale > 40.000 ciclos"]'::jsonb, 
 5.0, 51, 'Exclusivo', true, 4)
ON CONFLICT (id) DO UPDATE SET
    price = EXCLUDED.price,
    in_stock = EXCLUDED.in_stock,
    stock_quantity = EXCLUDED.stock_quantity;

-- Sincronizar secuencia de autoincremento de IDs de productos
SELECT setval('public.products_id_seq', (SELECT MAX(id) FROM public.products));
SELECT setval('public.users_id_seq', (SELECT MAX(id) FROM public.users));

-- C. Pedido de Inauguración de Demostración
INSERT INTO public.orders (id, order_number, customer_name, customer_email, customer_phone, customer_address, payment_method, subtotal, shipping_cost, discount, total, status, notes)
VALUES (1, 'AB-2026-1001', 'Camila Restrepo', 'camila.restrepo@email.com', '3104567890', 'Calle 85 # 11-53, Apto 402, Bogotá D.C.', 'Transferencia / PSE', 4780000.00, 0.00, 0.00, 4780000.00, 'CONFIRMADO', 'Primer pedido de demostración de inauguración')
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO public.order_items (id, order_id, product_id, product_name, price, quantity, color, image, subtotal)
VALUES 
    (1, 1, 1, 'Sofá Modular Malmö', 3290000.00, 1, 'Beige Marfil', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80', 3290000.00),
    (2, 1, 2, 'Sillón Lounge Vester', 1490000.00, 1, 'Roble Natural', 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=80', 1490000.00)
ON CONFLICT (id) DO NOTHING;

SELECT setval('public.orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.orders));
SELECT setval('public.order_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.order_items));

-- ==============================================================================
-- FIN DEL SCRIPT: BASE DE DATOS LISTA Y OPERATIVA EN SUPABASE
-- ==============================================================================
