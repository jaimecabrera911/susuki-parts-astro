import type { Brand, Category, SuzukiModel, SuzukiPart, ExplodedDiagram } from '../types';
import { SUZUKI_MODELS, SUZUKI_PARTS, EXPLODED_DIAGRAMS } from './suzukiData';

export const DEFAULT_BRANDS: Brand[] = [
  {
    id: 'suzuki',
    name: 'Suzuki',
    country: 'Japón',
    active: true,
    logo: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/brands/logo.png',
    description: 'Fabricante japonés de motocicletas de alta calidad, superdeportivas y aventura.'
  },
  {
    id: 'honda',
    name: 'Honda',
    country: 'Japón',
    active: true,
    logo: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/brands/logo.png',
    description: 'Líder mundial en fabricación de motocicletas urbanas, tourer y enduro.'
  },
  {
    id: 'yamaha',
    name: 'Yamaha',
    country: 'Japón',
    active: true,
    logo: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/brands/logo.png',
    description: 'Innovación técnica y rendimiento deportivo en la gama MT y YZF.'
  },
  {
    id: 'kawasaki',
    name: 'Kawasaki',
    country: 'Japón',
    active: true,
    logo: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/brands/logo.png',
    description: 'Especialista en alto rendimiento con las series Ninja y Z.'
  },
  {
    id: 'ktm',
    name: 'KTM',
    country: 'Austria',
    active: false,
    logo: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/brands/logo.png',
    description: 'Motocicletas Ready to Race para Off-Road y Naked de alto cilindraje.'
  }
];

export const INITIAL_ADMIN_MODELS: SuzukiModel[] = SUZUKI_MODELS.map(m => ({
  ...m,
  brandId: m.brandId || 'suzuki',
  active: m.active !== undefined ? m.active : true,
  notes: m.notes || 'Modelo verificado con catálogo oficial OEM.'
}));

export const INITIAL_ADMIN_PARTS: SuzukiPart[] = SUZUKI_PARTS;
export const INITIAL_ADMIN_SCHEMATICS: ExplodedDiagram[] = EXPLODED_DIAGRAMS;

// LocalStorage Keys
const BRANDS_STORAGE_KEY = 'sz_admin_brands_v1';
const MODELS_STORAGE_KEY = 'sz_admin_models_v1';
const PARTS_STORAGE_KEY = 'sz_admin_parts_v1';
const SCHEMATICS_STORAGE_KEY = 'sz_admin_schematics_v1';

export function getStoredBrands(): Brand[] {
  if (typeof window === 'undefined') return DEFAULT_BRANDS;
  try {
    const data = localStorage.getItem(BRANDS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading brands from storage', e);
  }
  return DEFAULT_BRANDS;
}

export function saveStoredBrands(brands: Brand[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BRANDS_STORAGE_KEY, JSON.stringify(brands));
  } catch (e) {
    console.error('Error saving brands to storage', e);
  }
}

export function getStoredModels(): SuzukiModel[] {
  if (typeof window === 'undefined') return INITIAL_ADMIN_MODELS;
  try {
    const data = localStorage.getItem(MODELS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading models from storage', e);
  }
  return INITIAL_ADMIN_MODELS;
}

export function saveStoredModels(models: SuzukiModel[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MODELS_STORAGE_KEY, JSON.stringify(models));
  } catch (e) {
    console.error('Error saving models to storage', e);
  }
}

export function getStoredParts(): SuzukiPart[] {
  if (typeof window === 'undefined') return INITIAL_ADMIN_PARTS;
  try {
    const data = localStorage.getItem(PARTS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading parts from storage', e);
  }
  return INITIAL_ADMIN_PARTS;
}

export function saveStoredParts(parts: SuzukiPart[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PARTS_STORAGE_KEY, JSON.stringify(parts));
  } catch (e) {
    console.error('Error saving parts to storage', e);
  }
}

