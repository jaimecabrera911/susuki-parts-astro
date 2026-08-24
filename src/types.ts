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

export interface TechnicalSpecTemplate {
  id?: string;
  label: string;
  defaultValue?: string;
}

export type AvailabilityStatus = 'in_stock' | 'international' | 'on_order';

export const AVAILABILITY_META: Record<AvailabilityStatus, { label: string; shortLabel: string; sortOrder: number; bgClass: string; textClass: string; borderClass: string }> = {
  in_stock:      { label: 'Disponible',          shortLabel: 'En Stock',       sortOrder: 0, bgClass: 'bg-emerald-50',  textClass: 'text-emerald-700',  borderClass: 'border-emerald-200' },
  international: { label: 'Envío Internacional', shortLabel: 'Internacional', sortOrder: 1, bgClass: 'bg-blue-50',     textClass: 'text-blue-700',     borderClass: 'border-blue-200' },
  on_order:      { label: 'Bajo Pedido',         shortLabel: 'Bajo Pedido',    sortOrder: 2, bgClass: 'bg-amber-50',    textClass: 'text-amber-700',    borderClass: 'border-amber-200' }
};

/** Resuelve el estado de disponibilidad con fallback para datos antiguos.
 *  Un repuesto con availability 'in_stock' pero stock 0 no puede considerarse
 *  disponible: se degrada a 'on_order' para no mostrar datos inconsistentes.
 *  Los estados explícitos 'international' y 'on_order' se respetan tal cual. */
export const getAvailabilityStatus = (
  part: Pick<SuzukiPart, 'availability' | 'stock'>
): AvailabilityStatus => {
  if (part.availability && part.availability !== 'in_stock') return part.availability;
  return part.stock > 0 ? 'in_stock' : 'on_order';
};

/** Referencia OEM principal (primera en el array) con fallback seguro a oemNumber, sku o vacío. */
export const getPrimaryOem = (part?: Partial<SuzukiPart> | { oemNumbers?: string[]; sku?: string } | null): string => {
  if (!part) return '';
  if (Array.isArray(part.oemNumbers) && part.oemNumbers.length > 0 && part.oemNumbers[0]) {
    return part.oemNumbers[0];
  }
  if (typeof (part as any).oemNumber === 'string' && (part as any).oemNumber) {
    return (part as any).oemNumber;
  }
  return part.sku || '';
};

/**
 * Busca si un texto coincide con CUALQUIER referencia OEM o código interno SKU del repuesto.
 * Búsqueda case-insensitive, trimming de espacios.
 */
export const matchesOem = (part?: Partial<SuzukiPart> | { oemNumbers?: string[]; sku?: string } | null, query?: string): boolean => {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (!part) return false;
  if (part.sku && part.sku.toLowerCase().includes(q)) return true;
  if (Array.isArray(part.oemNumbers)) {
    return part.oemNumbers.some(oem => typeof oem === 'string' && oem.toLowerCase().includes(q));
  }
  if (typeof (part as any).oemNumber === 'string') {
    return (part as any).oemNumber.toLowerCase().includes(q);
  }
  return false;
};

/**
 * Determina si el estado de una orden corresponde a un pedido con pago/procesamiento activo (no pendiente ni cancelado).
 */
export const isPaidOrderStatus = (statusStr?: string | null): boolean => {
  if (!statusStr) return false;
  const s = statusStr.trim().toLowerCase();
  if (s.includes('pendiente') || s.includes('cancel') || s.includes('expir') || s.includes('rechaz') || s.includes('anulad')) {
    return false;
  }
  return s.includes('pago') || s.includes('pagad') || s.includes('confirmad') || s.includes('preparaci') || s.includes('despach') || s.includes('enviad') || s.includes('tránsito') || s.includes('transito') || s.includes('entregad') || s.includes('complet') || s.includes('aprobad') || s.includes('verificad');
};

/**
 * Determina si el estado de una orden corresponde a una orden cancelada, expirada o anulada.
 */
export const isCancelOrderStatus = (statusStr?: string | null): boolean => {
  if (!statusStr) return false;
  const s = statusStr.trim().toLowerCase();
  return s.includes('cancel') || s.includes('expir') || s.includes('rechaz') || s.includes('anulad');
};

