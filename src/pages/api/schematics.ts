import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { schematics, schematicHotspots } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { INITIAL_ADMIN_SCHEMATICS } from '../../data/adminStore';

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const section = url.searchParams.get('section');

    let rawData;
    if (section) {
      rawData = await db.select().from(schematics).where(eq(schematics.section, section));
    } else {
      rawData = await db.select().from(schematics);
    }

    const result = (rawData && rawData.length > 0)
      ? rawData
      : (section ? INITIAL_ADMIN_SCHEMATICS.filter(s => s.section === section) : INITIAL_ADMIN_SCHEMATICS);

    const allHotspots = await db.select().from(schematicHotspots).catch(() => []);

    const formatted = result.map(s => {
      const relHotspots = allHotspots.filter(h => h.schematicId === s.id);
      const hotspotsData = relHotspots.length > 0
        ? relHotspots.map(h => ({ partId: h.partId, itemNumber: h.itemNumber, x: h.x, y: h.y, label: h.label }))
        : (typeof s.hotspots === 'string' ? JSON.parse(s.hotspots || '[]') : (s.hotspots || []));

      return {
        ...s,
        applicableModelIds: typeof s.applicableModelIds === 'string' ? JSON.parse(s.applicableModelIds || '[]') : s.applicableModelIds,
        hotspots: hotspotsData
      };
    });

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

    const schematicId = body.id || `sch-${Date.now()}`;
    const newSchematic = {
      id: schematicId,
      title: body.title,
      category: body.category,
      section: body.section,
      applicableModelIds: JSON.stringify(body.applicableModelIds || []),
      diagramImage: body.diagramImage,
      description: body.description || '',
      hotspots: JSON.stringify(body.hotspots || [])
    };

    await db.insert(schematics).values(newSchematic).onConflictDoUpdate({
      target: schematics.id,
      set: newSchematic
    });

    if (body.hotspots && Array.isArray(body.hotspots)) {
      for (const spot of body.hotspots) {
        await db.insert(schematicHotspots).values({
          id: `hs-${schematicId}-${spot.itemNumber || Math.random().toString(36).substring(2, 6)}`,
          schematicId: schematicId,
          partId: spot.partId,
          itemNumber: Number(spot.itemNumber || 1),
          x: Number(spot.x || 0),
          y: Number(spot.y || 0),
          label: spot.label || ''
        }).onConflictDoNothing();
      }
    }

    return new Response(JSON.stringify({ success: true, data: newSchematic }), {
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

    await db.update(schematics).set({
      title: body.title,
      category: body.category,
      section: body.section,
      applicableModelIds: JSON.stringify(body.applicableModelIds || []),
      diagramImage: body.diagramImage,
      description: body.description,
      hotspots: JSON.stringify(body.hotspots || [])
    }).where(eq(schematics.id, body.id));

    if (body.hotspots && Array.isArray(body.hotspots)) {
      await db.delete(schematicHotspots).where(eq(schematicHotspots.schematicId, body.id));
      for (const spot of body.hotspots) {
        await db.insert(schematicHotspots).values({
          id: `hs-${body.id}-${spot.itemNumber || Math.random().toString(36).substring(2, 6)}`,
          schematicId: body.id,
          partId: spot.partId,
          itemNumber: Number(spot.itemNumber || 1),
          x: Number(spot.x || 0),
          y: Number(spot.y || 0),
          label: spot.label || ''
        });
      }
    }

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

    await db.delete(schematicHotspots).where(eq(schematicHotspots.schematicId, id));
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
