-- ============================================================================
-- Official PostgreSQL DDL Schema Script for Neon DB (neondb)
-- Direct Inline Foreign Keys (FK) & Normalization (3NF)
-- ============================================================================

-- 1. Tenants / Tiendas
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" text NOT NULL UNIQUE,
    "name" text NOT NULL,
    "domain" text,
    "subdomain" text UNIQUE,
    "logo" text,
    "is_default" boolean NOT NULL DEFAULT false,
    "active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- 2. Brands / Marcas
CREATE TABLE IF NOT EXISTS "brands" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "slug" text,
    "logo" text,
    "country" text,
    "active" boolean NOT NULL DEFAULT true,
    "description" text
);

-- 3. Categories / Categorías
CREATE TABLE IF NOT EXISTS "categories" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "icon_name" text,
    "description" text,
    "active" boolean NOT NULL DEFAULT true,
    "order" integer NOT NULL DEFAULT 0,
    "parent_id" uuid REFERENCES "categories"("id") ON DELETE CASCADE
);

-- 4. Model Categories / Categorías de Modelos
CREATE TABLE IF NOT EXISTS "model_categories" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL UNIQUE,
    "slug" text,
    "order" integer NOT NULL DEFAULT 0,
    "active" boolean NOT NULL DEFAULT true
);

-- 5. Models / Modelos de Motos
CREATE TABLE IF NOT EXISTS "models" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "brand_id" uuid REFERENCES "brands"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "slug" text,
    "category" text NOT NULL REFERENCES "model_categories"("name") ON UPDATE CASCADE ON DELETE RESTRICT,
    "image" text NOT NULL,
    "versions" text[] NOT NULL,
    "active" boolean NOT NULL DEFAULT true,
    "notes" text
);

-- 6. Model Years / Años de Producción
CREATE TABLE IF NOT EXISTS "model_years" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "model_id" uuid NOT NULL REFERENCES "models"("id") ON DELETE CASCADE,
    "year" integer NOT NULL
);

-- 7. Schematic Sections / Secciones de Despiece
CREATE TABLE IF NOT EXISTS "schematic_sections" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL UNIQUE,
    "slug" text,
    "order" integer NOT NULL DEFAULT 0,
    "active" boolean NOT NULL DEFAULT true
);

-- 8. Schematics / Despieces
CREATE TABLE IF NOT EXISTS "schematics" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" text NOT NULL,
    "slug" text,
    "category" text NOT NULL,
    "section" text NOT NULL REFERENCES "schematic_sections"("name") ON UPDATE CASCADE ON DELETE RESTRICT,
    "diagram_image" text NOT NULL,
    "description" text NOT NULL
);

-- 9. Schematic Applicable Models (Relación Despiece <-> Moto)
CREATE TABLE IF NOT EXISTS "schematic_applicable_models" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "schematic_id" uuid NOT NULL REFERENCES "schematics"("id") ON DELETE CASCADE,
    "model_id" uuid NOT NULL REFERENCES "models"("id") ON DELETE CASCADE
);

-- 10. Spare Parts / Repuestos
CREATE TABLE IF NOT EXISTS "parts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "sku" text NOT NULL DEFAULT '',
    "name" text NOT NULL,
    "category" text NOT NULL REFERENCES "categories"("slug") ON UPDATE CASCADE ON DELETE RESTRICT,
    "price" double precision NOT NULL,
    "stock" integer NOT NULL DEFAULT 0,
    "image" text NOT NULL,
    "description" text NOT NULL,
    "specs" jsonb NOT NULL,
    "schematic_id" uuid REFERENCES "schematics"("id") ON DELETE SET NULL,
    "diagram_hotspot" jsonb,
    "availability" text NOT NULL DEFAULT 'in_stock',
    "taxable" boolean NOT NULL DEFAULT true,
    "price_includes_tax" boolean NOT NULL DEFAULT false
);

