import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { roles, rolePermissions } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { DashboardModule, UserPermission } from '../../types';

const ALL_MODULES: DashboardModule[] = [
  'brands',
  'models',
  'categories',
  'parts',
  'kardex',
  'schematics',
  'orders',
  'returns',
  'users',
  'shipping',
  'payments',
  'settings',
  'coupons',
  'metrics'
];

const DEFAULT_ROLES = [
  {
    name: 'Super Administrador',
    slug: 'superadmin',
    description: 'Acceso total e irrestricto a todos los módulos y gestión de permisos',
    isSystem: true,
    permissions: ALL_MODULES.map(m => ({ module: m, canRead: true, canWrite: true }))
  },
  {
    name: 'Gestor de Catálogo e Inventario',
    slug: 'catalog_manager',
    description: 'Administración de repuestos, marcas, modelos, categorías y despieces',
    isSystem: false,
    permissions: ALL_MODULES.map(m => ({
      module: m,
      canRead: ['brands', 'models', 'categories', 'parts', 'schematics', 'metrics'].includes(m),
      canWrite: ['brands', 'models', 'categories', 'parts', 'schematics'].includes(m)
    }))
  },
  {
    name: 'Gestor de Pedidos y Ventas',
    slug: 'sales_manager',
    description: 'Gestión de pedidos, cupones, clientes y métricas de venta',
    isSystem: false,
    permissions: ALL_MODULES.map(m => ({
      module: m,
      canRead: ['orders', 'returns', 'coupons', 'parts', 'models', 'metrics'].includes(m),
      canWrite: ['orders', 'returns', 'coupons'].includes(m)
    }))
  },
  {
    name: 'Soporte y Garantías (RMA)',
    slug: 'support_rma',
    description: 'Atención de devoluciones, garantías y consulta de pedidos y despieces',
    isSystem: false,
    permissions: ALL_MODULES.map(m => ({
      module: m,
      canRead: ['returns', 'orders', 'parts', 'models', 'schematics'].includes(m),
      canWrite: ['returns'].includes(m)
    }))
  }
];

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    let rawRoles = await db.select().from(roles);

    // Auto-seed default roles if empty
    if (rawRoles.length === 0) {
      await db.transaction(async (tx) => {
        for (const r of DEFAULT_ROLES) {
          const roleId = crypto.randomUUID();
          await tx.insert(roles).values({
            id: roleId,
            name: r.name,
            slug: r.slug,
            description: r.description,
            isSystem: r.isSystem,
            active: true
          });

          for (const p of r.permissions) {
            await tx.insert(rolePermissions).values({
              id: crypto.randomUUID(),
              roleId,
              module: p.module,
              canRead: p.canRead,
              canWrite: p.canWrite
            });
          }
        }
      });
      rawRoles = await db.select().from(roles);
    }

    const allPerms = await db.select().from(rolePermissions);
    const permsByRole = new Map<string, UserPermission[]>();
    for (const p of allPerms) {
      const arr = permsByRole.get(p.roleId) || [];
      arr.push({
        id: p.id,
        module: p.module as DashboardModule,
        canRead: p.canRead,
        canWrite: p.canWrite
      });
      permsByRole.set(p.roleId, arr);
    }

    const formatted = rawRoles.map(r => ({
      ...r,
      permissions: permsByRole.get(r.id) || []
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

    if (!body.name || !body.name.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'El nombre del rol es obligatorio' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const name = body.name.trim();
    const slug = body.slug ? body.slug.trim().toLowerCase().replace(/\s+/g, '_') : name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const id = body.id || crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(roles).values({
        id,
        name,
        slug,
        description: body.description || '',
        isSystem: false,
        active: body.active !== undefined ? Boolean(body.active) : true
      });

      if (Array.isArray(body.permissions)) {
        for (const p of body.permissions) {
          if (p && p.module) {
            await tx.insert(rolePermissions).values({
              id: crypto.randomUUID(),
              roleId: id,
              module: p.module,
              canRead: p.canRead !== undefined ? Boolean(p.canRead) : true,
              canWrite: p.canWrite !== undefined ? Boolean(p.canWrite) : false
            });
          }
        }
      }
    });

    return new Response(JSON.stringify({ success: true, data: { id, name, slug } }), {
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

    if (!body.id) {
      return new Response(JSON.stringify({ success: false, error: 'ID del rol es obligatorio' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const id = body.id;
    const name = body.name?.trim();
    const slug = body.slug ? body.slug.trim().toLowerCase().replace(/\s+/g, '_') : undefined;

    await db.transaction(async (tx) => {
      const updateData: any = {
        updatedAt: new Date()
      };
      if (name) updateData.name = name;
      if (slug) updateData.slug = slug;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.active !== undefined) updateData.active = Boolean(body.active);

      await tx.update(roles).set(updateData).where(eq(roles.id, id));

      if (Array.isArray(body.permissions)) {
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
        for (const p of body.permissions) {
          if (p && p.module) {
            await tx.insert(rolePermissions).values({
              id: crypto.randomUUID(),
              roleId: id,
              module: p.module,
              canRead: p.canRead !== undefined ? Boolean(p.canRead) : true,
              canWrite: p.canWrite !== undefined ? Boolean(p.canWrite) : false
            });
          }
        }
      }
    });

    return new Response(JSON.stringify({ success: true, message: 'Rol actualizado exitosamente' }), {
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

    const existing = await db.select().from(roles).where(eq(roles.id, id));
    if (existing.length > 0 && existing[0].isSystem) {
      return new Response(JSON.stringify({ success: false, error: 'No se puede eliminar un rol del sistema' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db.delete(roles).where(eq(roles.id, id));

    return new Response(JSON.stringify({ success: true, message: `Rol ${id} eliminado exitosamente` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
