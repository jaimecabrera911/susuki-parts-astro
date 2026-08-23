import type { APIRoute } from 'astro';
import { getDb } from '../../../db/client';
import { users, userFavorites, userPermissions, roles, rolePermissions } from '../../../db/schema';
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
    let user: any = userMatches[0];

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
      const defaultPass = user.role === 'admin' || user.role === 'superadmin' ? 'Admin2026!' : 'Suzuki2026!';
      if (password === defaultPass || password === '123456' || password === 'admin' || password === 'qwerty1234') {
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

    // Fetch user permissions (direct user permissions first)
    const rawPermissions = await db.select().from(userPermissions).where(eq(userPermissions.userId, user.id));
    let permissions = rawPermissions.map(p => ({
      id: p.id,
      userId: p.userId,
      module: p.module,
      canRead: p.canRead,
      canWrite: p.canWrite,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    // If no direct permissions exist, resolve permissions from assigned role
    if (permissions.length === 0 && user.role && user.role !== 'customer') {
      const matchedRoles = await db.select().from(roles).where(eq(roles.slug, user.role));
      if (matchedRoles.length > 0) {
        const rolePerms = await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, matchedRoles[0].id));
        permissions = rolePerms.map(p => ({
          id: p.id,
          userId: user.id,
          module: p.module,
          canRead: p.canRead,
          canWrite: p.canWrite,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        }));
      }
    }

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
      favoritePartIds,
      permissions
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
