-- Official PostgreSQL DDL Schema Script for Neon DB (neondb)
-- Generated from src/db/schema.ts using Drizzle Kit for PostgreSQL
-- Matches the live Neon database (17 tables, 3NF normalized, jsonb/text[] native columns)

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
	"order" integer DEFAULT 0 NOT NULL,
	"parent_id" text
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
	"versions" text[] NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text
);
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"part_id" text,
	"part" jsonb NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" double precision NOT NULL,
	"line_total" double precision NOT NULL,
	"motorcycle" jsonb
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
	"total_price" double precision NOT NULL,
	"motorcycle" jsonb,
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
	"year_start" integer,
	"year_end" integer,
	"version" text,
	"note" text
);
CREATE TABLE "part_oem_numbers" (
	"id" text PRIMARY KEY NOT NULL,
	"part_id" text NOT NULL,
	"oem_number" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
CREATE TABLE "parts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"price" double precision NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"image" text NOT NULL,
	"images" jsonb,
	"description" text NOT NULL,
	"specs" jsonb NOT NULL,
	"schematic_id" text,
	"diagram_hotspot" jsonb,
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
	"part_id" text,
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
	"diagram_image" text NOT NULL,
	"description" text NOT NULL
);
CREATE TABLE "schematic_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
CREATE TABLE "order_statuses" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT 'slate' NOT NULL,
	"short" text,
	"group" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
CREATE TABLE "carriers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	"avatar_url" text,
	"role" text DEFAULT 'customer' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text
);
ALTER TABLE "model_years" ADD CONSTRAINT "model_years_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action
ALTER TABLE "models" ADD CONSTRAINT "models_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action
ALTER TABLE "part_compatibilities" ADD CONSTRAINT "part_compatibilities_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action
ALTER TABLE "part_compatibilities" ADD CONSTRAINT "part_compatibilities_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action
ALTER TABLE "part_oem_numbers" ADD CONSTRAINT "part_oem_numbers_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
ALTER TABLE "schematic_applicable_models" ADD CONSTRAINT "schematic_applicable_models_schematic_id_schematics_id_fk" FOREIGN KEY ("schematic_id") REFERENCES "public"."schematics"("id") ON DELETE cascade ON UPDATE no action
ALTER TABLE "schematic_applicable_models" ADD CONSTRAINT "schematic_applicable_models_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action
ALTER TABLE "schematic_hotspots" ADD CONSTRAINT "schematic_hotspots_schematic_id_schematics_id_fk" FOREIGN KEY ("schematic_id") REFERENCES "public"."schematics"("id") ON DELETE cascade ON UPDATE no action
ALTER TABLE "schematic_hotspots" ADD CONSTRAINT "schematic_hotspots_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action
ALTER TABLE "user_garages" ADD CONSTRAINT "user_garages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
ALTER TABLE "user_garages" ADD CONSTRAINT "user_garages_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action
ALTER TABLE "user_garages" ADD CONSTRAINT "user_garages_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action
CREATE INDEX "idx_model_years_lookup" ON "model_years" USING btree ("model_id","year")
CREATE UNIQUE INDEX "idx_model_years_unique" ON "model_years" USING btree ("model_id","year")
CREATE INDEX "idx_models_brand_id" ON "models" USING btree ("brand_id")
CREATE INDEX "idx_models_active" ON "models" USING btree ("active")
CREATE INDEX "idx_order_items_order_id" ON "order_items" USING btree ("order_id")
CREATE INDEX "idx_order_items_part_id" ON "order_items" USING btree ("part_id")
CREATE INDEX "idx_orders_email" ON "orders" USING btree ("email")
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status")
CREATE INDEX "idx_orders_document_id" ON "orders" USING btree ("document_id")
CREATE INDEX "idx_part_compat_lookup" ON "part_compatibilities" USING btree ("part_id","model_id","year_start","year_end")
CREATE INDEX "idx_part_oem_lookup" ON "part_oem_numbers" USING btree ("oem_number")
CREATE INDEX "idx_part_oem_part_id" ON "part_oem_numbers" USING btree ("part_id")
CREATE UNIQUE INDEX "idx_part_oem_unique" ON "part_oem_numbers" USING btree ("part_id","oem_number")
CREATE INDEX "idx_parts_category" ON "parts" USING btree ("category")
CREATE INDEX "idx_parts_availability" ON "parts" USING btree ("availability")
CREATE INDEX "idx_parts_schematic_id" ON "parts" USING btree ("schematic_id")
CREATE INDEX "idx_reviews_part_id" ON "reviews" USING btree ("part_id")
CREATE INDEX "idx_reviews_user_id" ON "reviews" USING btree ("user_id")
CREATE INDEX "idx_schematic_models_lookup" ON "schematic_applicable_models" USING btree ("schematic_id","model_id")
CREATE UNIQUE INDEX "idx_schematic_models_unique" ON "schematic_applicable_models" USING btree ("schematic_id","model_id")
CREATE INDEX "idx_hotspots_schematic" ON "schematic_hotspots" USING btree ("schematic_id")
CREATE INDEX "idx_hotspots_part" ON "schematic_hotspots" USING btree ("part_id")
CREATE INDEX "idx_schematics_section" ON "schematics" USING btree ("section")
CREATE INDEX "idx_schematic_sections_active" ON "schematic_sections" USING btree ("active")
CREATE INDEX "idx_order_statuses_active" ON "order_statuses" USING btree ("active")
CREATE INDEX "idx_carriers_active" ON "carriers" USING btree ("active")
CREATE INDEX "idx_categories_parent_id" ON "categories" USING btree ("parent_id")
CREATE INDEX "idx_user_favorites_user_part" ON "user_favorites" USING btree ("user_id","part_id")
CREATE UNIQUE INDEX "idx_user_favorites_unique" ON "user_favorites" USING btree ("user_id","part_id")
CREATE INDEX "idx_user_garages_user_id" ON "user_garages" USING btree ("user_id")
CREATE INDEX "idx_user_garages_model_id" ON "user_garages" USING btree ("model_id")
CREATE INDEX "idx_users_email" ON "users" USING btree ("email")
CREATE INDEX "idx_users_document_id" ON "users" USING btree ("document_id");
