import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { brands } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { generateUuidV7 } from '../../utils/idGenerator';

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    const data = await db.select().from(brands);
    return new Response(JSON.stringify({ success: true, count: data.length, data }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en GET /api/brands:', error?.message);
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
    const newBrand = {
      id: body.id || generateUuidV7('brd'),
      name: body.name,
      logo: body.logo || null,
      country: body.country || 'Japón',
      active: body.active !== undefined ? body.active : true,
      description: body.description || ''
    };
    await db.insert(brands).values(newBrand).onConflictDoUpdate({
      target: brands.id,
      set: newBrand
    });
    return new Response(JSON.stringify({ success: true, data: newBrand }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en POST /api/brands:', error?.message);
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
    if (!body.id) throw new Error('ID de la marca es requerido');

    await db.update(brands).set({
      name: body.name,
      logo: body.logo,
      country: body.country,
      active: body.active,
      description: body.description
    }).where(eq(brands.id, body.id));

    return new Response(JSON.stringify({ success: true, message: 'Marca actualizada exitosamente' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en PUT /api/brands:', error?.message);
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

    await db.delete(brands).where(eq(brands.id, id));
    return new Response(JSON.stringify({ success: true, message: `Marca ${id} eliminada` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en DELETE /api/brands:', error?.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
