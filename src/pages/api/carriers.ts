import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { carriers } from '../../db/schema';
import { upsertCarrier, seedCarriers } from '../../db/writers';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    let rows = await db.select().from(carriers).orderBy(carriers.order, carriers.name);

    // Auto-seed if empty — seeds the default carrier catalog into the DB
    if (!rows || rows.length === 0) {
      await seedCarriers(db);
      rows = await db.select().from(carriers).orderBy(carriers.order, carriers.name);
    }

    return new Response(JSON.stringify({ success: true, count: rows.length, data: rows }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en GET /api/carriers:', error?.message);
    return new Response(JSON.stringify({ success: false, count: 0, data: [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();
    if (!body.name) throw new Error('El nombre de la transportadora es requerido');
    const saved = await upsertCarrier(db, body);
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
    if (!body.id) throw new Error('ID de la transportadora es requerido');
    const saved = await upsertCarrier(db, body);
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
    await db.delete(carriers).where(eq(carriers.id, id));
    return new Response(JSON.stringify({ success: true, message: `Transportadora ${id} eliminada` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};