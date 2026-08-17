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

    const [mappings, cityMappings, stateRows, cityRows] = await Promise.all([
      db.select().from(shippingZoneStates),
      db.select().from(shippingZoneCities),
      db.select().from(states),
      db.select().from(cities)
    ]);
    const stateNameById = new Map(stateRows.map(s => [s.id, s.name]));
    const cityStateById = new Map(cityRows.map(c => [c.id, c.stateId]));
    const cityNameById = new Map(cityRows.map(c => [c.id, c.name]));

    const wholeDeptsByZone = new Map<string, string[]>();
    for (const m of mappings) {
      const name = stateNameById.get(m.stateId);
      if (!name) continue;
      const arr = wholeDeptsByZone.get(m.zoneId) || [];
      arr.push(name);
      wholeDeptsByZone.set(m.zoneId, arr);
    }

    const cityNamesByZone = new Map<string, { stateName: string; cityName: string }[]>();
    for (const m of cityMappings) {
      const stateId = cityStateById.get(m.cityId);
      const stateName = stateId ? stateNameById.get(stateId) : undefined;
      const cityName = cityNameById.get(m.cityId);
      if (!stateName || !cityName) continue;
      const arr = cityNamesByZone.get(m.zoneId) || [];
      arr.push({ stateName, cityName });
      cityNamesByZone.set(m.zoneId, arr);
    }

    const formatted = data.map(sz => {
      const wholeDepts = wholeDeptsByZone.get(sz.id) || [];
      const wholeSet = new Set(wholeDepts);
      const cityGroups = new Map<string, string[]>();
      for (const c of cityNamesByZone.get(sz.id) || []) {
        if (wholeSet.has(c.stateName)) continue; // depto completo ya cubre sus ciudades
        const arr = cityGroups.get(c.stateName) || [];
        arr.push(c.cityName);
        cityGroups.set(c.stateName, arr);
      }

      const departments = [
        ...wholeDepts.map(name => ({ name, cities: [] as string[] })),
        ...[...cityGroups.entries()].map(([name, cityList]) => ({ name, cities: cityList }))
      ];

      return {
        ...sz,
        departments
      };
    });

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
