import { pgTable, text, integer, doublePrecision, boolean, timestamp, jsonb, index, uniqueIndex, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { STORE_DEFAULT_LOCATION } from '../utils/config';

// 1. Brands Table
export const brands = pgTable('brands', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  logo: text('logo'),
  country: text('country'),
  active: boolean('active').notNull().default(true),
  description: text('description')
});

// 2. Models Table
export const models = pgTable('models', {
  id: text('id').primaryKey(),
  brandId: text('brand_id').references(() => brands.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category').notNull(),
  image: text('image').notNull(),
  versions: text('versions').array().notNull(),
  active: boolean('active').notNull().default(true),
  notes: text('notes')
}, (table) => ({
  brandIdx: index('idx_models_brand_id').on(table.brandId),
  activeIdx: index('idx_models_active').on(table.active)
}));

// 2b. Model Years Table (3NF Normalized)
export const modelYears = pgTable('model_years', {
  id: text('id').primaryKey(),
  modelId: text('model_id').notNull().references(() => models.id, { onDelete: 'cascade' }),
  year: integer('year').notNull()
}, (table) => ({
  modelYearIdx: index('idx_model_years_lookup').on(table.modelId, table.year),
  uniqueModelYear: uniqueIndex('idx_model_years_unique').on(table.modelId, table.year)
}));

// 3. Categories Table (self-referential for subcategories)
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  iconName: text('icon_name'),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  order: integer('order').notNull().default(0),
  parentId: text('parent_id').references((): AnyPgColumn => categories.id, { onDelete: 'cascade' })
}, (table) => ({
  parentIdx: index('idx_categories_parent_id').on(table.parentId)
}));

// 3b. Model Categories Table (motorcycle category catalog for models)
export const modelCategories = pgTable('model_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  order: integer('order').notNull().default(0),
  active: boolean('active').notNull().default(true)
}, (table) => ({
  activeIdx: index('idx_model_categories_active').on(table.active)
}));

// 5. OEM Spare Parts Table
export const parts = pgTable('parts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: doublePrecision('price').notNull(),
  stock: integer('stock').notNull().default(0),
  image: text('image').notNull(),
  images: jsonb('images'),
  description: text('description').notNull(),
  specs: jsonb('specs').notNull(),
  schematicId: text('schematic_id'),
  diagramHotspot: jsonb('diagram_hotspot'),
  availability: text('availability').notNull().default('in_stock'),
  taxable: boolean('taxable').notNull().default(true),
  priceIncludesTax: boolean('price_includes_tax').notNull().default(false)
}, (table) => ({
  categoryIdx: index('idx_parts_category').on(table.category),
  availabilityIdx: index('idx_parts_availability').on(table.availability),
  schematicIdx: index('idx_parts_schematic_id').on(table.schematicId)
}));

// 5b. OEM Part Numbers Table (3NF Normalized)
export const partOemNumbers = pgTable('part_oem_numbers', {
  id: text('id').primaryKey(),
  partId: text('part_id').notNull().references(() => parts.id, { onDelete: 'cascade' }),
  oemNumber: text('oem_number').notNull(),
  isPrimary: boolean('is_primary').notNull().default(false),
  position: integer('position').notNull().default(0)
}, (table) => ({
  oemLookupIdx: index('idx_part_oem_lookup').on(table.oemNumber),
  partIdx: index('idx_part_oem_part_id').on(table.partId),
  uniquePartOem: uniqueIndex('idx_part_oem_unique').on(table.partId, table.oemNumber)
}));

// 6. Exploded Diagrams / Schematics Table
export const schematics = pgTable('schematics', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  section: text('section').notNull(),
  diagramImage: text('diagram_image').notNull(),
  description: text('description').notNull()
}, (table) => ({
  sectionIdx: index('idx_schematics_section').on(table.section)
}));

