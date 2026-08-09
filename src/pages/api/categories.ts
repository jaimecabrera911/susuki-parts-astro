import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { categories, subcategories } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { DEFAULT_CATEGORIES } from '../../data/adminStore';

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    const catList = await db.select().from(categories);
    const subList = await db.select().from(subcategories);

    const result = catList.map(cat => ({
      ...cat,
      subcategories: subList.filter(sub => sub.categoryId === cat.id)
    }));

    const finalResult = (result && result.length > 0) ? result : DEFAULT_CATEGORIES;

    return new Response(JSON.stringify({ success: true, count: finalResult.length, data: finalResult }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
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
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
      iconName: body.iconName || 'Wrench',
      description: body.description || '',
      active: body.active !== undefined ? body.active : true,
      order: body.order || 99
    };

    await db.insert(categories).values(newCategory).onConflictDoUpdate({
      target: categories.id,
      set: newCategory
    });

    if (body.subcategories && Array.isArray(body.subcategories)) {
      for (const sub of body.subcategories) {
        await db.insert(subcategories).values({
          id: sub.id || `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          categoryId: newCategory.id,
          name: sub.name,
          slug: sub.slug || sub.name.toLowerCase().replace(/\s+/g, '-')
        }).onConflictDoNothing();
      }
    }

    return new Response(JSON.stringify({ success: true, data: newCategory }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
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
      slug: body.slug,
      iconName: body.iconName,
      description: body.description,
      active: body.active,
      order: body.order
    }).where(eq(categories.id, body.id));

    return new Response(JSON.stringify({ success: true, message: 'Categoría actualizada exitosamente' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
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

    await db.delete(subcategories).where(eq(subcategories.categoryId, id));
    await db.delete(categories).where(eq(categories.id, id));

    return new Response(JSON.stringify({ success: true, message: `Categoría ${id} eliminada` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
