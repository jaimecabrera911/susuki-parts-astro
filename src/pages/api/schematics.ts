import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { schematics, schematicHotspots, schematicApplicableModels } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { upsertSchematic } from '../../db/writers';

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const section = url.searchParams.get('section');

    const data = section
      ? await db.select().from(schematics).where(eq(schematics.section, section))
      : await db.select().from(schematics);

    const allHotspots = await db.select().from(schematicHotspots);
    const allModels = await db.select().from(schematicApplicableModels);

    const hotspotsBySchematic = new Map<string, typeof allHotspots>();
    for (const h of allHotspots) {
      const arr = hotspotsBySchematic.get(h.schematicId) || [];
      arr.push(h);
      hotspotsBySchematic.set(h.schematicId, arr);
    }
    const modelsBySchematic = new Map<string, string[]>();
    for (const r of allModels) {
      const arr = modelsBySchematic.get(r.schematicId) || [];
      arr.push(r.modelId);
      modelsBySchematic.set(r.schematicId, arr);
    }

    const formatted = data.map(s => ({
      ...s,
      applicableModelIds: modelsBySchematic.get(s.id) || [],
      hotspots: (hotspotsBySchematic.get(s.id) || []).map(h => ({
        partId: h.partId,
        itemNumber: h.itemNumber,
        x: h.x,
        y: h.y,
        label: h.label
      }))
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
    const data = await upsertSchematic(db, body);

    return new Response(JSON.stringify({ success: true, data }), {
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
    if (!body.id) throw new Error('ID del despiece es requerido');

    await upsertSchematic(db, body);

    return new Response(JSON.stringify({ success: true, message: 'Despiece actualizado exitosamente' }), {
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

    await db.delete(schematics).where(eq(schematics.id, id));

    return new Response(JSON.stringify({ success: true, message: `Despiece ${id} eliminado` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
