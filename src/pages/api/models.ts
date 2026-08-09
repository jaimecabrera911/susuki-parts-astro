import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { models } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { INITIAL_ADMIN_MODELS } from '../../data/adminStore';

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const brandId = url.searchParams.get('brandId');

    let data;
    if (brandId) {
      data = await db.select().from(models).where(eq(models.brandId, brandId));
    } else {
      data = await db.select().from(models);
    }

    let formatted = (data && data.length > 0)
      ? data.map(m => ({
          ...m,
          years: typeof m.years === 'string' ? JSON.parse(m.years || '[]') : m.years,
          versions: typeof m.versions === 'string' ? JSON.parse(m.versions || '[]') : m.versions
        }))
      : (brandId ? INITIAL_ADMIN_MODELS.filter(m => m.brandId === brandId) : INITIAL_ADMIN_MODELS);

    return new Response(JSON.stringify({ success: true, count: formatted.length, data: formatted }), {
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
    const newModel = {
      id: body.id || `model-${Date.now()}`,
      brandId: body.brandId || 'suzuki',
      name: body.name,
      category: body.category,
      image: body.image,
      years: JSON.stringify(body.years || []),
      versions: JSON.stringify(body.versions || []),
      active: body.active !== undefined ? body.active : true,
      notes: body.notes || ''
    };
    await db.insert(models).values(newModel).onConflictDoUpdate({
      target: models.id,
      set: newModel
    });
    return new Response(JSON.stringify({ success: true, data: newModel }), {
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
    if (!body.id) throw new Error('ID del modelo es requerido');

    await db.update(models).set({
      brandId: body.brandId,
      name: body.name,
      category: body.category,
      image: body.image,
      years: JSON.stringify(body.years || []),
      versions: JSON.stringify(body.versions || []),
      active: body.active,
      notes: body.notes
    }).where(eq(models.id, body.id));

    return new Response(JSON.stringify({ success: true, message: 'Modelo actualizado exitosamente' }), {
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

    await db.delete(models).where(eq(models.id, id));
    return new Response(JSON.stringify({ success: true, message: `Modelo ${id} eliminado` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
