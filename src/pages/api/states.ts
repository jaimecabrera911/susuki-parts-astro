import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { states } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const countryId = url.searchParams.get('countryId');
    const rows = countryId
      ? await db.select().from(states).where(eq(states.countryId, countryId)).orderBy(states.name)
      : await db.select().from(states).orderBy(states.name);
    return new Response(JSON.stringify({ success: true, count: rows.length, data: rows }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: true, count: 0, data: [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};