import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { orderReturns } from '../../db/schema';
import { eq, like, or, desc } from 'drizzle-orm';
import { upsertOrderReturn, deleteOrderReturn } from '../../db/writers';

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const status = url.searchParams.get('status');
    const orderId = url.searchParams.get('orderId');
    const query = url.searchParams.get('q');

    let data;
    if (orderId) {
      data = await db.select().from(orderReturns).where(eq(orderReturns.orderId, orderId)).orderBy(desc(orderReturns.createdAt));
    } else if (status) {
      data = await db.select().from(orderReturns).where(eq(orderReturns.status, status)).orderBy(desc(orderReturns.createdAt));
    } else if (query) {
      const q = `%${query}%`;
      data = await db.select().from(orderReturns).where(
        or(
          like(orderReturns.id, q),
          like(orderReturns.orderId, q),
          like(orderReturns.customerName, q),
          like(orderReturns.email, q),
          like(orderReturns.reason, q)
        )
      ).orderBy(desc(orderReturns.createdAt));
    } else {
      data = await db.select().from(orderReturns).orderBy(desc(orderReturns.createdAt));
    }

    return new Response(JSON.stringify({ success: true, count: data.length, data }), {
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
    if (!body.orderId || !body.customerName || !body.email || !body.reason) {
      throw new Error('Faltan datos obligatorios para registrar la devolución (orderId, customerName, email, reason)');
    }

    const data = await upsertOrderReturn(db, body);

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
    if (!body.id) throw new Error('ID de la devolución es requerido');

    const data = await upsertOrderReturn(db, body);

    return new Response(JSON.stringify({ success: true, message: `Devolución ${body.id} actualizada`, data }), {
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

    await deleteOrderReturn(db, id);

    return new Response(JSON.stringify({ success: true, message: `Devolución ${id} eliminada` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
