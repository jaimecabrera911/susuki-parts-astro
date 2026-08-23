import { pgTable, text, integer, doublePrecision, boolean, timestamp, jsonb, index, uniqueIndex, uuid, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { STORE_DEFAULT_LOCATION } from '../utils/config';

// 1. Brands Table
export const brands = pgTable('brands', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug'),
  logo: text('logo'),
  country: text('country'),
  active: boolean('active').notNull().default(true),
  description: text('description')
});

// 1b. Model Categories Table (motorcycle category catalog for models)
export const modelCategories = pgTable('model_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug'),
  order: integer('order').notNull().default(0),
  active: boolean('active').notNull().default(true)
}, (table) => ({
  activeIdx: index('idx_model_categories_active').on(table.active),
  nameUniqueIdx: uniqueIndex('uq_model_categories_name').on(table.name)
}));

// 2. Models Table
export const models = pgTable('models', {
  id: uuid('id').defaultRandom().primaryKey(),
  brandId: uuid('brand_id').references(() => brands.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug'),
  category: text('category').notNull().references(() => modelCategories.name, { onDelete: 'restrict', onUpdate: 'cascade' }),
  image: text('image').notNull(),
  versions: text('versions').array().notNull(),
  active: boolean('active').notNull().default(true),
  notes: text('notes')
}, (table) => ({
  brandIdx: index('idx_models_brand_id').on(table.brandId),
  activeIdx: index('idx_models_active').on(table.active)
}));

// 2b. Model Years Table (3NF Normalized: UUID primary key)
export const modelYears = pgTable('model_years', {
  id: uuid('id').defaultRandom().primaryKey(),
  modelId: uuid('model_id').notNull().references(() => models.id, { onDelete: 'cascade' }),
  year: integer('year').notNull()
}, (table) => ({
  modelYearIdx: index('idx_model_years_lookup').on(table.modelId, table.year),
  uniqueModelYear: uniqueIndex('idx_model_years_unique').on(table.modelId, table.year)
}));

// 3. Categories Table (self-referential for subcategories)
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  iconName: text('icon_name'),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  order: integer('order').notNull().default(0),
  parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, { onDelete: 'cascade' })
}, (table) => ({
  parentIdx: index('idx_categories_parent_id').on(table.parentId),
  slugUniqueIdx: uniqueIndex('uq_categories_slug').on(table.slug)
}));

// 5. OEM Spare Parts Table
export const parts = pgTable('parts', {
  id: uuid('id').defaultRandom().primaryKey(),
  sku: text('sku').notNull().default(''),
  name: text('name').notNull(),
  category: text('category').notNull().references(() => categories.slug, { onDelete: 'restrict', onUpdate: 'cascade' }),
  price: doublePrecision('price').notNull(),
  cost: doublePrecision('cost').notNull().default(0),
  stock: integer('stock').notNull().default(0),
  stockReserved: integer('stock_reserved').notNull().default(0),
  image: text('image').notNull(),
  description: text('description').notNull(),
  specs: jsonb('specs').notNull(),
  schematicId: uuid('schematic_id').references(() => schematics.id, { onDelete: 'set null' }),
  diagramHotspot: jsonb('diagram_hotspot'),
  availability: text('availability').notNull().default('in_stock'),
  active: boolean('active').notNull().default(true),
  taxable: boolean('taxable').notNull().default(true),
  priceIncludesTax: boolean('price_includes_tax').notNull().default(false)
}, (table) => ({
  skuUniqueIdx: uniqueIndex('idx_parts_sku_unique').on(table.sku),
  categoryIdx: index('idx_parts_category').on(table.category),
  availabilityIdx: index('idx_parts_availability').on(table.availability),
  activeIdx: index('idx_parts_active').on(table.active),
  schematicIdx: index('idx_parts_schematic_id').on(table.schematicId)
}));