// 6b. Schematic Hotspots Table (3NF Normalized)
export const schematicHotspots = pgTable('schematic_hotspots', {
  id: text('id').primaryKey(),
  schematicId: text('schematic_id').notNull().references(() => schematics.id, { onDelete: 'cascade' }),
  partId: text('part_id').references(() => parts.id, { onDelete: 'cascade' }),
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
  id: text('id').primaryKey(),
  schematicId: text('schematic_id').notNull().references(() => schematics.id, { onDelete: 'cascade' }),
  modelId: text('model_id').notNull().references(() => models.id, { onDelete: 'cascade' })
}, (table) => ({
  schematicModelIdx: index('idx_schematic_models_lookup').on(table.schematicId, table.modelId),
  uniqueSchematicModel: uniqueIndex('idx_schematic_models_unique').on(table.schematicId, table.modelId)
}));

// 6d. Schematic Sections Table (technical section options, DB-driven)
export const schematicSections = pgTable('schematic_sections', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  order: integer('order').notNull().default(0),
  active: boolean('active').notNull().default(true)
}, (table) => ({
  activeIdx: index('idx_schematic_sections_active').on(table.active)
}));

// 6e. Order Statuses Table (DB-driven catalog; color = theme key for the status badge,
// short = concise badge label, group = aggregation bucket for counters, is_default = new-order default)
export const orderStatuses = pgTable('order_statuses', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull().default('slate'),
  short: text('short'),
  group: text('group'),
  is_default: boolean('is_default').notNull().default(false),
  order: integer('order').notNull().default(0),
  active: boolean('active').notNull().default(true)
}, (table) => ({
  activeIdx: index('idx_order_statuses_active').on(table.active)
}));

// 6f. Shipping Carriers Table (DB-driven catalog of courier companies; is_default = fallback carrier)
export const carriers = pgTable('carriers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  is_default: boolean('is_default').notNull().default(false),
  order: integer('order').notNull().default(0),
  active: boolean('active').notNull().default(true)
}, (table) => ({
  activeIdx: index('idx_carriers_active').on(table.active)
}));

// 7. Customer Orders Table
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
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
  status: text('status').notNull(),
  paymentReference: text('payment_reference'),
  trackingNumber: text('tracking_number'),
  shippingCarrier: text('shipping_carrier'),
  notes: text('notes')
}, (table) => ({
  emailIdx: index('idx_orders_email').on(table.email),
  statusIdx: index('idx_orders_status').on(table.status),
  docIdx: index('idx_orders_document_id').on(table.documentId)
}));

// 7b. Shipping Methods Table
export const shippingMethods = pgTable('shipping_methods', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  carrier: text('carrier').notNull().default('Servientrega'),
  description: text('description'),
  price: doublePrecision('price').notNull().default(0),
  estimatedDays: integer('estimated_days').notNull().default(3),
  dispatchDays: jsonb('dispatch_days').notNull().default(['1', '2', '3', '4', '5']), // 1=Mon, ..., 7=Sun
  freeShippingThreshold: doublePrecision('free_shipping_threshold'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  activeIdx: index('idx_shipping_methods_active').on(table.active)
}));

// 7b1. Shipping Zones Table
export const shippingZones = pgTable('shipping_zones', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  activeIdx: index('idx_shipping_zones_active').on(table.active)
}));

// 7b2. Shipping Zone ↔ States Mapping Table (3NF Normalized)
export const shippingZoneStates = pgTable('shipping_zone_states', {
  id: text('id').primaryKey(),
  zoneId: text('zone_id').notNull().references(() => shippingZones.id, { onDelete: 'cascade' }),
  stateId: text('state_id').notNull().references(() => states.id, { onDelete: 'cascade' })
}, (table) => ({
  zoneIdx: index('idx_zone_states_zone_id').on(table.zoneId),
  stateIdx: index('idx_zone_states_state_id').on(table.stateId),
  uniqueZoneState: uniqueIndex('idx_zone_states_unique').on(table.zoneId, table.stateId)
}));

// 7b3. Shipping Method ↔ Zone Rates Table (3NF Normalized)
export const shippingMethodZoneRates = pgTable('shipping_method_zone_rates', {
  id: text('id').primaryKey(),
  methodId: text('method_id').notNull().references(() => shippingMethods.id, { onDelete: 'cascade' }),
  zoneId: text('zone_id').notNull().references(() => shippingZones.id, { onDelete: 'cascade' }),
  price: doublePrecision('price').notNull().default(0)
}, (table) => ({
  methodIdx: index('idx_method_zone_rates_method_id').on(table.methodId),
  zoneIdx: index('idx_method_zone_rates_zone_id').on(table.zoneId),
  uniqueMethodZone: uniqueIndex('idx_method_zone_rates_unique').on(table.methodId, table.zoneId)
}));

