import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { modelCategories } from '../../db/schema';
import { upsertModelCategory, seedModelCategories } from '../../db/writers';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    let rows = await db.select().from(modelCategories).orderBy(modelCategories.order, modelCategories.name);

    // Auto-seed if empty — seeds the default model category catalog into the DB
    if (!rows || rows.length === 0) {
      await seedModelCategories(db);
      rows = await db.select().from(modelCategories).orderBy(modelCategories.order, modelCategories.name);
    }

    return new Response(JSON.stringify({ success: true, count: rows.length, data: rows }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en GET /api/model-categories:', error?.message);
    return new Response(JSON.stringify({ success: false, count: 0, data: [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();
    if (!body.name) throw new Error('El nombre de la categoría es requerido');
    const saved = await upsertModelCategory(db, body);
    return new Response(JSON.stringify({ success: true, data: saved }), {
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
    const saved = await upsertModelCategory(db, body);
    return new Response(JSON.stringify({ success: true, data: saved }), {
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
    await db.delete(modelCategories).where(eq(modelCategories.id, id));
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