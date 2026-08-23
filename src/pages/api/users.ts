import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { users, userFavorites, userPermissions } from '../../db/schema';
import { eq, ilike, or, and } from 'drizzle-orm';
import { upsertUser } from '../../db/writers';

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const role = url.searchParams.get('role');
    const query = url.searchParams.get('q');

    const conditions: any[] = [];
    if (role) conditions.push(eq(users.role, role));
    if (query) {
      const q = `%${query.trim()}%`;
      conditions.push(
        or(
          ilike(users.fullName, q),
          ilike(users.email, q),
          ilike(users.documentId, q),
          ilike(users.city, q)
        )
      );
    }

    const rawData = conditions.length > 0
      ? await db.select().from(users).where(and(...conditions))
      : await db.select().from(users);

    const allFavorites = await db.select().from(userFavorites);
    const favoritesByUser = new Map<string, string[]>();
    for (const f of allFavorites) {
      const arr = favoritesByUser.get(f.userId) || [];
      arr.push(f.partId);
      favoritesByUser.set(f.userId, arr);
    }

    const allPermissions = await db.select().from(userPermissions);
    const permissionsByUser = new Map<string, any[]>();
    for (const p of allPermissions) {
      const arr = permissionsByUser.get(p.userId) || [];
      arr.push({
        id: p.id,
        userId: p.userId,
        module: p.module,
        canRead: p.canRead,
        canWrite: p.canWrite,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      });
      permissionsByUser.set(p.userId, arr);
    }

    const formatted = rawData.map(u => {
      const { passwordHash, ...safeUser } = u;
      return {
        ...safeUser,
        favoritePartIds: favoritesByUser.get(u.id) || [],
        permissions: permissionsByUser.get(u.id) || []
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
    const data = await upsertUser(db, body);

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
    if (!body.id) throw new Error('ID del usuario es requerido');

    await upsertUser(db, body);

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
