import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { userGarages } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const userId = url.searchParams.get('userId');
    let data;
    if (userId) {
      data = await db.select().from(userGarages).where(eq(userGarages.userId, userId));
    } else {
      data = await db.select().from(userGarages);
    }
    return new Response(JSON.stringify({ success: true, count: data.length, data }), {
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

    const newVehicle = {
      id: body.id || `gar-${Date.now()}`,
      userId: body.userId || 'usr-default',
      brandId: body.brandId || 'suzuki',
      modelId: body.modelId,
      modelName: body.modelName,
      year: Number(body.year),
      version: body.version || 'Standard',
      vin: body.vin || null,
      isDefault: body.isDefault !== undefined ? body.isDefault : false,
      createdAt: body.createdAt ? new Date(body.createdAt) : new Date()
    };

    await db.insert(userGarages).values(newVehicle).onConflictDoNothing();

    return new Response(JSON.stringify({ success: true, data: newVehicle }), {
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

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const id = url.searchParams.get('id');
    if (!id) throw new Error('Parámetro "id" es requerido');

    await db.delete(userGarages).where(eq(userGarages.id, id));
    return new Response(JSON.stringify({ success: true, message: `Vehículo ${id} eliminado del garaje` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
