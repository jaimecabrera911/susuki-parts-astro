import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { orders, orderItems } from '../../db/schema';
import { eq, ilike, or, and, desc, sql } from 'drizzle-orm';
import { upsertOrder } from '../../db/writers';

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const status = url.searchParams.get('status');
    const email = url.searchParams.get('email');
    const query = url.searchParams.get('q');

    const conditions: any[] = [];
    if (status) conditions.push(eq(orders.status, status));
    if (email) conditions.push(ilike(orders.email, email.trim()));
    if (query) {
      const q = `%${query.trim()}%`;
      conditions.push(
        or(
          sql`${orders.id}::text ILIKE ${q}`,
          ilike(orders.customerName, q),
          ilike(orders.email, q),
          ilike(orders.documentId, q),
          ilike(orders.trackingNumber, q),
          ilike(orders.prefix, q),
          ilike(orders.documentNumber, q),
          sql`(${orders.prefix} || '-' || COALESCE(${orders.documentNumber}, UPPER(SUBSTRING(${orders.id}::text, 1, 8)))) ILIKE ${q}`
        )
      );
    }

    const rawData = conditions.length > 0
      ? await db.select().from(orders).where(and(...conditions)).orderBy(desc(orders.date))
      : await db.select().from(orders).orderBy(desc(orders.date));

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

    // If body has items or is a full order object, use upsertOrder which handles ACID transitions
    if (Array.isArray(body.items) && body.items.length > 0) {
      const data = await upsertOrder(db, body);
      return new Response(JSON.stringify({ success: true, message: `Pedido ${body.id} actualizado exitosamente`, data }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const currentOrders = await db.select().from(orders).where(eq(orders.id, body.id)).limit(1);
    if (currentOrders.length === 0) throw new Error(`Pedido ${body.id} no encontrado`);
    const currentOrder = currentOrders[0];

    const { isPaidOrderStatus, isCancelOrderStatus } = await import('../../types');

    const updatedFields: any = {};
    if (body.status !== undefined) updatedFields.status = body.status;
    if (body.paymentReference !== undefined) updatedFields.paymentReference = body.paymentReference;
    if (body.trackingNumber !== undefined) updatedFields.trackingNumber = body.trackingNumber;
    if (body.shippingCarrier !== undefined) updatedFields.shippingCarrier = body.shippingCarrier;
    if (body.trackingUrl !== undefined) updatedFields.trackingUrl = body.trackingUrl;
    if (body.notes !== undefined) updatedFields.notes = body.notes;

    await db.transaction(async (tx) => {
      const targetStatus = body.status || currentOrder.status;
      const wasPending = !isPaidOrderStatus(currentOrder.status) && !isCancelOrderStatus(currentOrder.status);
      const nowPaid = isPaidOrderStatus(targetStatus);
      const nowCancel = isCancelOrderStatus(targetStatus);

      const shouldConsume = (wasPending && nowPaid) || (nowPaid && currentOrder.reservationStatus === 'active');
      const shouldRelease = (wasPending && nowCancel) || (nowCancel && currentOrder.reservationStatus === 'active');

      if (shouldConsume) {
        const { consumeStockReservation } = await import('../../db/writers');
        await consumeStockReservation(tx, body.id, 'Administrador');
        updatedFields.reservationStatus = 'consumed';
      } else if (shouldRelease) {
        const { releaseStockReservation } = await import('../../db/writers');
        await releaseStockReservation(tx, body.id, `Estado cambiado a ${targetStatus}`, targetStatus, 'Administrador');
        updatedFields.reservationStatus = 'released';
      }

      await tx.update(orders).set(updatedFields).where(eq(orders.id, body.id));
    });

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

    // If deleting order that had active reservation, release reserved stock first
    await db.transaction(async (tx) => {
      const { releaseStockReservation } = await import('../../db/writers');
      await releaseStockReservation(tx, id, 'Pedido eliminado', undefined, 'Administrador');
      await tx.delete(orders).where(eq(orders.id, id));
    });

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