-- 11. Schematic Hotspots (Pines interactivos sobre el plano)
CREATE TABLE IF NOT EXISTS "schematic_hotspots" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "schematic_id" uuid NOT NULL REFERENCES "schematics"("id") ON DELETE CASCADE,
    "part_id" uuid REFERENCES "parts"("id") ON DELETE CASCADE,
    "item_number" integer NOT NULL,
    "x" double precision NOT NULL,
    "y" double precision NOT NULL,
    "label" text NOT NULL
);

-- 12. OEM Numbers / Números de Parte
CREATE TABLE IF NOT EXISTS "part_oem_numbers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "part_id" uuid NOT NULL REFERENCES "parts"("id") ON DELETE CASCADE,
    "oem_number" text NOT NULL,
    "is_primary" boolean NOT NULL DEFAULT false,
    "position" integer NOT NULL DEFAULT 0
);

-- 13. Part Images / Galería de Fotos
CREATE TABLE IF NOT EXISTS "part_images" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "part_id" uuid NOT NULL REFERENCES "parts"("id") ON DELETE CASCADE,
    "url" text NOT NULL,
    "position" integer NOT NULL DEFAULT 0,
    "is_primary" boolean NOT NULL DEFAULT false
);

-- 14. Part Compatibilities (Compatibilidad Repuesto <-> Moto)
CREATE TABLE IF NOT EXISTS "part_compatibilities" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "part_id" uuid NOT NULL REFERENCES "parts"("id") ON DELETE CASCADE,
    "model_id" uuid NOT NULL REFERENCES "models"("id") ON DELETE CASCADE,
    "year_start" integer,
    "year_end" integer,
    "version" text,
    "note" text
);

-- 15. Users / Clientes y Administradores
CREATE TABLE IF NOT EXISTS "users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "full_name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "phone" text NOT NULL,
    "document_id" text NOT NULL,
    "city" text NOT NULL,
    "address" text NOT NULL,
    "postal_code" text NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "avatar_url" text,
    "role" text NOT NULL DEFAULT 'customer',
    "active" boolean NOT NULL DEFAULT true,
    "notes" text,
    "password_hash" text
);

-- 16. User Garages / Garaje de Motos del Cliente
CREATE TABLE IF NOT EXISTS "user_garages" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "brand_id" uuid NOT NULL REFERENCES "brands"("id") ON DELETE CASCADE,
    "model_id" uuid NOT NULL REFERENCES "models"("id") ON DELETE CASCADE,
    "model_name" text NOT NULL,
    "year" integer NOT NULL,
    "version" text NOT NULL,
    "vin" text,
    "is_default" boolean NOT NULL DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now()
);

-- 17. User Favorites / Repuestos Favoritos
CREATE TABLE IF NOT EXISTS "user_favorites" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "part_id" uuid NOT NULL REFERENCES "parts"("id") ON DELETE CASCADE,
    "created_at" timestamp NOT NULL DEFAULT now()
);

-- 18. Product Reviews / Calificaciones
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "part_id" uuid NOT NULL REFERENCES "parts"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "user_name" text NOT NULL,
    "rating" integer NOT NULL,
    "title" text NOT NULL,
    "comment" text NOT NULL,
    "verified_purchase" boolean NOT NULL DEFAULT true,
    "created_at" timestamp NOT NULL DEFAULT now()
);

-- 19. Order Statuses Catalog
CREATE TABLE IF NOT EXISTS "order_statuses" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL UNIQUE,
    "color" text NOT NULL DEFAULT 'slate',
    "short" text,
    "group" text,
    "is_default" boolean NOT NULL DEFAULT false,
    "order" integer NOT NULL DEFAULT 0,
    "active" boolean NOT NULL DEFAULT true
);

-- 20. Shipping Carriers Catalog
CREATE TABLE IF NOT EXISTS "carriers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL UNIQUE,
    "is_default" boolean NOT NULL DEFAULT false,
    "order" integer NOT NULL DEFAULT 0,
    "active" boolean NOT NULL DEFAULT true
);

