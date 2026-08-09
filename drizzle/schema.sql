-- Official PostgreSQL DDL Schema Script for Neon DB (neondb)
-- Generated directly from src/db/schema.ts using Drizzle Kit for PostgreSQL

CREATE TABLE "brands" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"logo" text,
	"country" text,
	"active" boolean DEFAULT true NOT NULL,
	"description" text
);

CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"icon_name" text,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL
);

CREATE TABLE "model_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"version_name" text NOT NULL
);

CREATE TABLE "model_years" (
	"id" text PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"year" integer NOT NULL
);

CREATE TABLE "models" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"image" text NOT NULL,
	"years" text NOT NULL,
	"versions" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text
);

CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"part_id" text NOT NULL,
	"part_name" text NOT NULL,
	"oem_number" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" double precision NOT NULL,
	"line_total" double precision NOT NULL
);

CREATE TABLE "order_motorcycles" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"brand_name" text NOT NULL,
	"model_id" text,
	"model_name" text NOT NULL,
	"year" integer NOT NULL,
	"version" text
);

CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"customer_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"document_id" text NOT NULL,
	"city" text NOT NULL,
	"shipping_address" text NOT NULL,
	"postal_code" text NOT NULL,
	"items" text NOT NULL,
	"total_price" double precision NOT NULL,
	"motorcycle" text,
	"guarantee_code" text NOT NULL,
	"payment_method" text NOT NULL,
	"status" text NOT NULL,
	"payment_reference" text,
	"tracking_number" text,
	"shipping_carrier" text,
	"notes" text
);

CREATE TABLE "part_compatibilities" (
	"id" text PRIMARY KEY NOT NULL,
	"part_id" text NOT NULL,
	"model_id" text NOT NULL,
	"year_start" integer NOT NULL,
	"year_end" integer NOT NULL,
	"version" text,
	"note" text
);

CREATE TABLE "part_images" (
	"id" text PRIMARY KEY NOT NULL,
	"part_id" text NOT NULL,
	"image_url" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);

CREATE TABLE "part_oem_numbers" (
	"id" text PRIMARY KEY NOT NULL,
	"part_id" text NOT NULL,
	"oem_number" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);

CREATE TABLE "part_specs" (
	"id" text PRIMARY KEY NOT NULL,
	"part_id" text NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL
);

CREATE TABLE "parts" (
	"id" text PRIMARY KEY NOT NULL,
	"oem_numbers" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"price" double precision NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"image" text NOT NULL,
	"images" text,
	"description" text NOT NULL,
	"specs" text NOT NULL,
	"compatibility" text NOT NULL,
	"schematic_id" text,
	"diagram_hotspot" text,
	"availability" text DEFAULT 'in_stock' NOT NULL
);

CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"part_id" text NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"rating" integer NOT NULL,
	"title" text NOT NULL,
	"comment" text NOT NULL,
	"verified_purchase" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "schematic_applicable_models" (
	"id" text PRIMARY KEY NOT NULL,
	"schematic_id" text NOT NULL,
	"model_id" text NOT NULL
);

CREATE TABLE "schematic_hotspots" (
	"id" text PRIMARY KEY NOT NULL,
	"schematic_id" text NOT NULL,
	"part_id" text NOT NULL,
	"item_number" integer NOT NULL,
	"x" double precision NOT NULL,
	"y" double precision NOT NULL,
	"label" text NOT NULL
);

CREATE TABLE "schematics" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"section" text NOT NULL,
	"applicable_model_ids" text NOT NULL,
	"diagram_image" text NOT NULL,
	"description" text NOT NULL,
	"hotspots" text
);

CREATE TABLE "subcategories" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL
);

CREATE TABLE "user_favorites" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"part_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "user_garages" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"brand_id" text NOT NULL,
	"model_id" text NOT NULL,
	"model_name" text NOT NULL,
	"year" integer NOT NULL,
	"version" text NOT NULL,
	"vin" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"document_id" text NOT NULL,
	"city" text NOT NULL,
	"address" text NOT NULL,
	"postal_code" text NOT NULL,
	"favorite_part_ids" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"avatar_url" text,
	"role" text DEFAULT 'customer' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text
);

