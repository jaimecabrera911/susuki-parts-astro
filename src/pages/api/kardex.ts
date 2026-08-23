import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { inventoryMovements, parts, partOemNumbers } from '../../db/schema';
import { eq, ilike, or, and, desc, sql, inArray } from 'drizzle-orm';
import { upsertInventoryMovement, deleteInventoryMovement, initializeKardexBalances } from '../../db/writers';

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();

    // Auto-initialize opening balances if table is completely fresh
    await initializeKardexBalances(db).catch((err) => {
      console.warn('Auto-init Kardex balances:', err?.message);
    });

    const partId = url.searchParams.get('partId');
    const movementType = url.searchParams.get('type') || url.searchParams.get('movementType');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const query = url.searchParams.get('q');
    const limit = Math.min(Number(url.searchParams.get('limit') || 1000), 2000);
    const offset = Math.max(Number(url.searchParams.get('offset') || 0), 0);

    const conditions: any[] = [];

    if (partId) {
      conditions.push(eq(inventoryMovements.partId, partId));
    }
    if (movementType) {
      conditions.push(eq(inventoryMovements.movementType, movementType));
    }
    if (startDate) {
      const s = new Date(startDate);
      if (!isNaN(s.getTime())) conditions.push(sql`${inventoryMovements.createdAt} >= ${s}`);
    }
    if (endDate) {
      const e = new Date(endDate);
      if (!isNaN(e.getTime())) conditions.push(sql`${inventoryMovements.createdAt} <= ${e}`);
    }
    if (query) {
      const q = `%${query.trim()}%`;
      conditions.push(
        or(
          sql`${inventoryMovements.id}::text ILIKE ${q}`,
          sql`${inventoryMovements.partId}::text ILIKE ${q}`,
          ilike(inventoryMovements.referenceDocument, q),
          ilike(inventoryMovements.notes, q),
          ilike(inventoryMovements.userName, q),
          ilike(inventoryMovements.movementType, q)
        )
      );
    }

    const rows = conditions.length > 0
      ? await db.select().from(inventoryMovements).where(and(...conditions)).orderBy(desc(inventoryMovements.createdAt)).limit(limit).offset(offset)
      : await db.select().from(inventoryMovements).orderBy(desc(inventoryMovements.createdAt)).limit(limit).offset(offset);

    // Fetch part details to enrich movements
    const partIds = Array.from(new Set(rows.map((r) => r.partId).filter(Boolean)));
    const partsRows = partIds.length
      ? await db.select().from(parts).where(inArray(parts.id, partIds))
      : [];
    const oemsRows = partIds.length
      ? await db.select().from(partOemNumbers).where(inArray(partOemNumbers.partId, partIds))
      : [];

    const partsById = new Map<string, typeof partsRows[0]>();
    for (const p of partsRows) partsById.set(p.id, p);

    const oemsByPart = new Map<string, string[]>();
    for (const o of oemsRows) {
      const arr = oemsByPart.get(o.partId) || [];
      arr.push(o.oemNumber);
      oemsByPart.set(o.partId, arr);
    }

    const enriched = rows.map((m) => {
      const p = partsById.get(m.partId);
      return {
        ...m,
        partName: p?.name || 'Repuesto',
        partSku: p?.sku || '',
        partCategory: p?.category || '',
        partOemNumbers: oemsByPart.get(m.partId) || []
      };
    });

    return new Response(JSON.stringify({ success: true, count: enriched.length, data: enriched }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en GET /api/kardex:', error?.message);
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
    const data = await upsertInventoryMovement(db, body);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en POST /api/kardex:', error?.message);
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

    await deleteInventoryMovement(db, id);

    return new Response(JSON.stringify({ success: true, message: `Movimiento ${id} eliminado` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en DELETE /api/kardex:', error?.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
