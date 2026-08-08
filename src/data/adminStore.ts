import type { Brand, SuzukiModel, SuzukiPart, ExplodedDiagram } from '../types';
import { SUZUKI_MODELS, SUZUKI_PARTS, EXPLODED_DIAGRAMS } from './suzukiData';

export const DEFAULT_BRANDS: Brand[] = [
  {
    id: 'suzuki',
    name: 'Suzuki',
    country: 'Japón',
    active: true,
    logo: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=120&auto=format&fit=crop&q=80',
    description: 'Fabricante japonés de motocicletas de alta calidad, superdeportivas y aventura.'
  },
  {
    id: 'honda',
    name: 'Honda',
    country: 'Japón',
    active: true,
    logo: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=120&auto=format&fit=crop&q=80',
    description: 'Líder mundial en fabricación de motocicletas urbanas, tourer y enduro.'
  },
  {
    id: 'yamaha',
    name: 'Yamaha',
    country: 'Japón',
    active: true,
    logo: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=120&auto=format&fit=crop&q=80',
    description: 'Innovación técnica y rendimiento deportivo en la gama MT y YZF.'
  },
  {
    id: 'kawasaki',
    name: 'Kawasaki',
    country: 'Japón',
    active: true,
    logo: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=120&auto=format&fit=crop&q=80',
    description: 'Especialista en alto rendimiento con las series Ninja y Z.'
  },
  {
    id: 'ktm',
    name: 'KTM',
    country: 'Austria',
    active: false,
    logo: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=120&auto=format&fit=crop&q=80',
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

