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
  parentId?: string;
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
  yearStart?: number;
  yearEnd?: number;
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
 * Busca si un texto coincide con CUALQUIER referencia OEM o código interno SKU del repuesto.
 * Búsqueda case-insensitive, trimming de espacios.
 */
export const matchesOem = (part: Pick<SuzukiPart, 'oemNumbers' | 'sku'>, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (part.sku && part.sku.toLowerCase().includes(q)) return true;
  return part.oemNumbers.some(oem => oem.toLowerCase().includes(q));
};

export interface SuzukiPart {
  id: string;
  sku: string;
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
  /** Indica si la pieza genera impuesto (IVA). Default: true. */
  taxable?: boolean;
  /** Indica si el precio de catálogo ya incluye el impuesto (IVA). Default: false. */
  priceIncludesTax?: boolean;
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
  country?: string;
  department?: string;
  city: string;
  address: string;
  postalCode: string;
  favoritePartIds: string[];
  createdAt: string;
  avatarUrl?: string;
  role?: 'customer' | 'admin';
  active?: boolean;
  notes?: string;
}

export type PaymentMethod = 'transferencia';

// DB-driven: statuses live in the `order_statuses` table (catalog).
export type OrderStatus = string;

export interface ZoneRate {
  zoneId: string;
  price: number;
}

export interface ShippingZone {
  id: string;
  name: string;
  description?: string;
  departments: string[];
  active: boolean;
  createdAt?: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  carrier: string; // 'Servientrega' | 'Inter Rapidísimo' | 'Coordinadora' | 'Envía' | 'TCC' | 'Retiro en tienda' | string
  description?: string;
  price: number; // Precio base / fallback por defecto
  estimatedDays: number;
  dispatchDays: string[]; // ['1', '2', '3', '4', '5'] (1=Mon ... 7=Sun)
  dispatchCutoff?: string; // Hora límite de despacho (HH:mm)
  freeShippingThreshold?: number;
  active: boolean;
  zoneRates?: ZoneRate[]; // Tarifas específicas por zona
  createdAt?: string;
}

export interface CountryRecord {
  id: string;
  name: string;
  code?: string;
  active: boolean;
}

export interface StateRecord {
  id: string;
  countryId: string;
  name: string;
  code?: string;
  active: boolean;
}

export interface CityRecord {
  id: string;
  country: string;
  department: string;
  city: string;
  active: boolean;
  code?: string;
}

export interface TaxConfig {
  taxName: string;
  taxRate: number; // e.g. 19 for 19%
  active: boolean;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterConfig {
  tagline: string;
  description: string;
  copyright: string;
  legalLinks: FooterLink[];
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  whatsapp?: string;
}

export interface SiteSettings {
  id: string;
  storeName: string;
  storeLogo: string;
  storeTagline: string;
  whatsappNumber: string;
  contactEmail: string;
  storeAddress: string;
  socialLinks?: SocialLinks;
  defaultCountry: string;
  defaultDepartment: string;
  defaultCity: string;
  showProductImages: boolean;
  /** Elemento mostrado como principal en el detalle de producto. Default: 'despiece'. */
  detailPrimary: 'despiece' | 'images';
  taxName: string;
  taxRate: number;
  taxActive: boolean;
  returnMaxDays: number;
  orderPrefix: string;
  returnPrefix: string;
  footerConfig?: FooterConfig;
  updatedAt?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number; // 10 for 10% or 15000 for $15.000 COP
  minPurchase?: number;
  active: boolean;
  createdAt?: string;
}

export interface Order {
  id: string;
  date: string;
  customerName: string;
  email: string;
  phone: string;
  documentId: string;
  country?: string;
  department?: string;
  city: string;
  shippingAddress: string;
  postalCode: string;
  items: CartItem[];
  subtotal?: number;
  discount?: number;
  discountCode?: string;
  taxRate?: number;
  taxAmount?: number;
  totalPrice: number;
  shippingCost?: number;
  shippingMethodName?: string;
  motorcycle: ActiveMotorcycle | null;
  guaranteeCode: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  paymentReference?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  notes?: string;
}

export interface OrderReturnItem {
  partId: string;
  name: string;
  sku?: string;
  oemNumber?: string;
  price: number;
  quantity: number;
  reason?: string;
  imageUrl?: string;
}

export interface OrderReturn {
  id: string;
  orderId: string;
  customerName: string;
  email: string;
  phone: string;
  documentId?: string;
  reason: string;
  resolutionType: 'refund' | 'exchange' | 'store_credit';
  isPreDispatchCancel?: boolean;
  isUnpaidCancel?: boolean;
  replacementPartId?: string;
  storeCreditCode?: string;
  bonusAmount?: number;
  status: string;
  qcStatus?: 'pending' | 'passed' | 'failed';
  qcNotes?: string;
  refundAmount?: number;
  refundMethod?: string;
  refundReference?: string;
  returnCarrier?: string;
  returnTrackingNumber?: string;
  restockInventory?: boolean;
  evidencePhotos?: string[];
  itemDetailsJson?: OrderReturnItem[];
  itemsJson?: any[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderMessage {
  id: string;
  sender: 'customer' | 'admin';
  senderName: string;
  text: string;
  isPrivate?: boolean; // If true, visible only to admins (notas internas de bodega)
  timestamp: string;
}


