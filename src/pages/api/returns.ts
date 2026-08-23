import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { orderReturns, orders } from '../../db/schema';
import { eq, ilike, or, and, desc, inArray, sql } from 'drizzle-orm';
import { upsertOrderReturn, deleteOrderReturn } from '../../db/writers';

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const status = url.searchParams.get('status');
    const orderId = url.searchParams.get('orderId');
    const email = url.searchParams.get('email');
    const query = url.searchParams.get('q');

    const conditions: any[] = [];

    if (orderId) {
      conditions.push(eq(orderReturns.orderId, orderId));
    }
    if (status) {
      conditions.push(eq(orderReturns.status, status));
    }
    if (email) {
      conditions.push(ilike(orderReturns.email, email.trim()));
    }
    if (query) {
      const q = `%${query.trim()}%`;
      conditions.push(
        or(
          sql`${orderReturns.id}::text ILIKE ${q}`,
          sql`${orderReturns.orderId}::text ILIKE ${q}`,
          ilike(orderReturns.customerName, q),
          ilike(orderReturns.email, q),
          ilike(orderReturns.reason, q),
          ilike(orderReturns.prefix, q),
          ilike(orderReturns.documentNumber, q),
          sql`(${orderReturns.prefix} || '-' || COALESCE(${orderReturns.documentNumber}, UPPER(SUBSTRING(${orderReturns.id}::text, 1, 8)))) ILIKE ${q}`
        )
      );
    }

    const data = conditions.length > 0
      ? await db.select().from(orderReturns).where(and(...conditions)).orderBy(desc(orderReturns.createdAt))
      : await db.select().from(orderReturns).orderBy(desc(orderReturns.createdAt));

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

    // 1. Fetch order from DB to verify real status and payment state
    const orderRows = await db.select().from(orders).where(eq(orders.id, body.orderId)).limit(1);
    if (orderRows.length === 0) {
      throw new Error(`El pedido solicitado no existe en la base de datos.`);
    }

    const orderRecord = orderRows[0];
    const statusLower = (orderRecord.status || '').toLowerCase();
    const isUnpaid = statusLower.includes('pendiente') || statusLower.includes('cancelad') || statusLower.includes('expirad') || statusLower.includes('anulad');

    // 2. Reject financial refunds/returns on unpaid orders
    if (isUnpaid && !body.isUnpaidCancel && body.resolutionType !== 'cancellation') {
      throw new Error(`No es posible solicitar devolución ni reembolso de dinero para un pedido en estado "${orderRecord.status}". El pedido aún no ha sido pagado.`);
    }

    // 3. Check return window if orderDate is passed
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