export interface SuzukiPart {
  id: string;
  sku: string;
  /** Referencias OEM del repuesto. La primera es la referencia principal (la que usa Suzuki). */
  oemNumbers: string[];
  name: string;
  category: string;
  price: number;
  cost?: number;
  stock: number;
  stockReserved?: number;
  image: string;
  images?: string[];
  description: string;
  specs: TechnicalSpec[];
  compatibility: CompatibilityRule[];
  schematicId?: string;
  diagramHotspot?: { x: number; y: number; itemNumber: number };
  /** Estado de disponibilidad del repuesto. Default: derivado de `stock`. */
  availability?: AvailabilityStatus;
  /** Días mínimos de entrega específicos para este repuesto. Si no se especifica, usa la configuración global de la tienda. */
  leadTimeMinDays?: number | null;
  /** Días máximos de entrega específicos para este repuesto. Si no se especifica, usa la configuración global de la tienda. */
  leadTimeMaxDays?: number | null;
  /** Indica si el repuesto está activo / visible en el catálogo público. Default: true. */
  active?: boolean;
  /** Indica si la pieza genera impuesto (IVA). Default: true. */
  taxable?: boolean;
  /** Indica si el precio de catálogo ya incluye el impuesto (IVA). Default: false. */
  priceIncludesTax?: boolean;
}

/** Modo de días laborables para el cálculo de fechas de entrega. */
export type WorkingDaysMode = 'mon_fri' | 'mon_sat' | 'all_days';

/** Resultado del cálculo de rango de fechas de entrega. */
export interface DeliveryDateRange {
  minDays: number;
  maxDays: number;
  minDate: Date;
  maxDate: Date;
  /** Ej: "Jueves 27 y Lunes 31 de Ago" */
  formattedRange: string;
  /** Ej: "2-4 días hábiles" */
  formattedDays: string;
  /** Etiqueta completa: "Llega entre el Jueves 27 y Lunes 31 de Ago (2-4 días hábiles)" */
  fullLabel: string;
}

/**
 * Avanza una fecha sumando `days` días según el modo de días laborables configurado.
 * - 'mon_fri': Salta sábados y domingos.
 * - 'mon_sat': Salta domingos.
 * - 'all_days': Días calendario continuos.
 */
export function addWorkingDays(startDate: Date, days: number, mode: WorkingDaysMode): Date {
  const result = new Date(startDate);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay(); // 0=Dom, 6=Sab
    if (mode === 'mon_fri' && (dow === 0 || dow === 6)) continue;
    if (mode === 'mon_sat' && dow === 0) continue;
    added++;
  }
  return result;
}

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatDateES(d: Date): string {
  return `${DAYS_ES[d.getDay()]} ${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`;
}

/**
 * Calcula el rango de fechas de entrega proyectadas a partir de los días mínimos y máximos.
 */
export function calculateDeliveryDateRange(
  minDays: number,
  maxDays: number,
  mode: WorkingDaysMode,
  baseDate?: Date
): DeliveryDateRange {
  const start = baseDate ? new Date(baseDate) : new Date();
  // Normalizamos al inicio del día siguiente (no el mismo día)
  start.setHours(0, 0, 0, 0);

  const minDate = addWorkingDays(start, Math.max(1, minDays), mode);
  const maxDate = addWorkingDays(start, Math.max(1, maxDays), mode);

  const modeLabel = mode === 'mon_fri' ? 'días hábiles' : mode === 'mon_sat' ? 'días (Lun-Sab)' : 'días calendario';
  const formattedDays = minDays === maxDays ? `${minDays} ${modeLabel}` : `${minDays}-${maxDays} ${modeLabel}`;
  const formattedRange = `entre el ${formatDateES(minDate)} y el ${formatDateES(maxDate)}`;
  const fullLabel = `Llega ${formattedRange} (${formattedDays})`;

  return { minDays, maxDays, minDate, maxDate, formattedRange, formattedDays, fullLabel };
}

/**
 * Retorna el rango de fechas estimado para un repuesto, usando configuración del repuesto o global.
 */
export const getEstimatedDeliveryRange = (
  part?: Pick<SuzukiPart, 'availability' | 'stock' | 'leadTimeMinDays' | 'leadTimeMaxDays'> | null,
  settings?: Partial<SiteSettings> | null,
  baseDate?: Date
): DeliveryDateRange => {
  const mode: WorkingDaysMode = (settings?.shippingWorkingDaysMode as WorkingDaysMode) || 'mon_fri';

  // Tiempo personalizado del repuesto
  if (part?.leadTimeMinDays != null && part.leadTimeMaxDays != null) {
    return calculateDeliveryDateRange(part.leadTimeMinDays, part.leadTimeMaxDays, mode, baseDate);
  }

  const status = getAvailabilityStatus(part ?? { stock: 0 });
  if (status === 'in_stock') {
    return calculateDeliveryDateRange(
      settings?.shippingInStockMinDays ?? 2,
      settings?.shippingInStockMaxDays ?? 4,
      mode, baseDate
    );
  }
  if (status === 'international') {
    return calculateDeliveryDateRange(
      settings?.shippingInternationalMinDays ?? 10,
      settings?.shippingInternationalMaxDays ?? 20,
      mode, baseDate
    );
  }
  // on_order
  return calculateDeliveryDateRange(
    settings?.shippingOnOrderMinDays ?? 15,
    settings?.shippingOnOrderMaxDays ?? 30,
    mode, baseDate
  );
};