export function getStoredSchematics(): ExplodedDiagram[] {
  if (typeof window === 'undefined') return INITIAL_ADMIN_SCHEMATICS;
  try {
    const data = localStorage.getItem(SCHEMATICS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading schematics from storage', e);
  }
  return INITIAL_ADMIN_SCHEMATICS;
}

export function saveStoredSchematics(schematics: ExplodedDiagram[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SCHEMATICS_STORAGE_KEY, JSON.stringify(schematics));
  } catch (e) {
    console.error('Error saving schematics to storage', e);
  }
}

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-motor',
    name: 'Motor & Admisión',
    slug: 'motor-admision',
    iconName: 'Wrench',
    description: 'Componentes internos de motor, pistones, válvulas y sistemas de inyección.',
    active: true,
    order: 1,
    subcategories: [
      { id: 'sub-cilindros', name: 'Cilindros & Pistones', slug: 'cilindros-pistones', active: true, description: 'Kits de cilindro, anillos, pistones y bulones OEM.' },
      { id: 'sub-carburacion', name: 'Carburación & Inyección FI', slug: 'carburacion-inyeccion', active: true, description: 'Inyectores, cuerpo de aceleración y bombas de gasolina.' },
      { id: 'sub-filtros', name: 'Filtros de Aceite & Aire', slug: 'filtros-aceite-aire', active: true, description: 'Filtros de flujo alto y reemplazos de mantenimiento preventivo.' },
      { id: 'sub-valvulas', name: 'Válvulas & Árboles de Levas', slug: 'valvulas-levas', active: true, description: 'Válvulas de admisión, escape, guías y balancines.' },
      { id: 'sub-juntas', name: 'Juntas & Empacaduras', slug: 'juntas-empacaduras', active: true, description: 'Kits de empaques completos para bloque y culata.' }
    ]
  },
  {
    id: 'cat-frenos',
    name: 'Frenos & Suspensión',
    slug: 'frenos-suspension',
    iconName: 'ShieldAlert',
    description: 'Sistemas de frenado ABS, discos, pastillas y suspensión hidráulica.',
    active: true,
    order: 2,
    subcategories: [
      { id: 'sub-pastillas', name: 'Pastillas & Bandas de Freno', slug: 'pastillas-bandas', active: true, description: 'Pastillas sinterizadas y orgánicas oficiales.' },
      { id: 'sub-discos', name: 'Discos de Freno', slug: 'discos-freno', active: true, description: 'Discos flotantes y semiflotantes de alta disipación.' },
      { id: 'sub-calipers', name: 'Calipers & Cilindros Maestro', slug: 'calipers-cilindros', active: true, description: 'Mordazas de freno, bombas y kits de reparación.' },
      { id: 'sub-suspension', name: 'Suspensiones & Amortiguadores', slug: 'suspensiones-amortiguadores', active: true, description: 'Barras telescópicas, retenes y monoshock trasero.' }
    ]
  },
  {
    id: 'cat-transmision',
    name: 'Transmisión & Embrague',
    slug: 'transmision-embrague',
    iconName: 'Repeat',
    description: 'Kits de arrastre, cadenas reforzadas, piñones y discos de clutch.',
    active: true,
    order: 3,
    subcategories: [
      { id: 'sub-arrastre', name: 'Kits de Arrastre & Cadenas', slug: 'kits-arrastre-cadenas', active: true, description: 'Cadenas con O-Ring / X-Ring, sprockets y coronas.' },
      { id: 'sub-embrague', name: 'Discos de Embrague & Clutch', slug: 'discos-embrague', active: true, description: 'Discos de pasta, prensa, resortes y separadores.' },
      { id: 'sub-caja', name: 'Ejes & Transmisión Secundaria', slug: 'ejes-transmision', active: true, description: 'Horquillas de cambio, ejes de transmisión y piñonería.' }
    ]
  },
  {
    id: 'cat-electrico',
    name: 'Eléctrico & Encendido',
    slug: 'electrico-encendido',
    iconName: 'Zap',
    description: 'Baterías, sistema de encendido, alternadores e iluminación.',
    active: true,
    order: 4,
    subcategories: [
      { id: 'sub-baterias', name: 'Baterías & Gel', slug: 'baterias-gel', active: true, description: 'Baterías libres de mantenimiento Yuasa / MotoBatt.' },
      { id: 'sub-bujias', name: 'Bujías NGK & Bobinas', slug: 'bujias-bobinas', active: true, description: 'Bujías Iridium IX y bobinas de encendido de alta potencia.' },
      { id: 'sub-estatores', name: 'Reguladores & Estatores', slug: 'reguladores-estatores', active: true, description: 'Coronas de encendido, estatores trifásicos y rectificadores.' },
      { id: 'sub-iluminacion', name: 'Faros & Iluminación LED', slug: 'faros-iluminacion', active: true, description: 'Faros principales, direccionales y stop trasero.' }
    ]
  },
  {
    id: 'cat-chasis',
    name: 'Chasis & Carrocería',
    slug: 'chasis-carroceria',
    iconName: 'Shield',
    description: 'Carenajes, guayas, espejos, rines y defensas de protección.',
    active: true,
    order: 5,
    subcategories: [
      { id: 'sub-llantas', name: 'Llantas & Rines', slug: 'llantas-rines', active: true, description: 'Llantas tubeless, rines de aspas y radios.' },
      { id: 'sub-cables', name: 'Guayas & Cables', slug: 'guayas-cables', active: true, description: 'Cables de acelerador, clutch y freno delantero.' },
      { id: 'sub-carenajes', name: 'Carenajes & Plásticos', slug: 'carenajes-plasticos', active: true, description: 'Tapas laterales, guardabarros y cúpulas cortaviento.' }
    ]
  }
];

