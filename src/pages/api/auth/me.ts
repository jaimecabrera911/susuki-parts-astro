import type { APIRoute } from 'astro';
import { getDb } from '../../../db/client';
import { users, userFavorites } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { verifyJwtToken } from '../../../utils/jwt';

export const GET: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get('authorization') || '';
    let token = '';

    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      token = authHeader.trim();
    }

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token no proporcionado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const payload = verifyJwtToken(token);
    if (!payload) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido o expirado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = getDb();
    const userMatches = await db.select().from(users).where(eq(users.id, payload.id));
    const user = userMatches[0];

    if (!user || !user.active) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuario no encontrado o inactivo' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const favorites = await db.select().from(userFavorites).where(eq(userFavorites.userId, user.id));
    const favoritePartIds = favorites.map(f => f.partId);

    const userProfile = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      documentId: user.documentId,
      city: user.city,
      address: user.address,
      postalCode: user.postalCode,
      createdAt: user.createdAt,
      avatarUrl: user.avatarUrl,
      role: user.role,
      active: user.active,
      notes: user.notes,
      favoritePartIds
    };

    return new Response(
      JSON.stringify({
        success: true,
        user: userProfile,
        payload
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Error validando sesión' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
