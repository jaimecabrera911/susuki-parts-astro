import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { shippingZones, shippingZoneStates, shippingZoneCities, states, cities } from '../../db/schema';
import { upsertShippingZone, seedShipping } from '../../db/writers';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    let data = await db.select().from(shippingZones);

    // Auto-seed if empty — seeds zones + methods from constants, then reads from DB
    if (!data || data.length === 0) {
      await seedShipping(db);
      data = await db.select().from(shippingZones);
    }

    const mappings = await db.select().from(shippingZoneStates);
    const stateRows = await db.select().from(states);
    const stateNameById = new Map(stateRows.map(s => [s.id, s.name]));
    const depsByZone = new Map<string, string[]>();
    for (const m of mappings) {
      const name = stateNameById.get(m.stateId);
      if (!name) continue;
      const arr = depsByZone.get(m.zoneId) || [];
      arr.push(name);
      depsByZone.set(m.zoneId, arr);
    }

    const cityMappings = await db.select().from(shippingZoneCities);
    const cityRows = await db.select({ id: cities.id, name: cities.name, stateId: cities.stateId }).from(cities);
    const cityByZone = new Map<string, { department: string; city: string }[]>();
    for (const cm of cityMappings) {
      const cityRow = cityRows.find((c) => c.id === cm.cityId);
      if (!cityRow) continue;
      const deptName = stateNameById.get(cityRow.stateId);
      if (!deptName) continue;
      const arr = cityByZone.get(cm.zoneId) || [];
      arr.push({ department: deptName, city: cityRow.name });
      cityByZone.set(cm.zoneId, arr);
    }

    const formatted = data.map(sz => ({
      ...sz,
      departments: depsByZone.get(sz.id) || [],
      cities: cityByZone.get(sz.id) || []
    }));

    return new Response(JSON.stringify({ success: true, count: formatted.length, data: formatted }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en GET /api/shipping-zones:', error?.message);
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
    const saved = await upsertShippingZone(db, body);

    return new Response(JSON.stringify({ success: true, data: saved }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en POST /api/shipping-zones:', error?.message);
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
    if (!body.id) throw new Error('ID de la zona de envío es requerido');

    const updated = await upsertShippingZone(db, body);

    return new Response(JSON.stringify({ success: true, data: updated, message: 'Zona de envío actualizada' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en PUT /api/shipping-zones:', error?.message);
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

    await db.delete(shippingZones).where(eq(shippingZones.id, id));

    return new Response(JSON.stringify({ success: true, message: `Zona de envío ${id} eliminada` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en DELETE /api/shipping-zones:', error?.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
