import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { orderStatuses } from '../../db/schema';
import { upsertOrderStatus, seedOrderStatuses } from '../../db/writers';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    let rows = await db.select().from(orderStatuses).orderBy(orderStatuses.order, orderStatuses.name);

    // Auto-seed if empty — seeds the default status catalog into the DB
    if (!rows || rows.length === 0) {
      await seedOrderStatuses(db);
      rows = await db.select().from(orderStatuses).orderBy(orderStatuses.order, orderStatuses.name);
    }

    return new Response(JSON.stringify({ success: true, count: rows.length, data: rows }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en GET /api/order-statuses:', error?.message);
    return new Response(JSON.stringify({ success: false, count: 0, data: [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();
    if (!body.name) throw new Error('El nombre del estado es requerido');
    const saved = await upsertOrderStatus(db, body);
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
    if (!body.id) throw new Error('ID del estado es requerido');
    const saved = await upsertOrderStatus(db, body);
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
    await db.delete(orderStatuses).where(eq(orderStatuses.id, id));
    return new Response(JSON.stringify({ success: true, message: `Estado ${id} eliminado` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};