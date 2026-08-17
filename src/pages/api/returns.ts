import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { orderReturns, orders } from '../../db/schema';
import { eq, like, or, desc, inArray } from 'drizzle-orm';
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

    const orderIds = Array.from(new Set(data.map((r) => r.orderId).filter(Boolean)));
    const ordersRows = orderIds.length
      ? await db.select({ id: orders.id, prefix: orders.prefix, documentNumber: orders.documentNumber }).from(orders).where(inArray(orders.id, orderIds))
      : [];
    const orderByOrderId = new Map(ordersRows.map((o) => [o.id, o]));

    const enriched = data.map((r) => {
      const order = r.orderId ? orderByOrderId.get(r.orderId) : undefined;
      return {
        ...r,
        orderPrefix: order?.prefix ?? null,
        orderDocumentNumber: order?.documentNumber ?? null,
      };
    });

    return new Response(JSON.stringify({ success: true, count: data.length, data: enriched }), {
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

    // Check if order exists and validate return window if orderDate is passed
    if (body.orderDate) {
      const orderTime = new Date(body.orderDate).getTime();
      if (!isNaN(orderTime)) {
        const daysDiff = (Date.now() - orderTime) / (1000 * 60 * 60 * 24);
        const maxDays = Number(body.maxDaysAllowed || 30);
        if (daysDiff > maxDays) {
          throw new Error(`El período máximo para solicitar una devolución (${maxDays} días) ha expirado para este pedido.`);
        }
      }
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
