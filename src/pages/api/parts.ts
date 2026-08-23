import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { parts, partOemNumbers } from '../../db/schema';
import { eq, ilike, or, inArray } from 'drizzle-orm';
import { upsertPart, formatParts } from '../../db/writers';

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const category = url.searchParams.get('category');
    const query = url.searchParams.get('q');
    const oem = url.searchParams.get('oem');

    let rawData;
    if (category) {
      rawData = await db.select().from(parts).where(eq(parts.category, category));
    } else if (query) {
      const q = `%${query.trim()}%`;
      const oemRows = await db.select({ partId: partOemNumbers.partId }).from(partOemNumbers).where(ilike(partOemNumbers.oemNumber, q));
      const nameMatches = await db.select().from(parts).where(or(ilike(parts.name, q), ilike(parts.description, q)));
      const map = new Map(nameMatches.map(p => [p.id, p]));
      if (oemRows.length) {
        const oemIds = [...new Set(oemRows.map(r => r.partId))];
        const oemParts = await db.select().from(parts).where(inArray(parts.id, oemIds));
        for (const p of oemParts) map.set(p.id, p);
      }
      rawData = [...map.values()];
    } else if (oem) {
      const oemRows = await db.select({ partId: partOemNumbers.partId }).from(partOemNumbers).where(ilike(partOemNumbers.oemNumber, `%${oem.trim()}%`));
      const ids = [...new Set(oemRows.map(r => r.partId))];
      rawData = ids.length ? await db.select().from(parts).where(inArray(parts.id, ids)) : [];
    } else {
      rawData = await db.select().from(parts);
    }

    const formatted = await formatParts(db, rawData);

    return new Response(JSON.stringify({ success: true, count: formatted.length, data: formatted }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en GET /api/parts:', error?.message);
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
    const data = await upsertPart(db, body);

    return new Response(JSON.stringify({ success: true, data: { ...data, ...body } }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en POST /api/parts:', error?.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    if (!body.id) throw new Error('ID del repuesto es requerido');
    const db = getDb();
    await upsertPart(db, body);

    return new Response(JSON.stringify({ success: true, message: 'Repuesto actualizado exitosamente', data: body }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en PUT /api/parts:', error?.message);
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

    await db.delete(parts).where(eq(parts.id, id));

    return new Response(JSON.stringify({ success: true, message: `Repuesto ${id} eliminado` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en DELETE /api/parts:', error?.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