// 5b. OEM Part Numbers Table (3NF Normalized)
export const partOemNumbers = pgTable('part_oem_numbers', {
  id: uuid('id').defaultRandom().primaryKey(),
  partId: uuid('part_id').notNull().references(() => parts.id, { onDelete: 'cascade' }),
  oemNumber: text('oem_number').notNull(),
  isPrimary: boolean('is_primary').notNull().default(false),
  position: integer('position').notNull().default(0)
}, (table) => ({
  oemLookupIdx: index('idx_part_oem_lookup').on(table.oemNumber),
  partIdx: index('idx_part_oem_part_id').on(table.partId),
  uniquePartOem: uniqueIndex('idx_part_oem_unique').on(table.partId, table.oemNumber)
}));

// 5c. Part Images Table (3NF Normalized gallery)
export const partImages = pgTable('part_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  partId: uuid('part_id').notNull().references(() => parts.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  position: integer('position').notNull().default(0),
  isPrimary: boolean('is_primary').notNull().default(false)
}, (table) => ({
  partIdx: index('idx_part_images_part_id').on(table.partId),
  uniquePartPosition: uniqueIndex('idx_part_images_part_position').on(table.partId, table.position),
  uniquePartPrimary: uniqueIndex('idx_part_images_part_primary').on(table.partId).where(sql`${table.isPrimary} = true`)
}));

// 6d. Schematic Sections Table
export const schematicSections = pgTable('schematic_sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug'),
  order: integer('order').notNull().default(0),
  active: boolean('active').notNull().default(true)
}, (table) => ({
  activeIdx: index('idx_schematic_sections_active').on(table.active),
  nameUniqueIdx: uniqueIndex('uq_schematic_sections_name').on(table.name)
}));

// 6. Exploded Diagrams / Schematics Table
export const schematics = pgTable('schematics', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug'),
  category: text('category').notNull(),
  section: text('section').notNull().references(() => schematicSections.name, { onDelete: 'restrict', onUpdate: 'cascade' }),
  diagramImage: text('diagram_image').notNull(),
  description: text('description').notNull()
}, (table) => ({
  sectionIdx: index('idx_schematics_section').on(table.section)
}));

// 6b. Schematic Hotspots Table (3NF Normalized)
export const schematicHotspots = pgTable('schematic_hotspots', {
  id: uuid('id').defaultRandom().primaryKey(),
  schematicId: uuid('schematic_id').notNull().references(() => schematics.id, { onDelete: 'cascade' }),
  partId: uuid('part_id').references(() => parts.id, { onDelete: 'cascade' }),
  itemNumber: integer('item_number').notNull(),
  x: doublePrecision('x').notNull(),
  y: doublePrecision('y').notNull(),
  label: text('label').notNull()
}, (table) => ({
  schematicIdx: index('idx_hotspots_schematic').on(table.schematicId),
  partIdx: index('idx_hotspots_part').on(table.partId)
}));

// 6c. Schematic Applicable Models Table (3NF Normalized)
export const schematicApplicableModels = pgTable('schematic_applicable_models', {
  id: uuid('id').defaultRandom().primaryKey(),
  schematicId: uuid('schematic_id').notNull().references(() => schematics.id, { onDelete: 'cascade' }),
  modelId: uuid('model_id').notNull().references(() => models.id, { onDelete: 'cascade' })
}, (table) => ({
  schematicModelIdx: index('idx_schematic_models_lookup').on(table.schematicId, table.modelId),
  uniqueSchematicModel: uniqueIndex('idx_schematic_models_unique').on(table.schematicId, table.modelId)
}));

// 6e. Order Statuses Table (DB-driven catalog)
export const orderStatuses = pgTable('order_statuses', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull().default('slate'),
  short: text('short'),
  group: text('group'),
  is_default: boolean('is_default').notNull().default(false),
  order: integer('order').notNull().default(0),
  active: boolean('active').notNull().default(true)
}, (table) => ({
  activeIdx: index('idx_order_statuses_active').on(table.active),
  nameUniqueIdx: uniqueIndex('uq_order_statuses_name').on(table.name)
}));