const CATEGORIES_STORAGE_KEY = 'sz_admin_categories_v1';
const ORDERS_STORAGE_KEY = 'sz_admin_orders_v1';

export function getStoredCategories(): Category[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
  try {
    const data = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading categories from storage', e);
  }
  return DEFAULT_CATEGORIES;
}

export function saveStoredCategories(categories: Category[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving categories to storage', e);
  }
}

export const DEFAULT_ORDERS: any[] = [
  {
    id: 'ORD-2026-8941',
    date: '2026-08-08 10:30 AM',
    customerName: 'Carlos Alberto Mendoza',
    email: 'carlos.mendoza@email.com',
    phone: '+57 310 456 7890',
    documentId: '1.098.765.432',
    city: 'Bogotá D.C.',
    shippingAddress: 'Carrera 15 # 93-47, Apto 502',
    postalCode: '110221',
    items: [
      {
        part: {
          id: 'part-01',
          oemNumbers: ['16510-05240', '16510-05240-000'],
          name: 'Filtro de Aceite Original Suzuki Gixxer / GSX-R150',
          category: 'filtros',
          price: 32000,
          stock: 45,
          image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/default.jpg',
          description: 'Filtro de aceite de alto rendimiento oficial.',
          specs: [],
          compatibility: []
        },
        quantity: 2,
        motorcycle: {
          brand: 'Suzuki',
          modelId: 'gsx-r150',
          modelName: 'GSX-R150 ABS',
          year: 2023,
          version: 'Full Injection'
        }
      },
      {
        part: {
          id: 'part-02',
          oemNumbers: ['59100-23820'],
          name: 'Pastillas de Freno Delanteras Sinterizadas GSX-R150',
          category: 'frenos',
          price: 145000,
          stock: 18,
          image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/default.jpg',
          description: 'Pastillas de compuesto cerámico sinterizado.',
          specs: [],
          compatibility: []
        },
        quantity: 1,
        motorcycle: {
          brand: 'Suzuki',
          modelId: 'gsx-r150',
          modelName: 'GSX-R150 ABS',
          year: 2023,
          version: 'Full Injection'
        }
      }
    ],
    totalPrice: 209000,
    motorcycle: {
      brand: 'Suzuki',
      modelId: 'gsx-r150',
      modelName: 'GSX-R150 ABS',
      year: 2023,
      version: 'Full Injection'
    },
    guaranteeCode: 'SZ-GAR-8941-OK',
    paymentMethod: 'transferencia',
    status: 'Pago confirmado',
    paymentReference: 'WOMPI-TRX-998811',
    trackingNumber: 'SE789456123CO',
    shippingCarrier: 'Servientrega',
    notes: 'Cliente solicita empacar con protección extra de espuma.'
  },
  {
    id: 'ORD-2026-8942',
    date: '2026-08-07 04:15 PM',
    customerName: 'Ana María Restrepo',
    email: 'ana.restrepo@gmail.com',
    phone: '+57 300 891 2233',
    documentId: '52.431.890',
    city: 'Medellín',
    shippingAddress: 'Calle 10 # 43E-12, Poblado',
    postalCode: '050021',
    items: [
      {
        part: {
          id: 'part-03',
          oemNumbers: ['27500-11810'],
          name: 'Kit Arrastre Heavy Duty V-Strom 650 XT (Cadena DID 525)',
          category: 'transmision',
          price: 520000,
          stock: 8,
          image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/default.jpg',
          description: 'Kit de tracción reforzado con relación original.',
          specs: [],
          compatibility: []
        },
        quantity: 1,
        motorcycle: {
          brand: 'Suzuki',
          modelId: 'v-strom-650',
          modelName: 'V-Strom 650 XT',
          year: 2022,
          version: 'ABS'
        }
      }
    ],
    totalPrice: 520000,
    motorcycle: {
      brand: 'Suzuki',
      modelId: 'v-strom-650',
      modelName: 'V-Strom 650 XT',
      year: 2022,
      version: 'ABS'
    },
    guaranteeCode: 'SZ-GAR-8942-OK',
    paymentMethod: 'transferencia',
    status: 'Despachado en Bodega Central',
    paymentReference: 'BOLD-PAY-445566',
    trackingNumber: 'DP99881122CO',
    shippingCarrier: 'Deprisa',
    notes: 'Despachado desde la bodega principal en zona franca.'
  },
  {
    id: 'ORD-2026-8943',
    date: '2026-08-07 11:20 AM',
    customerName: 'Jorge Eduardo Silva',
    email: 'jorge.silva@hotmail.com',
    phone: '+57 315 776 9900',
    documentId: '79.876.543',
    city: 'Cali',
    shippingAddress: 'Av. 6N # 24N-08, Barrio Granada',
    postalCode: '760001',
    items: [
      {
        part: {
          id: 'part-04',
          oemNumbers: ['09482-00412', 'CPR8EA-9'],
          name: 'Bujía Iridium IX NGK CPR8EA-9 Suzuki Gixxer 250',
          category: 'electrico',
          price: 58000,
          stock: 60,
          image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/default.jpg',
          description: 'Bujía de alto encendido iridium.',
          specs: [],
          compatibility: []
        },
        quantity: 2,
        motorcycle: {
          brand: 'Suzuki',
          modelId: 'gixxer-250',
          modelName: 'Gixxer 250 SF',
          year: 2024,
          version: 'ABS'
        }
      }
    ],
    totalPrice: 116000,
    motorcycle: {
      brand: 'Suzuki',
      modelId: 'gixxer-250',
      modelName: 'Gixxer 250 SF',
      year: 2024,
      version: 'ABS'
    },
    guaranteeCode: 'SZ-GAR-8943-OK',
    paymentMethod: 'transferencia',
    status: 'En tránsito',
    paymentReference: 'TRANSFER-BANCOLOMBIA-1122',
    trackingNumber: 'EX44556677CO',
    shippingCarrier: 'Encoexpress',
    notes: 'Guía de transporte activa en ruta hacia Cali.'
  },
  {
    id: 'ORD-2026-8944',
    date: '2026-08-05 02:40 PM',
    customerName: 'Luisa Fernanda Gómez',
    email: 'luisa.gomez@empresa.com',
    phone: '+57 318 221 4455',
    documentId: '1.020.304.050',
    city: 'Bucaramanga',
    shippingAddress: 'Calle 36 # 21-45, Cabecera',
    postalCode: '680002',
    items: [
      {
        part: {
          id: 'part-05',
          oemNumbers: ['51110-38A00'],
          name: 'Juego de Barras de Suspensión Delantera DR650',
          category: 'frenos',
          price: 890000,
          stock: 3,
          image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/default.jpg',
          description: 'Telescópicos delanteros originales Suzuki DR650 Dual Sport.',
          specs: [],
          compatibility: []
        },
        quantity: 1,
        motorcycle: {
          brand: 'Suzuki',
          modelId: 'dr650',
          modelName: 'DR 650 SE',
          year: 2021,
          version: 'Dual Sport'
        }
      }
    ],
    totalPrice: 890000,
    motorcycle: {
      brand: 'Suzuki',
      modelId: 'dr650',
      modelName: 'DR 650 SE',
      year: 2021,
      version: 'Dual Sport'
    },
    guaranteeCode: 'SZ-GAR-8944-OK',
    paymentMethod: 'transferencia',
    status: 'Entregado',
    paymentReference: 'WOMPI-TRX-554433',
    trackingNumber: 'SE11223344CO',
    shippingCarrier: 'Servientrega',
    notes: 'Entregado satisfactoriamente. Cliente firmó recibo conforme.'
  },
  {
    id: 'ORD-2026-8945',
    date: '2026-08-08 12:10 PM',
    customerName: 'Felipe Gutiérrez',
    email: 'felipe.gutierrez@outlook.com',
    phone: '+57 301 998 7766',
    documentId: '80.112.334',
    city: 'Pereira',
    shippingAddress: 'Av. Circunvalar # 12-30',
    postalCode: '660001',
    items: [
      {
        part: {
          id: 'part-06',
          oemNumbers: ['31800-41G00'],
          name: 'Relé de Arranque Solenoide V-Strom 1050',
          category: 'electrico',
          price: 310000,
          stock: 5,
          image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/default.jpg',
          description: 'Solenoide de partida original.',
          specs: [],
          compatibility: []
        },
        quantity: 1,
        motorcycle: {
          brand: 'Suzuki',
          modelId: 'v-strom-1050',
          modelName: 'V-Strom 1050 DE',
          year: 2024,
          version: 'Adventure'
        }
      }
    ],
    totalPrice: 310000,
    motorcycle: {
      brand: 'Suzuki',
      modelId: 'v-strom-1050',
      modelName: 'V-Strom 1050 DE',
      year: 2024,
      version: 'Adventure'
    },
    guaranteeCode: 'SZ-GAR-8945-PENDING',
    paymentMethod: 'transferencia',
    status: 'Pendiente de pago',
    paymentReference: 'PENDIENTE',
    notes: 'Esperando soporte de transferencia bancaria por Nequi/Daviplata.'
  }
];

