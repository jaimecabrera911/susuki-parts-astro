import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { coupons } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { INITIAL_COUPONS } from '../../data/taxCouponsData';

/** Seed initial coupons if table is empty */
async function seedIfEmpty(db: ReturnType<typeof getDb>) {
  const existing = await db.select().from(coupons).limit(1);
  if (existing.length === 0) {
    const now = new Date().toISOString();
    await db.insert(coupons).values(
      INITIAL_COUPONS.map(c => ({
        id: c.id,
        code: c.code,
        type: c.type,
        value: c.value,
        minPurchase: c.minPurchase ?? 0,
        maxUses: null,
        usedCount: 0,
        expiresAt: null,
        active: c.active,
        createdAt: new Date(c.createdAt || now),
        updatedAt: new Date(now)
      }))
    ).onConflictDoNothing();
  }
}

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    await seedIfEmpty(db);
    const all = await db.select().from(coupons).orderBy(coupons.createdAt);
    return new Response(JSON.stringify({ success: true, data: all }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();

    // Bulk replace (admin saves full list)
    if (Array.isArray(body)) {
      for (const c of body) {
        if (!c.id || !c.code) continue;
        await db.insert(coupons).values({
          id: c.id,
          code: String(c.code).toUpperCase().trim(),
          type: c.type || 'percentage',
          value: Number(c.value) || 0,
          minPurchase: Number(c.minPurchase) || 0,
          maxUses: c.maxUses ?? null,
          usedCount: Number(c.usedCount) || 0,
          expiresAt: c.expiresAt ? new Date(c.expiresAt) : null,
          active: Boolean(c.active),
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          updatedAt: new Date()
        }).onConflictDoUpdate({
          target: coupons.id,
          set: {
            code: String(c.code).toUpperCase().trim(),
            type: c.type || 'percentage',
            value: Number(c.value) || 0,
            minPurchase: Number(c.minPurchase) || 0,
            maxUses: c.maxUses ?? null,
            usedCount: Number(c.usedCount) || 0,
            expiresAt: c.expiresAt ? new Date(c.expiresAt) : null,
            active: Boolean(c.active),
            updatedAt: new Date()
          }
        });
      }
      const all = await db.select().from(coupons).orderBy(coupons.createdAt);
      return new Response(JSON.stringify({ success: true, data: all }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Single upsert
    if (body.id && body.code) {
      await db.insert(coupons).values({
        id: body.id,
        code: String(body.code).toUpperCase().trim(),
        type: body.type || 'percentage',
        value: Number(body.value) || 0,
        minPurchase: Number(body.minPurchase) || 0,
        maxUses: body.maxUses ?? null,
        usedCount: Number(body.usedCount) || 0,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        active: Boolean(body.active),
        createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: coupons.id,
        set: {
          code: String(body.code).toUpperCase().trim(),
          type: body.type || 'percentage',
          value: Number(body.value) || 0,
          minPurchase: Number(body.minPurchase) || 0,
          maxUses: body.maxUses ?? null,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
          active: Boolean(body.active),
          updatedAt: new Date()
        }
      });

      const all = await db.select().from(coupons).orderBy(coupons.createdAt);
      return new Response(JSON.stringify({ success: true, data: all }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Datos de cupón inválidos (se requiere id y code)');
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();
    if (!body.id) throw new Error('Se requiere el id del cupón a eliminar');
    await db.delete(coupons).where(eq(coupons.id, body.id));
    const all = await db.select().from(coupons).orderBy(coupons.createdAt);
    return new Response(JSON.stringify({ success: true, data: all }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
