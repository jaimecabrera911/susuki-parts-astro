import { pgTable, text, integer, doublePrecision, boolean, timestamp, index } from 'drizzle-orm/pg-core';

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
  brandId: text('brand_id').references(() => brands.id),
  name: text('name').notNull(),
  category: text('category').notNull(),
  image: text('image').notNull(),
  years: text('years').notNull(), // JSON fallback
  versions: text('versions').notNull(), // JSON fallback
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
  modelYearIdx: index('idx_model_years_lookup').on(table.modelId, table.year)
}));

// 2c. Model Versions Table (3NF Normalized)
export const modelVersions = pgTable('model_versions', {
  id: text('id').primaryKey(),
  modelId: text('model_id').notNull().references(() => models.id, { onDelete: 'cascade' }),
  versionName: text('version_name').notNull()
}, (table) => ({
  modelVersionIdx: index('idx_model_versions_lookup').on(table.modelId)
}));

// 3. Categories Table
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  iconName: text('icon_name'),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  order: integer('order').notNull().default(0)
});

// 4. Subcategories Table
export const subcategories = pgTable('subcategories', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').notNull().references(() => categories.id),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  active: boolean('active').notNull().default(true)
}, (table) => ({
  categoryIdx: index('idx_subcategories_category_id').on(table.categoryId)
}));

// 5. OEM Spare Parts Table
export const parts = pgTable('parts', {
  id: text('id').primaryKey(),
  oemNumbers: text('oem_numbers').notNull(), // JSON fallback
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: doublePrecision('price').notNull(),
  stock: integer('stock').notNull().default(0),
  image: text('image').notNull(),
  images: text('images'), // JSON fallback
  description: text('description').notNull(),
  specs: text('specs').notNull(), // JSON fallback
  compatibility: text('compatibility').notNull(), // JSON fallback
  schematicId: text('schematic_id'),
  diagramHotspot: text('diagram_hotspot'), // JSON fallback
  availability: text('availability').notNull().default('in_stock')
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
  isPrimary: boolean('is_primary').notNull().default(false)
}, (table) => ({
  oemLookupIdx: index('idx_part_oem_lookup').on(table.oemNumber),
  partIdx: index('idx_part_oem_part_id').on(table.partId)
}));

// 5c. OEM Part Technical Specs Table (3NF Normalized)
export const partSpecs = pgTable('part_specs', {
  id: text('id').primaryKey(),
  partId: text('part_id').notNull().references(() => parts.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  value: text('value').notNull()
}, (table) => ({
  partIdx: index('idx_part_specs_part_id').on(table.partId),
  labelValIdx: index('idx_part_specs_lookup').on(table.label, table.value)
}));

// 5d. OEM Part Gallery Images Table (3NF Normalized)
export const partImages = pgTable('part_images', {
  id: text('id').primaryKey(),
  partId: text('part_id').notNull().references(() => parts.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  displayOrder: integer('display_order').notNull().default(0)
}, (table) => ({
  partIdx: index('idx_part_images_part_id').on(table.partId)
}));

// 6. Exploded Diagrams / Schematics Table
export const schematics = pgTable('schematics', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  section: text('section').notNull(),
  applicableModelIds: text('applicable_model_ids').notNull(), // JSON fallback
  diagramImage: text('diagram_image').notNull(),
  description: text('description').notNull(),
  hotspots: text('hotspots') // JSON fallback
}, (table) => ({
  sectionIdx: index('idx_schematics_section').on(table.section)
}));

// 6b. Schematic Hotspots Table (3NF Normalized)
export const schematicHotspots = pgTable('schematic_hotspots', {
  id: text('id').primaryKey(),
  schematicId: text('schematic_id').notNull().references(() => schematics.id, { onDelete: 'cascade' }),
  partId: text('part_id').notNull().references(() => parts.id, { onDelete: 'cascade' }),
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
  schematicModelIdx: index('idx_schematic_models_lookup').on(table.schematicId, table.modelId)
}));

// 7. Customer Orders Table
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  date: timestamp('date').defaultNow().notNull(),
  customerName: text('customer_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  documentId: text('document_id').notNull(),
  city: text('city').notNull(),
  shippingAddress: text('shipping_address').notNull(),
  postalCode: text('postal_code').notNull(),
  items: text('items').notNull(), // JSON fallback
  totalPrice: doublePrecision('total_price').notNull(),
  motorcycle: text('motorcycle'), // JSON fallback
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

// 7b. Order Motorcycle Details Table (3NF Normalized)
export const orderMotorcycles = pgTable('order_motorcycles', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  brandName: text('brand_name').notNull(),
  modelId: text('model_id'),
  modelName: text('model_name').notNull(),
  year: integer('year').notNull(),
  version: text('version')
}, (table) => ({
  orderIdx: index('idx_order_moto_order_id').on(table.orderId)
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
  favoritePartIds: text('favorite_part_ids').notNull().default('[]'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull().default('customer'),
  active: boolean('active').notNull().default(true),
  notes: text('notes')
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  docIdx: index('idx_users_document_id').on(table.documentId)
}));

// 9. Customer Garages Table
export const userGarages = pgTable('user_garages', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  brandId: text('brand_id').notNull(),
  modelId: text('model_id').notNull().references(() => models.id),
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
  userId: text('user_id').notNull().references(() => users.id),
  partId: text('part_id').notNull().references(() => parts.id),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  userPartIdx: index('idx_user_favorites_user_part').on(table.userId, table.partId)
}));

// 11. Product Reviews Table
export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  partId: text('part_id').notNull().references(() => parts.id),
  userId: text('user_id').notNull().references(() => users.id),
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

// 12. Direct Part Compatibility Table
export const partCompatibilities = pgTable('part_compatibilities', {
  id: text('id').primaryKey(),
  partId: text('part_id').notNull().references(() => parts.id),
  modelId: text('model_id').notNull().references(() => models.id),
  yearStart: integer('year_start').notNull(),
  yearEnd: integer('year_end').notNull(),
  version: text('version'),
  note: text('note')
}, (table) => ({
  lookupIdx: index('idx_part_compat_lookup').on(table.partId, table.modelId, table.yearStart, table.yearEnd)
}));

// 13. Order Line Items Table
export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  partId: text('part_id').notNull().references(() => parts.id),
  partName: text('part_name').notNull(),
  oemNumber: text('oem_number').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: doublePrecision('unit_price').notNull(),
  lineTotal: doublePrecision('line_total').notNull()
}, (table) => ({
  orderIdx: index('idx_order_items_order_id').on(table.orderId),
  partIdx: index('idx_order_items_part_id').on(table.partId)
}));
