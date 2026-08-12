import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { categories } from '../../db/schema';
import { eq } from 'drizzle-orm';

const makeSlug = (name: string) => (name || '').toLowerCase().replace(/\s+/g, '-');

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    const catList = await db.select().from(categories).orderBy(categories.order, categories.name);

    const nodeById = new Map<string, any>();
    for (const cat of catList) {
      nodeById.set(cat.id, { ...cat, subcategories: [] });
    }

    const roots: any[] = [];
    for (const node of nodeById.values()) {
      if (node.parentId && nodeById.has(node.parentId)) {
        nodeById.get(node.parentId).subcategories.push(node);
      } else {
        roots.push(node);
      }
    }

    return new Response(JSON.stringify({ success: true, count: roots.length, data: roots }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en GET /api/categories:', error?.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();

    const newCategory = {
      id: body.id || `cat-${Date.now()}`,
      name: body.name,
      slug: body.slug || makeSlug(body.name),
      iconName: body.iconName || (body.parentId ? null : 'Wrench'),
      description: body.description || '',
      active: body.active !== undefined ? body.active : true,
      order: body.order ?? 99,
      parentId: body.parentId || null
    };

    await db.insert(categories).values(newCategory).onConflictDoUpdate({
      target: categories.id,
      set: newCategory
    });

    if (body.subcategories && Array.isArray(body.subcategories)) {
      for (let i = 0; i < body.subcategories.length; i++) {
        const sub = body.subcategories[i];
        if (!sub) continue;
        await db.insert(categories).values({
          id: sub.id || `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: sub.name,
          slug: sub.slug || makeSlug(sub.name),
          iconName: null,
          description: sub.description || '',
          active: sub.active !== undefined ? sub.active : true,
          order: sub.order ?? i,
          parentId: newCategory.id
        }).onConflictDoUpdate({
          target: categories.id,
          set: {
            name: sub.name,
            slug: sub.slug || makeSlug(sub.name),
            description: sub.description || '',
            active: sub.active !== undefined ? sub.active : true,
            parentId: newCategory.id
          }
        });
      }
    }

    return new Response(JSON.stringify({ success: true, data: newCategory }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en POST /api/categories:', error?.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();
    if (!body.id) throw new Error('ID de la categoría es requerido');

    await db.update(categories).set({
      name: body.name,
      slug: body.slug ?? makeSlug(body.name),
      iconName: body.iconName ?? null,
      description: body.description ?? '',
      active: body.active !== undefined ? body.active : true,
      order: body.order ?? 99,
      parentId: body.parentId ?? null
    }).where(eq(categories.id, body.id));

    // Replace children (subcategories) so removals / toggles persist
    await db.delete(categories).where(eq(categories.parentId, body.id));
    if (body.subcategories && Array.isArray(body.subcategories)) {
      for (let i = 0; i < body.subcategories.length; i++) {
        const sub = body.subcategories[i];
        if (!sub) continue;
        await db.insert(categories).values({
          id: sub.id || `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: sub.name,
          slug: sub.slug || makeSlug(sub.name),
          iconName: null,
          description: sub.description || '',
          active: sub.active !== undefined ? sub.active : true,
          order: sub.order ?? i,
          parentId: body.id
        }).onConflictDoUpdate({
          target: categories.id,
          set: {
            name: sub.name,
            slug: sub.slug || makeSlug(sub.name),
            description: sub.description || '',
            active: sub.active !== undefined ? sub.active : true,
            parentId: body.id
          }
        });
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Categoría actualizada exitosamente' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en PUT /api/categories:', error?.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const id = url.searchParams.get('id');
    if (!id) throw new Error('Parámetro "id" es requerido');

    // Children are removed via ON DELETE CASCADE on parent_id
    await db.delete(categories).where(eq(categories.id, id));

    return new Response(JSON.stringify({ success: true, message: `Categoría ${id} eliminada` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en DELETE /api/categories:', error?.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};