// 6f. Shipping Carriers Table (DB-driven catalog)
export const carriers = pgTable('carriers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  is_default: boolean('is_default').notNull().default(false),
  order: integer('order').notNull().default(0),
  active: boolean('active').notNull().default(true)
}, (table) => ({
  activeIdx: index('idx_carriers_active').on(table.active),
  nameUniqueIdx: uniqueIndex('uq_carriers_name').on(table.name)
}));

// 7. Customer Orders Table
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: timestamp('date').defaultNow().notNull(),
  customerName: text('customer_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  documentId: text('document_id').notNull(),
  country: text('country').notNull().default(STORE_DEFAULT_LOCATION.country),
  department: text('department'),
  city: text('city').notNull(),
  shippingAddress: text('shipping_address').notNull(),
  postalCode: text('postal_code').notNull(),
  subtotal: doublePrecision('subtotal'),
  discount: doublePrecision('discount'),
  discountCode: text('discount_code'),
  taxRate: doublePrecision('tax_rate'),
  taxAmount: doublePrecision('tax_amount'),
  totalPrice: doublePrecision('total_price').notNull(),
  shippingCost: doublePrecision('shipping_cost').default(0),
  shippingMethodName: text('shipping_method_name'),
  motorcycle: jsonb('motorcycle'),
  guaranteeCode: text('guarantee_code').notNull(),
  paymentMethod: text('payment_method').notNull(),
  status: text('status').notNull().references(() => orderStatuses.name, { onDelete: 'restrict', onUpdate: 'cascade' }),
  paymentReference: text('payment_reference'),
  trackingNumber: text('tracking_number'),
  shippingCarrier: text('shipping_carrier').references(() => carriers.name, { onDelete: 'set null', onUpdate: 'cascade' }),
  trackingUrl: text('tracking_url'),
  notes: text('notes'),
  prefix: text('prefix').notNull().default('SZ-ORD'),
  documentNumber: text('document_number'),
  reservationExpiresAt: timestamp('reservation_expires_at'),
  reservationStatus: text('reservation_status').notNull().default('active') // 'active' | 'consumed' | 'released' | 'expired'
}, (table) => ({
  emailIdx: index('idx_orders_email').on(table.email),
  statusIdx: index('idx_orders_status').on(table.status),
  docIdx: index('idx_orders_document_id').on(table.documentId),
  reservationExpiresIdx: index('idx_orders_reservation_expires').on(table.reservationExpiresAt),
  reservationStatusIdx: index('idx_orders_reservation_status').on(table.reservationStatus)
}));

// 7b. Shipping Methods Table
export const shippingMethods = pgTable('shipping_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  carrier: text('carrier').notNull().default('Servientrega').references(() => carriers.name, { onDelete: 'restrict', onUpdate: 'cascade' }),
  description: text('description'),
  price: doublePrecision('price').notNull().default(0),
  estimatedDays: integer('estimated_days').notNull().default(3),
  dispatchDays: jsonb('dispatch_days').notNull().default(['1', '2', '3', '4', '5']), // 1=Mon, ..., 7=Sun
  freeShippingThreshold: doublePrecision('free_shipping_threshold'),
  dispatchCutoff: text('dispatch_cutoff'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  activeIdx: index('idx_shipping_methods_active').on(table.active)
}));

// 7b1. Shipping Zones Table
export const shippingZones = pgTable('shipping_zones', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  activeIdx: index('idx_shipping_zones_active').on(table.active)
}));

// 7b2. Shipping Zone ↔ States Mapping Table (3NF Normalized)
export const shippingZoneStates = pgTable('shipping_zone_states', {
  id: uuid('id').defaultRandom().primaryKey(),
  zoneId: uuid('zone_id').notNull().references(() => shippingZones.id, { onDelete: 'cascade' }),
  stateId: uuid('state_id').notNull().references(() => states.id, { onDelete: 'cascade' })
}, (table) => ({
  zoneIdx: index('idx_zone_states_zone_id').on(table.zoneId),
  stateIdx: index('idx_zone_states_state_id').on(table.stateId),
  uniqueZoneState: uniqueIndex('idx_zone_states_unique').on(table.zoneId, table.stateId)
}));

