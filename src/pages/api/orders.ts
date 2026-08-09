import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { orders, orderItems } from '../../db/schema';
import { eq, like, or } from 'drizzle-orm';
import { DEFAULT_ORDERS } from '../../data/adminStore';

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const status = url.searchParams.get('status');
    const query = url.searchParams.get('q');

    let rawData;
    if (status) {
      rawData = await db.select().from(orders).where(eq(orders.status, status));
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
      );
    } else {
      rawData = await db.select().from(orders);
    }

    const result = (rawData && rawData.length > 0) ? rawData : DEFAULT_ORDERS;

    const formatted = result.map(o => ({
      ...o,
      items: typeof o.items === 'string' ? JSON.parse(o.items || '[]') : (o.items || []),
      motorcycle: typeof o.motorcycle === 'string' ? (o.motorcycle ? JSON.parse(o.motorcycle) : null) : (o.motorcycle || null)
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

    const orderId = body.id || `SZ-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    let orderDate = new Date();
    if (body.date) {
      const parsed = new Date(body.date);
      if (!isNaN(parsed.getTime())) {
        orderDate = parsed;
      }
    }

    const newOrder = {
      id: orderId,
      date: orderDate,
      customerName: body.customerName || 'Cliente Suzuki',
      email: body.email || 'cliente@suzukiparts.com.co',
      phone: body.phone || '',
      documentId: body.documentId || '',
      city: body.city || '',
      shippingAddress: body.shippingAddress || '',
      postalCode: body.postalCode || '',
      items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items || []),
      totalPrice: Number(body.totalPrice || 0),
      motorcycle: typeof body.motorcycle === 'string' ? body.motorcycle : (body.motorcycle ? JSON.stringify(body.motorcycle) : null),
      guaranteeCode: body.guaranteeCode || `SZ-GAR-${Math.floor(1000 + Math.random() * 9000)}-PENDING`,
      paymentMethod: body.paymentMethod || 'transferencia',
      status: body.status || 'Pendiente de pago',
      paymentReference: body.paymentReference || orderId,
      trackingNumber: body.trackingNumber || null,
      shippingCarrier: body.shippingCarrier || null,
      notes: body.notes || ''
    };

    await db.insert(orders).values(newOrder).onConflictDoUpdate({
      target: orders.id,
      set: newOrder
    });

    // Also populate order_items for relational queries
    const itemsList = Array.isArray(body.items) ? body.items : (typeof body.items === 'string' ? JSON.parse(body.items) : []);
    if (Array.isArray(itemsList)) {
      for (const item of itemsList) {
        if (item.part) {
          const primaryOem = Array.isArray(item.part.oemNumbers) ? item.part.oemNumbers[0] : (item.part.oemNumbers || '');
          await db.insert(orderItems).values({
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            orderId,
            partId: item.part.id,
            partName: item.part.name,
            oemNumber: primaryOem,
            quantity: Number(item.quantity || 1),
            unitPrice: Number(item.part.price || 0),
            lineTotal: Number((item.part.price || 0) * (item.quantity || 1))
          }).onConflictDoNothing();
        }
      }
    }

    return new Response(JSON.stringify({ success: true, data: newOrder }), {
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
    if (!body.id) throw new Error('ID del pedido es requerido');

    await db.update(orders).set({
      status: body.status,
      paymentReference: body.paymentReference,
      trackingNumber: body.trackingNumber,
      shippingCarrier: body.shippingCarrier,
      notes: body.notes
    }).where(eq(orders.id, body.id));

    return new Response(JSON.stringify({ success: true, message: `Pedido ${body.id} actualizado exitosamente` }), {
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

    await db.delete(orderItems).where(eq(orderItems.orderId, id));
    await db.delete(orders).where(eq(orders.id, id));

    return new Response(JSON.stringify({ success: true, message: `Pedido ${id} eliminado` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
