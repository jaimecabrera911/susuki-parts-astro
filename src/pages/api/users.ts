import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { users } from '../../db/schema';
import { eq, like, or } from 'drizzle-orm';
import { DEFAULT_USERS } from '../../data/adminStore';

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const role = url.searchParams.get('role');
    const query = url.searchParams.get('q');

    let rawData;
    if (role) {
      rawData = await db.select().from(users).where(eq(users.role, role));
    } else if (query) {
      const q = `%${query}%`;
      rawData = await db.select().from(users).where(
        or(
          like(users.fullName, q),
          like(users.email, q),
          like(users.documentId, q),
          like(users.city, q)
        )
      );
    } else {
      rawData = await db.select().from(users);
    }

    const result = (rawData && rawData.length > 0) ? rawData : DEFAULT_USERS;

    const formatted = result.map(u => ({
      ...u,
      favoritePartIds: typeof u.favoritePartIds === 'string' ? JSON.parse(u.favoritePartIds || '[]') : (u.favoritePartIds || [])
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

    let userCreatedAt = new Date();
    if (body.createdAt) {
      const parsed = new Date(body.createdAt);
      if (!isNaN(parsed.getTime())) userCreatedAt = parsed;
    }

    const newUser = {
      id: body.id || `usr-${Date.now()}`,
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      documentId: body.documentId,
      city: body.city,
      address: body.address,
      postalCode: body.postalCode || '',
      favoritePartIds: JSON.stringify(body.favoritePartIds || []),
      createdAt: userCreatedAt,
      avatarUrl: body.avatarUrl || null,
      role: body.role || 'customer',
      active: body.active !== undefined ? body.active : true,
      notes: body.notes || ''
    };

    await db.insert(users).values(newUser).onConflictDoUpdate({
      target: users.id,
      set: newUser
    });

    return new Response(JSON.stringify({ success: true, data: newUser }), {
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
    if (!body.id) throw new Error('ID del usuario es requerido');

    await db.update(users).set({
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      documentId: body.documentId,
      city: body.city,
      address: body.address,
      postalCode: body.postalCode,
      favoritePartIds: JSON.stringify(body.favoritePartIds || []),
      avatarUrl: body.avatarUrl,
      role: body.role,
      active: body.active,
      notes: body.notes
    }).where(eq(users.id, body.id));

    return new Response(JSON.stringify({ success: true, message: `Usuario ${body.id} actualizado exitosamente` }), {
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

    await db.delete(users).where(eq(users.id, id));

    return new Response(JSON.stringify({ success: true, message: `Usuario ${id} eliminado` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