-- 21. Orders / Pedidos
CREATE TABLE IF NOT EXISTS "orders" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "date" timestamp NOT NULL DEFAULT now(),
    "customer_name" text NOT NULL,
    "email" text NOT NULL,
    "phone" text NOT NULL,
    "document_id" text NOT NULL,
    "country" text NOT NULL DEFAULT 'Colombia',
    "department" text,
    "city" text NOT NULL,
    "shipping_address" text NOT NULL,
    "postal_code" text NOT NULL,
    "subtotal" double precision,
    "discount" double precision,
    "discount_code" text,
    "tax_rate" double precision,
    "tax_amount" double precision,
    "total_price" double precision NOT NULL,
    "shipping_cost" double precision DEFAULT 0,
    "shipping_method_name" text,
    "motorcycle" jsonb,
    "guarantee_code" text NOT NULL,
    "payment_method" text NOT NULL,
    "status" text NOT NULL REFERENCES "order_statuses"("name") ON UPDATE CASCADE ON DELETE RESTRICT,
    "payment_reference" text,
    "tracking_number" text,
    "shipping_carrier" text REFERENCES "carriers"("name") ON UPDATE CASCADE ON DELETE SET NULL,
    "tracking_url" text,
    "notes" text,
    "prefix" text NOT NULL DEFAULT 'SZ-ORD',
    "document_number" text
);

-- 22. Order Items / Líneas de Pedido
CREATE TABLE IF NOT EXISTS "order_items" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "part_id" uuid REFERENCES "parts"("id") ON DELETE SET NULL,
    "part" jsonb NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" double precision NOT NULL,
    "line_total" double precision NOT NULL,
    "motorcycle" jsonb
);

-- 23. Order Returns / Devoluciones y Garantías (RMA)
CREATE TABLE IF NOT EXISTS "order_returns" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "customer_name" text NOT NULL,
    "email" text NOT NULL,
    "phone" text NOT NULL,
    "document_id" text,
    "reason" text NOT NULL,
    "resolution_type" text NOT NULL DEFAULT 'refund',
    "is_pre_dispatch_cancel" boolean NOT NULL DEFAULT false,
    "is_unpaid_cancel" boolean NOT NULL DEFAULT false,
    "replacement_part_id" uuid REFERENCES "parts"("id") ON DELETE SET NULL,
    "store_credit_code" text,
    "status" text NOT NULL DEFAULT 'Pendiente',
    "refund_amount" double precision DEFAULT 0,
    "refund_method" text,
    "refund_reference" text,
    "return_carrier" text,
    "return_tracking_number" text,
    "restock_inventory" boolean NOT NULL DEFAULT false,
    "qc_status" text NOT NULL DEFAULT 'pending',
    "qc_notes" text,
    "bonus_amount" double precision DEFAULT 0,
    "evidence_photos" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "item_details_json" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "items_json" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "notes" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    "prefix" text NOT NULL DEFAULT 'SZ-RET',
    "document_number" text
);

-- 24. Shipping Zones / Zonas de Envío
CREATE TABLE IF NOT EXISTS "shipping_zones" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "description" text,
    "active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp NOT NULL DEFAULT now()
);

-- 25. Shipping Methods / Métodos de Envío
CREATE TABLE IF NOT EXISTS "shipping_methods" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "carrier" text NOT NULL DEFAULT 'Servientrega' REFERENCES "carriers"("name") ON UPDATE CASCADE ON DELETE RESTRICT,
    "description" text,
    "price" double precision NOT NULL DEFAULT 0,
    "estimated_days" integer NOT NULL DEFAULT 3,
    "dispatch_days" jsonb NOT NULL DEFAULT '["1","2","3","4","5"]'::jsonb,
    "free_shipping_threshold" double precision,
    "dispatch_cutoff" text,
    "active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp NOT NULL DEFAULT now()
);

-- 26. Countries / Países
CREATE TABLE IF NOT EXISTS "countries" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "code" text,
    "active" boolean NOT NULL DEFAULT true
);

