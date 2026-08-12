import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { shippingMethods, shippingMethodZoneRates } from '../../db/schema';
import { upsertShippingMethod, seedShipping } from '../../db/writers';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    let data = await db.select().from(shippingMethods);

    // Auto-seed if empty — seeds zones + methods from constants, then reads from DB
    if (!data || data.length === 0) {
      await seedShipping(db);
      data = await db.select().from(shippingMethods);
    }

    const rates = await db.select().from(shippingMethodZoneRates);
    const ratesByMethod = new Map<string, { zoneId: string; price: number }[]>();
    for (const r of rates) {
      const arr = ratesByMethod.get(r.methodId) || [];
      arr.push({ zoneId: r.zoneId, price: r.price });
      ratesByMethod.set(r.methodId, arr);
    }

    const formatted = data.map(sm => ({
      ...sm,
      dispatchDays: Array.isArray(sm.dispatchDays) ? sm.dispatchDays : ['1', '2', '3', '4', '5'],
      zoneRates: ratesByMethod.get(sm.id) || []
    }));

    return new Response(JSON.stringify({ success: true, count: formatted.length, data: formatted }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en GET /api/shipping-methods:', error?.message);
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
    const saved = await upsertShippingMethod(db, body);

    return new Response(JSON.stringify({ success: true, data: saved }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en POST /api/shipping-methods:', error?.message);
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
    if (!body.id) throw new Error('ID del método de envío es requerido');

    const updated = await upsertShippingMethod(db, body);

    return new Response(JSON.stringify({ success: true, data: updated, message: 'Método de envío actualizado' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en PUT /api/shipping-methods:', error?.message);
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

    await db.delete(shippingMethods).where(eq(shippingMethods.id, id));

    return new Response(JSON.stringify({ success: true, message: `Método de envío ${id} eliminado` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en DELETE /api/shipping-methods:', error?.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
