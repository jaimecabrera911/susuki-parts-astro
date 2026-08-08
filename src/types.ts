export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName?: string;
  description?: string;
  active: boolean;
  order: number;
  subcategories: Subcategory[];
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  country?: string;
  active: boolean;
  description?: string;
}

export interface SuzukiModel {
  id: string;
  brandId?: string;
  name: string;
  category: string;
  image: string;
  years: number[];
  versions: string[];
  active?: boolean;
  notes?: string;
}

export interface CompatibilityRule {
  modelId: string;
  yearStart: number;
  yearEnd: number;
  version?: string;
  note?: string;
}

export interface TechnicalSpec {
  label: string;
  value: string;
}

export type AvailabilityStatus = 'in_stock' | 'international' | 'on_order';

export const AVAILABILITY_META: Record<AvailabilityStatus, { label: string; shortLabel: string; sortOrder: number; bgClass: string; textClass: string; borderClass: string }> = {
  in_stock:      { label: 'Disponible',          shortLabel: 'En Stock',       sortOrder: 0, bgClass: 'bg-emerald-50',  textClass: 'text-emerald-700',  borderClass: 'border-emerald-200' },
  international: { label: 'Envío Internacional', shortLabel: 'Internacional', sortOrder: 1, bgClass: 'bg-blue-50',     textClass: 'text-blue-700',     borderClass: 'border-blue-200' },
  on_order:      { label: 'Bajo Pedido',         shortLabel: 'Bajo Pedido',    sortOrder: 2, bgClass: 'bg-amber-50',    textClass: 'text-amber-700',    borderClass: 'border-amber-200' }
};

/** Resuelve el estado de disponibilidad con fallback para datos antiguos. */
export const getAvailabilityStatus = (
  part: Pick<SuzukiPart, 'availability' | 'stock'>
): AvailabilityStatus => {
  if (part.availability) return part.availability;
  return part.stock > 0 ? 'in_stock' : 'on_order';
};

/** Referencia OEM principal (primera en el array). */
export const getPrimaryOem = (part: Pick<SuzukiPart, 'oemNumbers'>): string =>
  part.oemNumbers[0] ?? '';

/**
 * Busca si un texto coincide con CUALQUIER referencia OEM del repuesto.
 * Búsqueda case-insensitive, trimming de espacios.
 */
export const matchesOem = (part: Pick<SuzukiPart, 'oemNumbers'>, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return part.oemNumbers.some(oem => oem.toLowerCase().includes(q));
};

export interface SuzukiPart {
  id: string;
  /** Referencias OEM del repuesto. La primera es la referencia principal (la que usa Suzuki). */
  oemNumbers: string[];
  name: string;
  category: 'motor' | 'electrico' | 'frenos' | 'transmision' | 'filtros' | 'carroceria';
  price: number;
  stock: number;
  image: string;
  images?: string[];
  description: string;
  specs: TechnicalSpec[];
  compatibility: CompatibilityRule[];
  schematicId?: string;
  diagramHotspot?: { x: number; y: number; itemNumber: number };
  /** Estado de disponibilidad del repuesto. Default: derivado de `stock`. */
  availability?: AvailabilityStatus;
}

export interface ExplodedDiagram {
  id: string;
  title: string;
  category: string;
  /** Sección de la motocicleta a la que pertenece el despiece (Engine, Brakes, Air & Fuel, etc.) */
  section: string;
  /** IDs de modelos Suzuki a los que aplica este despiece. Vacío = aplica a todos. */
  applicableModelIds: string[];
  modelTarget: string;
  diagramImage: string;
  description: string;
  hotspots: {
    partId: string;
    itemNumber: number;
    x: number; // percentage
    y: number; // percentage
    label: string;
  }[];
}

export interface ActiveMotorcycle {
  brand: string;
  modelId: string;
  modelName: string;
  year: number;
  version: string;
  vin?: string;
}

export interface CartItem {
  part: SuzukiPart;
  quantity: number;
  motorcycle: ActiveMotorcycle;
}

export interface VinLookupResult {
  vin: string;
  found: boolean;
  motorcycle?: ActiveMotorcycle;
  engineCode?: string;
  assemblyPlant?: string;
  specsSummary?: string;
  message?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  documentId: string;
  city: string;
  address: string;
  postalCode: string;
  favoritePartIds: string[];
  createdAt: string;
  avatarUrl?: string;
}

export type PaymentMethod = 'transferencia';

export type OrderStatus =
  | 'Pendiente de pago'
  | 'Pago confirmado'
  | 'Despachado en Bodega Central'
  | 'En tránsito'
  | 'Entregado'
  | 'Cancelado';

export interface Order {
  id: string;
  date: string;
  customerName: string;
  email: string;
  phone: string;
  documentId: string;
  city: string;
  shippingAddress: string;
  postalCode: string;
  items: CartItem[];
  totalPrice: number;
  motorcycle: ActiveMotorcycle | null;
  guaranteeCode: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  paymentReference?: string;
}