// 7b2b. Shipping Zone ↔ Cities Mapping Table (3NF Normalized)
export const shippingZoneCities = pgTable('shipping_zone_cities', {
  id: uuid('id').defaultRandom().primaryKey(),
  zoneId: uuid('zone_id').notNull().references(() => shippingZones.id, { onDelete: 'cascade' }),
  cityId: uuid('city_id').notNull().references(() => cities.id, { onDelete: 'cascade' })
}, (table) => ({
  zoneIdx: index('idx_zone_cities_zone_id').on(table.zoneId),
  cityIdx: index('idx_zone_cities_city_id').on(table.cityId),
  uniqueZoneCity: uniqueIndex('idx_zone_cities_unique').on(table.zoneId, table.cityId)
}));

// 7b3. Shipping Method ↔ Zone Rates Table (3NF Normalized)
export const shippingMethodZoneRates = pgTable('shipping_method_zone_rates', {
  id: uuid('id').defaultRandom().primaryKey(),
  methodId: uuid('method_id').notNull().references(() => shippingMethods.id, { onDelete: 'cascade' }),
  zoneId: uuid('zone_id').notNull().references(() => shippingZones.id, { onDelete: 'cascade' }),
  price: doublePrecision('price').notNull().default(0)
}, (table) => ({
  methodIdx: index('idx_method_zone_rates_method_id').on(table.methodId),
  zoneIdx: index('idx_method_zone_rates_zone_id').on(table.zoneId),
  uniqueMethodZone: uniqueIndex('idx_method_zone_rates_unique').on(table.methodId, table.zoneId)
}));

// 7c. Countries Table (3NF Normalized)
export const countries = pgTable('countries', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  code: text('code'),
  active: boolean('active').notNull().default(true)
}, (table) => ({
  activeIdx: index('idx_countries_active').on(table.active)
}));

// 7c2. States / Departments Table (3NF Normalized)
export const states = pgTable('states', {
  id: uuid('id').defaultRandom().primaryKey(),
  countryId: uuid('country_id').notNull().references(() => countries.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code'),
  active: boolean('active').notNull().default(true)
}, (table) => ({
  countryIdx: index('idx_states_country_id').on(table.countryId),
  activeIdx: index('idx_states_active').on(table.active)
}));

// 7c3. Cities Table (3NF Normalized)
export const cities = pgTable('cities', {
  id: uuid('id').defaultRandom().primaryKey(),
  stateId: uuid('state_id').notNull().references(() => states.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code'),
  active: boolean('active').notNull().default(true)
}, (table) => ({
  activeIdx: index('idx_cities_active').on(table.active),
  stateIdx: index('idx_cities_state_id').on(table.stateId)
}));

// 8. Users / Customers Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  documentId: text('document_id').notNull(),
  city: text('city').notNull(),
  address: text('address').notNull(),
  postalCode: text('postal_code').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull().default('customer'),
  active: boolean('active').notNull().default(true),
  notes: text('notes'),
  passwordHash: text('password_hash')
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  docIdx: index('idx_users_document_id').on(table.documentId)
}));

// 9. Customer Garages Table
export const userGarages = pgTable('user_garages', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  brandId: uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  modelId: uuid('model_id').notNull().references(() => models.id, { onDelete: 'cascade' }),
  modelName: text('model_name').notNull(),
  year: integer('year').notNull(),
  version: text('version').notNull(),
  vin: text('vin'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  userIdx: index('idx_user_garages_user_id').on(table.userId),
  modelIdx: index('idx_user_garages_model_id').on(table.modelId)
}));

// 10. Customer Favorites Table
export const userFavorites = pgTable('user_favorites', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  partId: uuid('part_id').notNull().references(() => parts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  userPartIdx: index('idx_user_favorites_user_part').on(table.userId, table.partId),
  uniqueUserFavorite: uniqueIndex('idx_user_favorites_unique').on(table.userId, table.partId)
}));

