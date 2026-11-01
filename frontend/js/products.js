/**
 * ÁBICA Muebles Contemporáneos
 * Catálogo de Productos — Datos Locales
 * Precios expresados en Pesos Colombianos (COP)
 */

let products = [
  {
    id: 1,
    name: "Sofá Modular Malmö",
    price: 3290000,
    originalPrice: 3690000,
    category: "Sofás y sillones",
    material: "Lino natural y roble",
    color: "Beige Marfil",
    colorHex: "#e7e2d6ff",
    dimensions: "240 x 100 x 82 cm",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Sofá modular de líneas depuradas con cojines de plumón sintético hipoalergénico y estructura de roble macizo con certificación FSC. Sus módulos permiten configurar chaiselongue a la izquierda o derecha.",
    features: [
      "Estructura en madera de roble macizo secada al horno",
      "Tapicería en lino europeo con tratamiento antimanchas",
      "Relleno de espuma HR 35kg/m³ y fibra siliconada",
      "Fundas de cojín totalmente desenfundables y lavables"
    ],
    rating: 4.9,
    reviewsCount: 42,
    badge: "Más Vendido",
    inStock: true
  },
  {
    id: 2,
    name: "Sillón Lounge Vester",
    price: 1490000,
    originalPrice: null,
    category: "Sofás y sillones",
    material: "Bouclé y roble",
    color: "Roble Natural",
    colorHex: "#D8C8B5",
    dimensions: "85 x 82 x 76 cm",
    image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1580481077195-c6130932e600?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Inspirado en el diseño danés de mediados de siglo. Silueta envolvente tapizada en bouclé ultra suave con patas cónicas de roble que aportan ligereza visual a cualquier rincón de lectura.",
    features: [
      "Tapizado texturizado en tejido bouclé premium",
      "Patas torneadas a mano con acabado en aceite vegetal",
      "Ángulo ergonómico optimizado para descanso lumbar",
      "Capacidad de soporte probada hasta 140 kg"
    ],
    rating: 4.8,
    reviewsCount: 28,
    badge: "Nuevo",
    inStock: true
  },
  {
    id: 3,
    name: "Mesa Comedor Oikos",
    price: 2450000,
    originalPrice: 2800000,
    category: "Mesas de comedor",
    material: "Madera de roble macizo",
    color: "Roble Natural",
    colorHex: "#A87950",
    dimensions: "200 x 95 x 76 cm",
    image: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Mesa de comedor de proporciones generosas para 8 comensales. Su tablero con bordes redondeados orgánicos destaca la veta natural del roble, creando calidez y encuentro en el hogar.",
    features: [
      "Tablero de 32 mm en roble macizo seleccionado",
      "Sellador mate poliuretánico ecológico resistente a derrames",
      "Ensambles tradicionales de carpintería de espiga",
      "Espacio cómodo para 6 a 8 comensales"
    ],
    rating: 5.0,
    reviewsCount: 36,
    badge: "15% OFF",
    inStock: true
  },
  {
    id: 4,
    name: "Mesa Circular Luna",
    price: 1890000,
    originalPrice: null,
    category: "Mesas de comedor",
    material: "Madera de roble macizo",
    color: "Beige Marfil",
    colorHex: "#F7F5F0",
    dimensions: "120 Ø x 75 cm",
    image: "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Diseño circular que fomenta la conversación íntima. Base geométrica de tres pilares intersectados que permite acomodar hasta 5 personas sin molestias en las piernas.",
    features: [
      "Diseño pedestal central que maximiza el espacio",
      "Acabado al agua no tóxico con tono arena nórdico",
      "Apta para comedores compactos o zonas de café",
      "Montaje sencillo con llave incluida"
    ],
    rating: 4.7,
    reviewsCount: 19,
    badge: null,
    inStock: true
  },
  {
    id: 5,
    name: "Silla de Comedor Koto",
    price: 520000,
    originalPrice: 590000,
    category: "Sillas",
    material: "Madera de roble macizo",
    color: "Roble Natural",
    colorHex: "#A87950",
    dimensions: "52 x 54 x 78 cm",
    image: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Silla icónica con respaldo curvo moldeado al vapor y asiento tejido en cordón de papel danés de alta resistencia. Máxima durabilidad con ligereza insuperable.",
    features: [
      "Asiento artesanal encordado a mano con 120 metros de cordel",
      "Curvado ergonómico de una sola pieza en respaldo",
      "Deslizadores de fieltro incorporados para proteger suelos",
      "Diseño apilable hasta 3 unidades"
    ],
    rating: 4.9,
    reviewsCount: 57,
    badge: "Más Vendido",
    inStock: true
  },
  {
    id: 6,
    name: "Silla Tapizada Arcos",
    price: 580000,
    originalPrice: null,
    category: "Sillas",
    material: "Lino natural y madera",
    color: "Verde Oliva",
    colorHex: "#69745A",
    dimensions: "55 x 58 x 82 cm",
    image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Confort superior para largas sobremesas. Asiento acolchado con tejido de fibra natural en tono verde oliva suave y estructura de soporte en fresno tintado.",
    features: [
      "Tapizado en mezcla de lino y algodón orgánico",
      "Espuma de alta resiliencia que conserva su forma",
      "Estructura reforzada en uniones críticas",
      "Diseñada tanto para comedor como para estudio"
    ],
    rating: 4.8,
    reviewsCount: 23,
    badge: "Nuevo",
    inStock: true
  },
  {
    id: 7,
    name: "Cama Plataforma Kyoto Queen",
    price: 3490000,
    originalPrice: 3890000,
    category: "Camas y dormitorios",
    material: "Madera de roble macizo",
    color: "Roble Natural",
    colorHex: "#A87950",
    dimensions: "172 x 215 x 90 cm (Colchón 160x190)",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Cama flotante de inspiración zen con cabecero inclinado para lectura y somier de lamas de madera elástica. Genera una atmósfera de serenidad y descanso reparador.",
    features: [
      "Somier de lamas de haya que favorece la ventilación del colchón",
      "Cabecero inclinado a 105° para apoyo ergonómico",
      "Estructura sin tornillería visible con anclajes ocultos",
      "Acabado sedoso con aceites orgánicos certificados"
    ],
    rating: 4.9,
    reviewsCount: 31,
    badge: "Edición Limitada",
    inStock: true
  },
  {
    id: 8,
    name: "Mesa de Noche Sora",
    price: 640000,
    originalPrice: null,
    category: "Camas y dormitorios",
    material: "Madera de roble macizo",
    color: "Arena",
    colorHex: "#D8C8B5",
    dimensions: "45 x 40 x 52 cm",
    image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Mesa de noche minimalista con cajón de cierre suave silencioso y nicho inferior para libros o revistas. Cantos redondeados para mayor seguridad y calidez visual.",
    features: [
      "Rieles ocultos telescópicos con amortiguación soft-close",
      "Pasa-cables posterior discreto para cargadores",
      "Cajón interior forrado en fieltro protector",
      "Montaje 100% ensamblado de fábrica"
    ],
    rating: 4.7,
    reviewsCount: 15,
    badge: null,
    inStock: true
  },
  {
    id: 9,
    name: "Escritorio Atelier Studio",
    price: 1780000,
    originalPrice: 2050000,
    category: "Escritorios y muebles de oficina",
    material: "Madera de nogal y acero",
    color: "Gris Carbón",
    colorHex: "#252722",
    dimensions: "140 x 65 x 75 cm",
    image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "El equilibrio perfecto entre elegancia arquitectónica y productividad. Superficie amplia con bandeja de gestión de cables oculta y cajón frontal estilizado para ordenador portátil.",
    features: [
      "Superficie de nogal con tratamiento anti-reflejo y anti-huellas",
      "Bandeja canalizadora inferior para enchufes y fuentes de poder",
      "Estructura de perfiles de acero al carbono negro mate",
      "Niveladores ajustables en patas para suelos irregulares"
    ],
    rating: 4.8,
    reviewsCount: 22,
    badge: "15% OFF",
    inStock: true
  },
  {
    id: 10,
    name: "Silla Giratoria Ergohaus",
    price: 1250000,
    originalPrice: null,
    category: "Escritorios y muebles de oficina",
    material: "Lino natural y metal",
    color: "Verde Oliva",
    colorHex: "#69745A",
    dimensions: "62 x 62 x 92-102 cm",
    image: "https://images.unsplash.com/photo-1580481077195-c6130932e600?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1580481077195-c6130932e600?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Silla de oficina contemporánea que prescinde del plástico agresivo tradicional. Tapizada en tejido transpirable con pistón de elevación suave a gas y ruedas silenciosas de teflón.",
    features: [
      "Mecanismo basculante sincronizado con bloqueo en 3 posiciones",
      "Soporte lumbar ergonómico integrado",
      "Ruedas engomadas anti-rayaduras aptas para pisos de madera",
      "Elevación neumática suave certificada BIFMA"
    ],
    rating: 4.6,
    reviewsCount: 18,
    badge: "Nuevo",
    inStock: true
  },
  {
    id: 11,
    name: "Estantería Modular Kubus",
    price: 2190000,
    originalPrice: 2490000,
    category: "Estanterías y almacenamiento",
    material: "Madera de roble macizo",
    color: "Roble Natural",
    colorHex: "#A87950",
    dimensions: "160 x 35 x 195 cm",
    image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Sistema abierto de baldas con ritmo asimétrico que transforma los libros y objetos de arte en una exhibición escultural. Puede funcionar como divisor de ambientes diáfano.",
    features: [
      "Diseño autoportante con acabado fino en las dos caras",
      "Baldas reforzadas con capacidad de 25 kg por nivel",
      "Kit de fijación a pared antisísmico incluido",
      "Espacio optimizado para vinilos, arte y enciclopedias"
    ],
    rating: 4.9,
    reviewsCount: 29,
    badge: null,
    inStock: true
  },
  {
    id: 12,
    name: "Aparador Credenza Nord",
    price: 2790000,
    originalPrice: null,
    category: "Estanterías y almacenamiento",
    material: "Madera de roble macizo",
    color: "Arena",
    colorHex: "#D8C8B5",
    dimensions: "180 x 45 x 78 cm",
    image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Aparador bajo con puertas alistonadas tipo persiana corredera y baldas interiores regulables. Perfecto para vajilla, equipos de audio o almacenamiento en salón y comedor.",
    features: [
      "Puertas correderas alistonadas de movimiento sedoso",
      "3 compartimentos con baldas regulables en altura",
      "Ranuras pasacables posteriores para componentes electrónicos",
      "Base elevada para facilitar el paso del robot aspirador"
    ],
    rating: 5.0,
    reviewsCount: 14,
    badge: "Exclusivo",
    inStock: true
  },
  {
    id: 13,
    name: "Mesas Nido Dúo Fjord",
    price: 890000,
    originalPrice: 990000,
    category: "Mesas auxiliares",
    material: "Madera de roble macizo",
    color: "Roble Natural",
    colorHex: "#A87950",
    dimensions: "Grande: 65 Ø x 44 cm | Pequeña: 45 Ø x 38 cm",
    image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Juego de dos mesas auxiliares que se anidan parcialmente para brindar flexibilidad al espacio de centro. Tableros biselados y patas cilíndricas torneadas.",
    features: [
      "Configuración modular: usar juntas o en extremos opuestos del sofá",
      "Bisel inferior en tablero que acentúa la esbeltez",
      "Acabado repelente a manchas de café y agua",
      "Fácil de transportar y reubicar según la ocasión"
    ],
    rating: 4.8,
    reviewsCount: 38,
    badge: "Más Vendido",
    inStock: true
  },
  {
    id: 14,
    name: "Mesa Lateral Travertino & Roble",
    price: 740000,
    originalPrice: null,
    category: "Mesas auxiliares",
    material: "Piedra travertino y madera",
    color: "Beige Marfil",
    colorHex: "#F7F5F0",
    dimensions: "40 x 40 x 50 cm",
    image: "https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Pieza escultórica con tapa circular de piedra travertino natural sin pulir y base geométrica de roble macizo. Cada pieza posee vetas minerales únicas e irrepetibles.",
    features: [
      "Piedra natural travertino con porosidad orgánica sellada",
      "Base de trípode con ensamble a media madera",
      "Resistencia térmica para tazas y bebidas calientes",
      "Fabricación artesanal con certificado de autenticidad"
    ],
    rating: 4.9,
    reviewsCount: 21,
    badge: "Nuevo",
    inStock: true
  },
  {
    id: 15,
    name: "Lámpara de Pie Wabi",
    price: 490000,
    originalPrice: 560000,
    category: "Decoración complementaria",
    material: "Lino natural y metal",
    color: "Arena",
    colorHex: "#D8C8B5",
    dimensions: "35 Ø x 150 cm",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Difusor cilíndrico en lino plisado a mano que proyecta una luz cálida, envolvente y sin deslumbramientos. Base con peso de hierro fundido para estabilidad total.",
    features: [
      "Interruptor de pie ergonómico en cable textil trenzado",
      "Casquillo E27 compatible con bombillas LED cálidas regulables",
      "Estructura metálica esbelta con pintura electrostática",
      "Luz ambiental difusa ideal para salones y dormitorios"
    ],
    rating: 4.8,
    reviewsCount: 45,
    badge: "Más Vendido",
    inStock: true
  },
  {
    id: 16,
    name: "Jarrón Cerámica Escultórica Kanso",
    price: 210000,
    originalPrice: null,
    category: "Decoración complementaria",
    material: "Cerámica gres",
    color: "Beige Marfil",
    colorHex: "#F7F5F0",
    dimensions: "22 Ø x 32 cm",
    image: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Modelado a mano en torno por maestros alfareros. Textura mate chamotada y silueta orgánica que funciona como pieza de arte individual o con ramas secas.",
    features: [
      "Gres cerámico cocido a 1250°C de alta densidad",
      "Esmaltado interior impermeable apto para agua fresca",
      "Base con protección de corcho para no rayar superficies",
      "Pieza artesanal única con sutiles variaciones de tono"
    ],
    rating: 4.9,
    reviewsCount: 33,
    badge: null,
    inStock: true
  },
  {
    id: 17,
    name: "Espejo Orgánico Arco Roble",
    price: 680000,
    originalPrice: 790000,
    category: "Decoración complementaria",
    material: "Madera de roble macizo",
    color: "Roble Natural",
    colorHex: "#A87950",
    dimensions: "70 x 140 cm",
    image: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Marco perimetral de roble macizo con silueta de arco suave. Vidrio plateado ultra claro de 5 mm libre de cobre que amplía visualmente la luminosidad del recibidor o habitación.",
    features: [
      "Cristal de alta definición sin distorsiones ópticas",
      "Película posterior de seguridad anti-fragmentación",
      "Soportes de cuña francesa para colgado seguro horizontal o vertical",
      "Marco de madera maciza ensamblado con biseles de precisión"
    ],
    rating: 4.9,
    reviewsCount: 27,
    badge: "15% OFF",
    inStock: true
  },
  {
    id: 18,
    name: "Sofá Chaise Longue Oslo",
    price: 3890000,
    originalPrice: 4290000,
    category: "Sofás y sillones",
    material: "Lino natural y madera",
    color: "Gris Carbón",
    colorHex: "#252722",
    dimensions: "280 x 165 x 82 cm",
    image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Sofá seccional de proporciones majestuosas para familias y amantes del confort cinematográfico. Asientos profundos con soporte de muelles ensacados y tapizado en lino grafito.",
    features: [
      "Muelle ensacado pocket spring para confort duradero",
      "Chaiselongue extra ancha con reposo ergonómico",
      "Estructura reforzada en madera maciza de eucalipto seco",
      "Tejido con clasificación Martindale > 40.000 ciclos"
    ],
    rating: 5.0,
    reviewsCount: 51,
    badge: "Exclusivo",
    inStock: true
  }
];

