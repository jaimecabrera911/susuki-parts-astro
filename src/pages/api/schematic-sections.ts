import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { schematicSections } from '../../db/schema';
import { upsertSchematicSection, seedSchematicSections } from '../../db/writers';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    let rows = await db.select().from(schematicSections).orderBy(schematicSections.order, schematicSections.name);

    // Auto-seed if empty — seeds the default section catalog into the DB
    if (!rows || rows.length === 0) {
      await seedSchematicSections(db);
      rows = await db.select().from(schematicSections).orderBy(schematicSections.order, schematicSections.name);
    }

    return new Response(JSON.stringify({ success: true, count: rows.length, data: rows }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en GET /api/schematic-sections:', error?.message);
    return new Response(JSON.stringify({ success: false, count: 0, data: [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();
    if (!body.name) throw new Error('El nombre de la sección es requerido');
    const saved = await upsertSchematicSection(db, body);
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

export const PUT: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();

    // Soporte para actualización en lote / reordenamiento de secciones
    if (Array.isArray(body)) {
      for (let i = 0; i < body.length; i++) {
        const item = body[i];
        if (item.id) {
          await upsertSchematicSection(db, {
            ...item,
            order: item.order !== undefined ? item.order : i + 1,
          });
        }
      }
      const rows = await db.select().from(schematicSections).orderBy(schematicSections.order, schematicSections.name);
      return new Response(JSON.stringify({ success: true, count: rows.length, data: rows }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!body.id) throw new Error('ID de la sección es requerido');
    const saved = await upsertSchematicSection(db, body);
    return new Response(JSON.stringify({ success: true, data: saved }), {
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
    await db.delete(schematicSections).where(eq(schematicSections.id, id));
    return new Response(JSON.stringify({ success: true, message: `Sección ${id} eliminada` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};