-- 27. States / Departamentos
CREATE TABLE IF NOT EXISTS "states" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "country_id" uuid NOT NULL REFERENCES "countries"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "code" text,
    "active" boolean NOT NULL DEFAULT true
);

-- 28. Cities / Ciudades
CREATE TABLE IF NOT EXISTS "cities" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "state_id" uuid NOT NULL REFERENCES "states"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "code" text,
    "active" boolean NOT NULL DEFAULT true
);

-- 29. Shipping Zone States
CREATE TABLE IF NOT EXISTS "shipping_zone_states" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "zone_id" uuid NOT NULL REFERENCES "shipping_zones"("id") ON DELETE CASCADE,
    "state_id" uuid NOT NULL REFERENCES "states"("id") ON DELETE CASCADE
);

-- 30. Shipping Method Zone Rates
CREATE TABLE IF NOT EXISTS "shipping_method_zone_rates" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "method_id" uuid NOT NULL REFERENCES "shipping_methods"("id") ON DELETE CASCADE,
    "zone_id" uuid NOT NULL REFERENCES "shipping_zones"("id") ON DELETE CASCADE,
    "price" double precision NOT NULL DEFAULT 0
);

-- 31. Coupons / Cupones
CREATE TABLE IF NOT EXISTS "coupons" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "code" text NOT NULL UNIQUE,
    "type" text NOT NULL DEFAULT 'percentage',
    "value" double precision NOT NULL DEFAULT 0,
    "min_purchase" double precision NOT NULL DEFAULT 0,
    "max_uses" integer,
    "used_count" integer NOT NULL DEFAULT 0,
    "expires_at" timestamp,
    "active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- 32. Site Settings
CREATE TABLE IF NOT EXISTS "site_settings" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "key" text NOT NULL UNIQUE,
    "value" jsonb NOT NULL,
    "category" text NOT NULL DEFAULT 'general',
    "description" text,
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- ============================================================================
-- PERFORMANCE INDEXES (B-Tree)
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_models_brand_id" ON "models" ("brand_id");
CREATE INDEX IF NOT EXISTS "idx_model_years_lookup" ON "model_years" ("model_id", "year");
CREATE INDEX IF NOT EXISTS "idx_categories_parent_id" ON "categories" ("parent_id");
CREATE INDEX IF NOT EXISTS "idx_parts_schematic_id" ON "parts" ("schematic_id");
CREATE INDEX IF NOT EXISTS "idx_part_oem_lookup" ON "part_oem_numbers" ("oem_number");
CREATE INDEX IF NOT EXISTS "idx_part_oem_part_id" ON "part_oem_numbers" ("part_id");
CREATE INDEX IF NOT EXISTS "idx_part_images_part_id" ON "part_images" ("part_id");
CREATE INDEX IF NOT EXISTS "idx_part_compat_lookup" ON "part_compatibilities" ("part_id", "model_id");
CREATE INDEX IF NOT EXISTS "idx_schematic_models_lookup" ON "schematic_applicable_models" ("schematic_id", "model_id");
CREATE INDEX IF NOT EXISTS "idx_hotspots_schematic" ON "schematic_hotspots" ("schematic_id");
CREATE INDEX IF NOT EXISTS "idx_hotspots_part" ON "schematic_hotspots" ("part_id");
CREATE INDEX IF NOT EXISTS "idx_user_garages_user_id" ON "user_garages" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_garages_model_id" ON "user_garages" ("model_id");
CREATE INDEX IF NOT EXISTS "idx_user_favorites_user_part" ON "user_favorites" ("user_id", "part_id");
CREATE INDEX IF NOT EXISTS "idx_order_items_order_id" ON "order_items" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_order_returns_order_id" ON "order_returns" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_states_country_id" ON "states" ("country_id");
CREATE INDEX IF NOT EXISTS "idx_cities_state_id" ON "cities" ("state_id");