// Categorías del sistema
const categories = [
  "Todos",
  "Sofás y sillones",
  "Mesas de comedor",
  "Sillas",
  "Camas y dormitorios",
  "Escritorios y muebles de oficina",
  "Estanterías y almacenamiento",
  "Mesas auxiliares",
  "Decoración complementaria"
];

// Materiales disponibles
const materials = [
  "Todos",
  "Madera de roble macizo",
  "Lino natural y roble",
  "Lino natural y madera",
  "Bouclé y roble",
  "Madera de nogal y acero",
  "Lino natural y metal",
  "Piedra travertino y madera",
  "Cerámica gres"
];

// Colores disponibles
const colors = [
  { name: "Todos", hex: "" },
  { name: "Beige Marfil", hex: "#F2EFE9" },
  { name: "Arena", hex: "#D8C8B5" },
  { name: "Roble Natural", hex: "#A87950" },
  { name: "Verde Oliva", hex: "#69745A" },
  { name: "Gris Carbón", hex: "#252722" }
];

// Helpers para precios y formato
function formatCurrency(amount) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(amount);
}

// Sincronización automática con la API de PostgreSQL del backend
if (typeof window !== "undefined") {
  window.products = products;

  // Consultar catálogo en tiempo real desde el backend
  fetch("/api/products")
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (data && data.success && Array.isArray(data.products) && data.products.length > 0) {
        products.length = 0;
        products.push(...data.products);
        window.products = products;
        if (typeof applyFilters === "function") {
          applyFilters();
        }
      }
    })
    .catch(() => {
      // Si el servidor aún no responde o corre estático, opera con catálogo local
    });
}