// 11. Product Reviews Table
export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  partId: uuid('part_id').notNull().references(() => parts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  userName: text('user_name').notNull(),
  rating: integer('rating').notNull(),
  title: text('title').notNull(),
  comment: text('comment').notNull(),
  verifiedPurchase: boolean('verified_purchase').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  partIdx: index('idx_reviews_part_id').on(table.partId),
  userIdx: index('idx_reviews_user_id').on(table.userId)
}));

// 12. Direct Part Compatibility Table (3NF Normalized)
export const partCompatibilities = pgTable('part_compatibilities', {
  id: uuid('id').defaultRandom().primaryKey(),
  partId: uuid('part_id').notNull().references(() => parts.id, { onDelete: 'cascade' }),
  modelId: uuid('model_id').notNull().references(() => models.id, { onDelete: 'cascade' }),
  yearStart: integer('year_start'),
  yearEnd: integer('year_end'),
  version: text('version'),
  note: text('note')
}, (table) => ({
  lookupIdx: index('idx_part_compat_lookup').on(table.partId, table.modelId, table.yearStart, table.yearEnd)
}));

// 13. Order Line Items Table (3NF Normalized)
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  partId: uuid('part_id').references(() => parts.id, { onDelete: 'set null' }),
  part: jsonb('part').notNull(), // snapshot of the part at purchase time
  quantity: integer('quantity').notNull(),
  unitPrice: doublePrecision('unit_price').notNull(),
  lineTotal: doublePrecision('line_total').notNull(),
  motorcycle: jsonb('motorcycle') // snapshot of the item-level motorcycle
}, (table) => ({
  orderIdx: index('idx_order_items_order_id').on(table.orderId),
  partIdx: index('idx_order_items_part_id').on(table.partId)
}));

// 14. Order Returns & Guarantees Table (RMA)
export const orderReturns = pgTable('order_returns', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  customerName: text('customer_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  documentId: text('document_id'),
  reason: text('reason').notNull(),
  resolutionType: text('resolution_type').notNull().default('refund'), // 'refund' | 'exchange' | 'store_credit'
  isPreDispatchCancel: boolean('is_pre_dispatch_cancel').notNull().default(false),
  isUnpaidCancel: boolean('is_unpaid_cancel').notNull().default(false),
  replacementPartId: uuid('replacement_part_id').references(() => parts.id, { onDelete: 'set null' }),
  storeCreditCode: text('store_credit_code'),
  status: text('status').notNull().default('Pendiente'),
  refundAmount: doublePrecision('refund_amount').default(0),
  refundMethod: text('refund_method'),
  refundReference: text('refund_reference'),
  returnCarrier: text('return_carrier'),
  returnTrackingNumber: text('return_tracking_number'),
  restockInventory: boolean('restock_inventory').notNull().default(false),
  qcStatus: text('qc_status').notNull().default('pending'), // 'pending' | 'passed' | 'failed'
  qcNotes: text('qc_notes'),
  bonusAmount: doublePrecision('bonus_amount').default(0),
  evidencePhotos: jsonb('evidence_photos').notNull().default([]),
  itemDetailsJson: jsonb('item_details_json').notNull().default([]),
  itemsJson: jsonb('items_json').notNull().default([]),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  prefix: text('prefix').notNull().default('SZ-RET'),
  documentNumber: text('document_number')
}, (table) => ({
  orderIdx: index('idx_order_returns_order_id').on(table.orderId),
  emailIdx: index('idx_order_returns_email').on(table.email),
  statusIdx: index('idx_order_returns_status').on(table.status)
}));

// 15. Site / Store Settings Table (Modular Key-Value Architecture)
export const siteSettings = pgTable('site_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull(),
  value: jsonb('value').notNull(),
  category: text('category').notNull().default('general'),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  categoryIdx: index('idx_site_settings_category').on(table.category),
  keyUniqueIdx: uniqueIndex('idx_site_settings_key_unique').on(table.key)
}));