ALTER TABLE "model_versions" ADD CONSTRAINT "model_versions_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "model_years" ADD CONSTRAINT "model_years_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "models" ADD CONSTRAINT "models_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "order_motorcycles" ADD CONSTRAINT "order_motorcycles_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "part_compatibilities" ADD CONSTRAINT "part_compatibilities_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "part_compatibilities" ADD CONSTRAINT "part_compatibilities_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "part_images" ADD CONSTRAINT "part_images_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "part_oem_numbers" ADD CONSTRAINT "part_oem_numbers_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "part_specs" ADD CONSTRAINT "part_specs_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "schematic_applicable_models" ADD CONSTRAINT "schematic_applicable_models_schematic_id_schematics_id_fk" FOREIGN KEY ("schematic_id") REFERENCES "public"."schematics"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "schematic_applicable_models" ADD CONSTRAINT "schematic_applicable_models_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "schematic_hotspots" ADD CONSTRAINT "schematic_hotspots_schematic_id_schematics_id_fk" FOREIGN KEY ("schematic_id") REFERENCES "public"."schematics"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "schematic_hotspots" ADD CONSTRAINT "schematic_hotspots_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_garages" ADD CONSTRAINT "user_garages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_garages" ADD CONSTRAINT "user_garages_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;

CREATE INDEX "idx_model_versions_lookup" ON "model_versions" USING btree ("model_id");
CREATE INDEX "idx_model_years_lookup" ON "model_years" USING btree ("model_id","year");
CREATE INDEX "idx_models_brand_id" ON "models" USING btree ("brand_id");
CREATE INDEX "idx_models_active" ON "models" USING btree ("active");
CREATE INDEX "idx_order_items_order_id" ON "order_items" USING btree ("order_id");
CREATE INDEX "idx_order_items_part_id" ON "order_items" USING btree ("part_id");
CREATE INDEX "idx_order_moto_order_id" ON "order_motorcycles" USING btree ("order_id");
CREATE INDEX "idx_orders_email" ON "orders" USING btree ("email");
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");
CREATE INDEX "idx_orders_document_id" ON "orders" USING btree ("document_id");
CREATE INDEX "idx_part_compat_lookup" ON "part_compatibilities" USING btree ("part_id","model_id","year_start","year_end");
CREATE INDEX "idx_part_images_part_id" ON "part_images" USING btree ("part_id");
CREATE INDEX "idx_part_oem_lookup" ON "part_oem_numbers" USING btree ("oem_number");
CREATE INDEX "idx_part_oem_part_id" ON "part_oem_numbers" USING btree ("part_id");
CREATE INDEX "idx_part_specs_part_id" ON "part_specs" USING btree ("part_id");
CREATE INDEX "idx_part_specs_lookup" ON "part_specs" USING btree ("label","value");
CREATE INDEX "idx_parts_category" ON "parts" USING btree ("category");
CREATE INDEX "idx_parts_availability" ON "parts" USING btree ("availability");
CREATE INDEX "idx_parts_schematic_id" ON "parts" USING btree ("schematic_id");
CREATE INDEX "idx_reviews_part_id" ON "reviews" USING btree ("part_id");
CREATE INDEX "idx_reviews_user_id" ON "reviews" USING btree ("user_id");
CREATE INDEX "idx_schematic_models_lookup" ON "schematic_applicable_models" USING btree ("schematic_id","model_id");
CREATE INDEX "idx_hotspots_schematic" ON "schematic_hotspots" USING btree ("schematic_id");
CREATE INDEX "idx_hotspots_part" ON "schematic_hotspots" USING btree ("part_id");
CREATE INDEX "idx_schematics_section" ON "schematics" USING btree ("section");
CREATE INDEX "idx_subcategories_category_id" ON "subcategories" USING btree ("category_id");
CREATE INDEX "idx_user_favorites_user_part" ON "user_favorites" USING btree ("user_id","part_id");
CREATE INDEX "idx_user_garages_user_id" ON "user_garages" USING btree ("user_id");
CREATE INDEX "idx_user_garages_model_id" ON "user_garages" USING btree ("model_id");
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");
CREATE INDEX "idx_users_document_id" ON "users" USING btree ("document_id");
