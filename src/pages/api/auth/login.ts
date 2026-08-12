import type { APIRoute } from 'astro';
import { getDb } from '../../../db/client';
import { users, userFavorites } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, hashPassword } from '../../../utils/password';
import { signJwtToken } from '../../../utils/jwt';

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Por favor ingresa correo electrónico y contraseña' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const userMatches = await db.select().from(users).where(eq(users.email, cleanEmail));
    let user = userMatches[0];

    // Case-insensitive fallback if exact lowercase match fails
    if (!user) {
      const allUsers = await db.select().from(users);
      user = allUsers.find(u => u.email.trim().toLowerCase() === cleanEmail);
    }

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Correo o contraseña incorrectos' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check password
    let isValid = false;
    if (user.passwordHash) {
      isValid = verifyPassword(password, user.passwordHash);
    } else {
      // Legacy user without passwordHash: check default passwords and set hash
      const defaultPass = user.role === 'admin' ? 'Admin2026!' : 'Suzuki2026!';
      if (password === defaultPass || password === '123456' || password === 'admin') {
        isValid = true;
        const newHash = hashPassword(password);
        await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, user.id));
      }
    }

    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Correo o contraseña incorrectos' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user favorites
    const favorites = await db.select().from(userFavorites).where(eq(userFavorites.userId, user.id));
    const favoritePartIds = favorites.map(f => f.partId);

    // Sign JWT Token
    const token = signJwtToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    });

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
        message: 'Autenticación exitosa',
        token,
        user: userProfile
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Error en el servidor de autenticación' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