// 16. Coupons / Discount Codes Table
export const coupons = pgTable('coupons', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  type: text('type').notNull().default('percentage'), // 'percentage' | 'fixed'
  value: doublePrecision('value').notNull().default(0),
  minPurchase: doublePrecision('min_purchase').notNull().default(0),
  maxUses: integer('max_uses'),           // null = unlimited
  usedCount: integer('used_count').notNull().default(0),
  expiresAt: timestamp('expires_at'),     // null = no expiry
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  activeIdx: index('idx_coupons_active').on(table.active)
}));

// 17. User Dashboard Permissions Table (3NF Normalized)
export const userPermissions = pgTable('user_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  module: text('module').notNull(),
  canRead: boolean('can_read').notNull().default(true),
  canWrite: boolean('can_write').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userIdx: index('idx_user_permissions_user_id').on(table.userId),
  userModuleUnique: uniqueIndex('idx_user_permissions_user_module_unique').on(table.userId, table.module)
}));

// 18. Roles & Permission Groups Table (3NF Normalized)
export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  isSystem: boolean('is_system').notNull().default(false),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  slugUniqueIdx: uniqueIndex('idx_roles_slug_unique').on(table.slug),
  activeIdx: index('idx_roles_active').on(table.active)
}));

// 19. Role Permissions Table (3NF Normalized)
export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  module: text('module').notNull(),
  canRead: boolean('can_read').notNull().default(true),
  canWrite: boolean('can_write').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  roleIdx: index('idx_role_permissions_role_id').on(table.roleId),
  roleModuleUnique: uniqueIndex('idx_role_permissions_role_module_unique').on(table.roleId, table.module)
}));

// 20. Inventory Movements / Kardex Table (3NF Normalized Transactional Ledger)
export const inventoryMovements = pgTable('inventory_movements', {
  id: uuid('id').defaultRandom().primaryKey(),
  partId: uuid('part_id').notNull().references(() => parts.id, { onDelete: 'cascade' }),
  movementType: text('movement_type').notNull(), // 'INITIAL_STOCK', 'OUT_SALE', 'IN_CANCEL', 'IN_RETURN', 'IN_PURCHASE', 'OUT_DAMAGE', 'OUT_INTERNAL', 'ADJUST_IN', 'ADJUST_OUT'
  quantity: integer('quantity').notNull(), // positive for IN, negative for OUT
  previousStock: integer('previous_stock').notNull().default(0),
  resultingStock: integer('resulting_stock').notNull().default(0),
  unitCost: doublePrecision('unit_cost').notNull().default(0),
  unitPrice: doublePrecision('unit_price').notNull().default(0),
  totalAmount: doublePrecision('total_amount').notNull().default(0),
  referenceType: text('reference_type').notNull().default('manual_adjustment'), // 'order', 'return', 'manual_adjustment', 'supplier_invoice', 'initial_balance'
  referenceId: text('reference_id'),
  referenceDocument: text('reference_document'), // e.g. SZ-ORD-123456, SZ-RET-FF2961E9
  notes: text('notes').notNull().default(''),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  userName: text('user_name').notNull().default('Sistema'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  partIdx: index('idx_inventory_movements_part_id').on(table.partId),
  movementTypeIdx: index('idx_inventory_movements_type').on(table.movementType),
  referenceIdx: index('idx_inventory_movements_reference').on(table.referenceType, table.referenceId),
  createdAtIdx: index('idx_inventory_movements_created_at').on(table.createdAt)
}));

// 21. Temporary Stock Reservations Table (ACID Controlled Inventory Locking)
export const stockReservations = pgTable('stock_reservations', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  partId: uuid('part_id').notNull().references(() => parts.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  status: text('status').notNull().default('active'), // 'active' | 'consumed' | 'released' | 'expired'
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  orderIdx: index('idx_stock_reservations_order_id').on(table.orderId),
  partIdx: index('idx_stock_reservations_part_id').on(table.partId),
  statusIdx: index('idx_stock_reservations_status').on(table.status),
  expiresIdx: index('idx_stock_reservations_expires_at').on(table.expiresAt)
}));



