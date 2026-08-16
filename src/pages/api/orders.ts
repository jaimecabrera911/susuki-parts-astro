import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { orders, orderItems } from '../../db/schema';
import { eq, like, or, desc } from 'drizzle-orm';
import { upsertOrder } from '../../db/writers';

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const status = url.searchParams.get('status');
    const query = url.searchParams.get('q');

    let rawData;
    if (status) {
      rawData = await db.select().from(orders).where(eq(orders.status, status)).orderBy(desc(orders.date));
    } else if (query) {
      const q = `%${query}%`;
      rawData = await db.select().from(orders).where(
        or(
          like(orders.id, q),
          like(orders.customerName, q),
          like(orders.email, q),
          like(orders.documentId, q),
          like(orders.trackingNumber, q)
        )
      ).orderBy(desc(orders.date));
    } else {
      rawData = await db.select().from(orders).orderBy(desc(orders.date));
    }

    const itemsAll = await db.select().from(orderItems);
    const itemsByOrder = new Map<string, typeof itemsAll>();
    for (const it of itemsAll) {
      const arr = itemsByOrder.get(it.orderId) || [];
      arr.push(it);
      itemsByOrder.set(it.orderId, arr);
    }

    const formatted = rawData.map(o => ({
      ...o,
      motorcycle: o.motorcycle ?? null,
      items: (itemsByOrder.get(o.id) || []).map(it => ({
        part: it.part,
        quantity: it.quantity,
        motorcycle: it.motorcycle ?? null
      }))
    }));

    return new Response(JSON.stringify({ success: true, count: formatted.length, data: formatted }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en GET /api/orders:', error?.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const db = getDb();
    const data = await upsertOrder(db, body);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en POST /api/orders:', error?.message);
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
    if (!body.id) throw new Error('ID del pedido es requerido');

    const updatedFields = {
      status: body.status,
      paymentReference: body.paymentReference,
      trackingNumber: body.trackingNumber,
      shippingCarrier: body.shippingCarrier,
      trackingUrl: body.trackingUrl,
      notes: body.notes
    };

    await db.update(orders).set(updatedFields).where(eq(orders.id, body.id));

    return new Response(JSON.stringify({ success: true, message: `Pedido ${body.id} actualizado exitosamente` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en PUT /api/orders:', error?.message);
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

    await db.delete(orders).where(eq(orders.id, id));

    return new Response(JSON.stringify({ success: true, message: `Pedido ${id} eliminado` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en DELETE /api/orders:', error?.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
