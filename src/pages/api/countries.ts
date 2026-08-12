import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { countries } from '../../db/schema';

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    const rows = await db.select().from(countries).orderBy(countries.name);
    return new Response(JSON.stringify({ success: true, count: rows.length, data: rows }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: true, count: 0, data: [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};