/** @deprecated Usar getEstimatedDeliveryRange */
export const getEstimatedDeliveryTime = (
  part?: Pick<SuzukiPart, 'availability' | 'stock' | 'leadTimeMinDays' | 'leadTimeMaxDays'> | null,
  settings?: Partial<SiteSettings> | null,
  baseDate?: Date
): string => {
  if (!part) return '';
  return getEstimatedDeliveryRange(part, settings, baseDate).fullLabel;
};

/**
 * Resumen de despacho estimado para un conjunto de ítems de carrito.
 */
export interface CartShippingSummary {
  hasInStock: boolean;
  hasInternational: boolean;
  hasOnOrder: boolean;
  isMixed: boolean;
  /** @deprecated Usar maxRange.fullLabel */
  maxLeadTime: string;
  /** @deprecated Usar maxRange.fullLabel */
  maxLeadTimeDays: string;
  maxRange: DeliveryDateRange;
  leadTimeCategory: AvailabilityStatus;
  mixedPolicyMessage: string;
}

export const getCartShippingSummary = (
  items: { part: SuzukiPart; quantity: number }[],
  settings?: Partial<SiteSettings> | null,
  baseDate?: Date
): CartShippingSummary => {
  let hasInStock = false;
  let hasInternational = false;
  let hasOnOrder = false;

  for (const item of items) {
    const status = getAvailabilityStatus(item.part);
    if (status === 'in_stock') hasInStock = true;
    else if (status === 'international') hasInternational = true;
    else if (status === 'on_order') hasOnOrder = true;
  }

  const distinctTypes = [hasInStock, hasInternational, hasOnOrder].filter(Boolean).length;
  const isMixed = distinctTypes > 1;
  const mode: WorkingDaysMode = (settings?.shippingWorkingDaysMode as WorkingDaysMode) || 'mon_fri';

  let leadTimeCategory: AvailabilityStatus = 'in_stock';
  let maxRange: DeliveryDateRange;

  if (hasOnOrder) {
    leadTimeCategory = 'on_order';
    maxRange = calculateDeliveryDateRange(
      settings?.shippingOnOrderMinDays ?? 15,
      settings?.shippingOnOrderMaxDays ?? 30,
      mode, baseDate
    );
  } else if (hasInternational) {
    leadTimeCategory = 'international';
    maxRange = calculateDeliveryDateRange(
      settings?.shippingInternationalMinDays ?? 10,
      settings?.shippingInternationalMaxDays ?? 20,
      mode, baseDate
    );
  } else {
    maxRange = calculateDeliveryDateRange(
      settings?.shippingInStockMinDays ?? 2,
      settings?.shippingInStockMaxDays ?? 4,
      mode, baseDate
    );
  }

  const mixedPolicyMessage =
    settings?.shippingMixedPolicy ||
    'Envío consolidado: Tu pedido se despachará en un solo paquete una vez arriben todas las piezas importadas.';

  return {
    hasInStock,
    hasInternational,
    hasOnOrder,
    isMixed,
    maxLeadTime: maxRange.fullLabel,
    maxLeadTimeDays: maxRange.fullLabel,
    maxRange,
    leadTimeCategory,
    mixedPolicyMessage,
  };
};

