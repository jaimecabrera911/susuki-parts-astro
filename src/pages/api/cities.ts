import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { cities, states, countries } from '../../db/schema';
import { upsertCity, ensureCountry, ensureState, seedGeography } from '../../db/writers';
import { STORE_DEFAULT_LOCATION } from '../../utils/config';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    const count = await db.select({ id: cities.id }).from(cities);
    if (count.length === 0) {
      await seedGeography(db);
    }

    const rows = await db
      .select({
        id: cities.id,
        country: countries.name,
        department: states.name,
        city: cities.name,
        active: cities.active,
        code: cities.code
      })
      .from(cities)
      .innerJoin(states, eq(cities.stateId, states.id))
      .innerJoin(countries, eq(states.countryId, countries.id))
      .orderBy(states.name, cities.name);

    return new Response(JSON.stringify({ success: true, count: rows.length, data: rows }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: true, count: 0, data: [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();
    const countryName = body.country || STORE_DEFAULT_LOCATION.country;
    const countryId = await ensureCountry(db, countryName);
    const stateId = body.stateId || (await ensureState(db, countryId, body.department || ''));
    const saved = await upsertCity(db, {
      id: body.id,
      stateId,
      name: body.city || body.name,
      code: body.code,
      active: body.active
    });

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

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const id = url.searchParams.get('id');
    if (!id) throw new Error('Parámetro "id" es requerido');

    await db.delete(cities).where(eq(cities.id, id));

    return new Response(JSON.stringify({ success: true, message: `Ciudad ${id} eliminada` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};