import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { parts } from '../../db/schema';
import { eq, like, or } from 'drizzle-orm';
import { INITIAL_ADMIN_PARTS } from '../../data/adminStore';

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
      const q = `%${query}%`;
      rawData = await db.select().from(parts).where(
        or(
          like(parts.name, q),
          like(parts.oemNumbers, q),
          like(parts.description, q)
        )
      );
    } else if (oem) {
      rawData = await db.select().from(parts).where(like(parts.oemNumbers, `%${oem}%`));
    } else {
      rawData = await db.select().from(parts);
    }

    const result = (rawData && rawData.length > 0) ? rawData : INITIAL_ADMIN_PARTS;

    const formatted = result.map(p => ({
      ...p,
      oemNumbers: typeof p.oemNumbers === 'string' ? JSON.parse(p.oemNumbers || '[]') : (p.oemNumbers || []),
      images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : (p.images || []),
      specs: typeof p.specs === 'string' ? JSON.parse(p.specs || '[]') : (p.specs || []),
      compatibility: typeof p.compatibility === 'string' ? JSON.parse(p.compatibility || '[]') : (p.compatibility || []),
      diagramHotspot: typeof p.diagramHotspot === 'string' ? JSON.parse(p.diagramHotspot) : p.diagramHotspot
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

    const newPart = {
      id: body.id || `part-${Date.now()}`,
      oemNumbers: JSON.stringify(body.oemNumbers || []),
      name: body.name,
      category: body.category,
      price: Number(body.price),
      stock: Number(body.stock || 0),
      image: body.image,
      images: JSON.stringify(body.images || []),
      description: body.description || '',
      specs: JSON.stringify(body.specs || []),
      compatibility: JSON.stringify(body.compatibility || []),
      schematicId: body.schematicId || null,
      diagramHotspot: body.diagramHotspot ? JSON.stringify(body.diagramHotspot) : null,
      availability: body.availability || 'in_stock'
    };

    await db.insert(parts).values(newPart).onConflictDoUpdate({
      target: parts.id,
      set: newPart
    });

    return new Response(JSON.stringify({ success: true, data: newPart }), {
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
    if (!body.id) throw new Error('ID del repuesto es requerido');

    await db.update(parts).set({
      oemNumbers: JSON.stringify(body.oemNumbers || []),
      name: body.name,
      category: body.category,
      price: Number(body.price),
      stock: Number(body.stock),
      image: body.image,
      images: JSON.stringify(body.images || []),
      description: body.description,
      specs: JSON.stringify(body.specs || []),
      compatibility: JSON.stringify(body.compatibility || []),
      schematicId: body.schematicId,
      diagramHotspot: body.diagramHotspot ? JSON.stringify(body.diagramHotspot) : null,
      availability: body.availability
    }).where(eq(parts.id, body.id));

    return new Response(JSON.stringify({ success: true, message: 'Repuesto actualizado exitosamente' }), {
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

    await db.delete(parts).where(eq(parts.id, id));

    return new Response(JSON.stringify({ success: true, message: `Repuesto ${id} eliminado` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