export interface ExplodedDiagram {
  id: string;
  tenantId?: string;
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

export interface SchematicSection {
  id: string;
  name: string;
  slug?: string | null;
  order: number;
  active: boolean;
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

export type DashboardModule =
  | 'brands'
  | 'models'
  | 'categories'
  | 'parts'
  | 'kardex'
  | 'schematics'
  | 'orders'
  | 'returns'
  | 'users'
  | 'shipping'
  | 'payments'
  | 'settings'
  | 'coupons'
  | 'metrics';

export interface UserPermission {
  id?: string;
  userId?: string;
  module: DashboardModule;
  canRead: boolean;
  canWrite: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isSystem?: boolean;
  active?: boolean;
  permissions: UserPermission[];
  createdAt?: string;
  updatedAt?: string;
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
  role?: string;
  roleId?: string;
  permissions?: UserPermission[];
  active?: boolean;
  notes?: string;
}

export type PaymentMethod = 'transferencia' | 'wompi' | 'tarjeta' | 'pse' | 'nequi' | string;

// DB-driven: statuses live in the `order_statuses` table (catalog).
export type OrderStatus = string;

export interface ZoneRate {
  zoneId: string;
  price: number;
}

export interface ShippingZoneDepartment {
  name: string;
  cities: string[]; // [] = departamento completo (todas sus ciudades)
}

export interface ShippingZone {
  id: string;
  name: string;
  description?: string;
  departments: ShippingZoneDepartment[];
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
  /** Mostrar despiece con hotspot en la tarjeta de producto del catálogo. Default: false. */
  showPartSchematicOnCard?: boolean;
  taxName: string;
  taxRate: number;
  taxActive: boolean;
  returnMaxDays: number;
  orderPrefix: string;
  returnPrefix: string;
  defaultSpecs?: TechnicalSpecTemplate[];
  footerConfig?: FooterConfig;
  /** Modo de días laborables para el cálculo de fechas. */
  shippingWorkingDaysMode?: WorkingDaysMode;
  /** Días mínimos de entrega para productos en stock. */
  shippingInStockMinDays?: number;
  /** Días máximos de entrega para productos en stock. */
  shippingInStockMaxDays?: number;
  /** Días mínimos de entrega para productos internacionales. */
  shippingInternationalMinDays?: number;
  /** Días máximos de entrega para productos internacionales. */
  shippingInternationalMaxDays?: number;
  /** Días mínimos de entrega para productos bajo pedido. */
  shippingOnOrderMinDays?: number;
  /** Días máximos de entrega para productos bajo pedido. */
  shippingOnOrderMaxDays?: number;
  /** Política de aviso para envíos con productos mixtos (locales + internacionales). */
  shippingMixedPolicy?: string;
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
  prefix?: string;
  documentNumber?: string;
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
  reservationExpiresAt?: string;
  reservationStatus?: 'active' | 'consumed' | 'released' | 'expired';
  /** Fecha mínima estimada de entrega congelada al crear el pedido (ISO date string ej. '2026-08-27'). */
  estimatedDeliveryMinDate?: string;
  /** Fecha máxima estimada de entrega congelada al crear el pedido (ISO date string ej. '2026-08-31'). */
  estimatedDeliveryMaxDate?: string;
  /** Etiqueta formateada de entrega congelada al crear el pedido. */
  estimatedDeliveryFormatted?: string;
}

export interface StockReservation {
  id: string;
  orderId: string;
  partId: string;
  partName?: string;
  partSku?: string;
  partImage?: string;
  orderDocumentNumber?: string;
  customerName?: string;
  paymentMethod?: string;
  quantity: number;
  status: 'active' | 'consumed' | 'released' | 'expired';
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  isExpired?: boolean;
  remainingSeconds?: number;
}

export interface InventoryReservationSettings {
  enabled: boolean;
  defaultTtlMinutes: number;
  paymentMethodTtl: Record<string, number>;
  expiryAction: 'cancel' | 'expire';
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
  prefix?: string;
  documentNumber?: string;
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

export interface BankAccount {
  id: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
  nit: string;
  instructions?: string;
  active: boolean;
  isDefault?: boolean;
}

export interface WompiConfig {
  enabled: boolean;
  environment: 'sandbox' | 'production';
  publicKey: string;
  privateKey: string;
  integritySecret: string;
  eventsSecret?: string;
}

export interface PaymentSettings {
  bankTransfer: {
    enabled: boolean;
    accounts: BankAccount[];
  };
  wompi: WompiConfig;
}

export type InventoryMovementType =
  | 'INITIAL_STOCK'
  | 'OUT_SALE'
  | 'IN_CANCEL'
  | 'IN_RETURN'
  | 'IN_PURCHASE'
  | 'OUT_DAMAGE'
  | 'OUT_INTERNAL'
  | 'ADJUST_IN'
  | 'ADJUST_OUT';

export type InventoryReferenceType =
  | 'order'
  | 'return'
  | 'manual_adjustment'
  | 'supplier_invoice'
  | 'initial_balance';

export interface InventoryMovement {
  id: string;
  partId: string;
  partName?: string;
  partSku?: string;
  partCategory?: string;
  partOemNumbers?: string[];
  movementType: InventoryMovementType;
  quantity: number;
  previousStock: number;
  resultingStock: number;
  unitCost: number;
  unitPrice: number;
  totalAmount: number;
  referenceType: InventoryReferenceType;
  referenceId?: string | null;
  referenceDocument?: string | null;
  notes: string;
  userId?: string | null;
  userName: string;
  createdAt: string;
}