export function getStoredOrders(): any[] {
  if (typeof window === 'undefined') return DEFAULT_ORDERS;
  try {
    const data = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading orders from storage', e);
  }
  return DEFAULT_ORDERS;
}

export function saveStoredOrders(orders: any[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Error saving orders to storage', e);
  }
}

const USERS_STORAGE_KEY = 'sz_admin_users_v1';

export const DEFAULT_USERS: any[] = [
  {
    id: 'usr-101',
    fullName: 'Carlos Alberto Mendoza',
    email: 'carlos.mendoza@email.com',
    phone: '+57 310 456 7890',
    documentId: '1.098.765.432',
    city: 'Bogotá D.C.',
    address: 'Carrera 15 # 93-47, Apto 502',
    postalCode: '110221',
    favoritePartIds: ['part-01', 'part-02'],
    createdAt: '2026-01-15',
    avatarUrl: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/users/avatar.jpg',
    role: 'customer',
    active: true,
    notes: 'Cliente Frecuente. Propietario de Suzuki GSX-R150 2023.'
  },
  {
    id: 'usr-102',
    fullName: 'Ana María Restrepo',
    email: 'ana.restrepo@gmail.com',
    phone: '+57 300 891 2233',
    documentId: '52.431.890',
    city: 'Medellín',
    address: 'Calle 10 # 43E-12, Poblado',
    postalCode: '050021',
    favoritePartIds: ['part-03'],
    createdAt: '2026-02-10',
    avatarUrl: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/users/avatar.jpg',
    role: 'customer',
    active: true,
    notes: 'Viajera touring. Propietaria de V-Strom 650 XT.'
  },
  {
    id: 'usr-103',
    fullName: 'Jorge Eduardo Silva',
    email: 'jorge.silva@hotmail.com',
    phone: '+57 315 776 9900',
    documentId: '79.876.543',
    city: 'Cali',
    address: 'Av. 6N # 24N-08, Barrio Granada',
    postalCode: '760001',
    favoritePartIds: ['part-04'],
    createdAt: '2026-03-22',
    avatarUrl: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/users/avatar.jpg',
    role: 'customer',
    active: true,
    notes: 'Propietario de Gixxer 250 SF.'
  },
  {
    id: 'usr-104',
    fullName: 'Luisa Fernanda Gómez',
    email: 'luisa.gomez@empresa.com',
    phone: '+57 318 221 4455',
    documentId: '1.020.304.050',
    city: 'Bucaramanga',
    address: 'Calle 36 # 21-45, Cabecera',
    postalCode: '680002',
    favoritePartIds: ['part-05'],
    createdAt: '2026-04-05',
    avatarUrl: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/users/avatar.jpg',
    role: 'customer',
    active: true,
    notes: 'Cliente Off-Road. Propietaria de Suzuki DR650 SE.'
  },
  {
    id: 'usr-105',
    fullName: 'Administrador Suzuki Parts',
    email: 'admin@suzukiparts.com.co',
    phone: '+57 601 744 0000',
    documentId: '800.123.456-9',
    city: 'Bogotá D.C.',
    address: 'Av. Las Américas # 50-15',
    postalCode: '111321',
    favoritePartIds: [],
    createdAt: '2025-11-01',
    avatarUrl: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/users/avatar.jpg',
    role: 'admin',
    active: true,
    notes: 'Administrador Master de la Plataforma.'
  }
];

export function getStoredUsers(): any[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading users from storage', e);
  }
  return DEFAULT_USERS;
}

export function saveStoredUsers(users: any[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users to storage', e);
  }
}

