import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { brands, categories, subcategories } from '../../db/schema';
import { DEFAULT_BRANDS, INITIAL_ADMIN_MODELS, DEFAULT_CATEGORIES, INITIAL_ADMIN_PARTS, INITIAL_ADMIN_SCHEMATICS, DEFAULT_ORDERS, DEFAULT_USERS } from '../../data/adminStore';
import { upsertModel, upsertPart, upsertSchematic, upsertOrder, upsertUser } from '../../db/writers';

export const POST: APIRoute = async () => {
  try {
    const db = getDb();

    // 1. Brands
    for (const b of DEFAULT_BRANDS) {
      await db.insert(brands).values({
        id: b.id,
        name: b.name,
        logo: b.logo || null,
        country: b.country || 'Japón',
        active: b.active !== undefined ? b.active : true,
        description: b.description || ''
      }).onConflictDoUpdate({
        target: brands.id,
        set: { name: b.name, active: b.active }
      });
    }

    // 2. Categories & Subcategories
    for (const c of DEFAULT_CATEGORIES) {
      await db.insert(categories).values({
        id: c.id,
        name: c.name,
        slug: c.slug,
        iconName: c.iconName || 'Wrench',
        description: c.description || '',
        active: c.active !== undefined ? c.active : true,
        order: c.order || 0
      }).onConflictDoUpdate({
        target: categories.id,
        set: { name: c.name }
      });

      if (c.subcategories) {
        for (const sub of c.subcategories) {
          await db.insert(subcategories).values({
            id: sub.id,
            categoryId: c.id,
            name: sub.name,
            slug: sub.slug,
            description: sub.description || '',
            active: sub.active !== undefined ? sub.active : true
          }).onConflictDoUpdate({
            target: subcategories.id,
            set: { name: sub.name }
          });
        }
      }
    }

    // 3. Models (+ model_years)
    for (const m of INITIAL_ADMIN_MODELS) {
      await upsertModel(db, m);
    }

    // 4. Parts (+ part_oem_numbers, part_compatibilities)
    for (const p of INITIAL_ADMIN_PARTS) {
      await upsertPart(db, p);
    }

    // 5. Schematics (+ schematic_hotspots, schematic_applicable_models)
    for (const s of INITIAL_ADMIN_SCHEMATICS) {
      await upsertSchematic(db, s);
    }

    // 6. Orders (+ order_items)
    for (const o of DEFAULT_ORDERS) {
      await upsertOrder(db, o);
    }

    // 7. Users (+ user_favorites)
    for (const u of DEFAULT_USERS) {
      await upsertUser(db, u);
    }

    return new Response(JSON.stringify({ success: true, message: 'Base de datos sembrada con datos normalizados.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