// 7c. Countries Table (3NF Normalized)
export const countries = pgTable('countries', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code'),
  active: boolean('active').notNull().default(true)
}, (table) => ({
  activeIdx: index('idx_countries_active').on(table.active)
}));

// 7c2. States / Departments Table (3NF Normalized)
export const states = pgTable('states', {
  id: text('id').primaryKey(),
  countryId: text('country_id').notNull().references(() => countries.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code'),
  active: boolean('active').notNull().default(true)
}, (table) => ({
  countryIdx: index('idx_states_country_id').on(table.countryId),
  activeIdx: index('idx_states_active').on(table.active)
}));

// 7c3. Cities Table (3NF Normalized)
export const cities = pgTable('cities', {
  id: text('id').primaryKey(),
  stateId: text('state_id').notNull().references(() => states.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code'),
  active: boolean('active').notNull().default(true)
}, (table) => ({
  activeIdx: index('idx_cities_active').on(table.active),
  stateIdx: index('idx_cities_state_id').on(table.stateId)
}));

// 8. Users / Customers Table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
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
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  brandId: text('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  modelId: text('model_id').notNull().references(() => models.id, { onDelete: 'cascade' }),
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
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  partId: text('part_id').notNull().references(() => parts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  userPartIdx: index('idx_user_favorites_user_part').on(table.userId, table.partId),
  uniqueUserFavorite: uniqueIndex('idx_user_favorites_unique').on(table.userId, table.partId)
}));

// 11. Product Reviews Table
export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  partId: text('part_id').notNull().references(() => parts.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
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
  id: text('id').primaryKey(),
  partId: text('part_id').notNull().references(() => parts.id, { onDelete: 'cascade' }),
  modelId: text('model_id').notNull().references(() => models.id, { onDelete: 'cascade' }),
  yearStart: integer('year_start'),
  yearEnd: integer('year_end'),
  version: text('version'),
  note: text('note')
}, (table) => ({
  lookupIdx: index('idx_part_compat_lookup').on(table.partId, table.modelId, table.yearStart, table.yearEnd)
}));

// 13. Order Line Items Table (3NF Normalized)
export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  partId: text('part_id'),
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
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  customerName: text('customer_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  documentId: text('document_id'),
  reason: text('reason').notNull(),
  resolutionType: text('resolution_type').notNull().default('refund'), // 'refund' | 'exchange' | 'store_credit'
  isPreDispatchCancel: boolean('is_pre_dispatch_cancel').notNull().default(false),
  isUnpaidCancel: boolean('is_unpaid_cancel').notNull().default(false),
  replacementPartId: text('replacement_part_id'),
  storeCreditCode: text('store_credit_code'),
  status: text('status').notNull().default('Pendiente'),
  refundAmount: doublePrecision('refund_amount').default(0),
  refundMethod: text('refund_method'),
  refundReference: text('refund_reference'),
  returnCarrier: text('return_carrier'),
  returnTrackingNumber: text('return_tracking_number'),
  restockInventory: boolean('restock_inventory').notNull().default(false),
  itemsJson: jsonb('items_json').notNull().default([]),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  orderIdx: index('idx_order_returns_order_id').on(table.orderId),
  emailIdx: index('idx_order_returns_email').on(table.email),
  statusIdx: index('idx_order_returns_status').on(table.status)
}));

// 15. Site / Store Settings Table
export const siteSettings = pgTable('site_settings', {
  id: text('id').primaryKey().default('default'),
  taxName: text('tax_name').notNull().default('IVA Colombia'),
  taxRate: doublePrecision('tax_rate').notNull().default(19),
  taxActive: boolean('tax_active').notNull().default(true),
  returnMaxDays: integer('return_max_days').notNull().default(30),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

