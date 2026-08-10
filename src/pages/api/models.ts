import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { models, modelYears } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { upsertModel } from '../../db/writers';

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const brandId = url.searchParams.get('brandId');

    const data = brandId
      ? await db.select().from(models).where(eq(models.brandId, brandId))
      : await db.select().from(models);

    const allYears = await db.select().from(modelYears);
    const yearsByModel = new Map<string, number[]>();
    for (const r of allYears) {
      const arr = yearsByModel.get(r.modelId) || [];
      arr.push(r.year);
      yearsByModel.set(r.modelId, arr);
    }

    const formatted = data.map(m => ({
      ...m,
      years: (yearsByModel.get(m.id) || []).sort((a, b) => a - b),
      versions: m.versions
    }));

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
    const data = await upsertModel(db, body);

    return new Response(JSON.stringify({ success: true, data }), {
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

    await upsertModel(db, body);

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
