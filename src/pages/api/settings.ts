import type { APIRoute } from 'astro';
import { db } from '../../db/client';
import { getSiteSettings, upsertSiteSettings } from '../../db/writers';
import { verifyJwtToken } from '../../utils/jwt';

function isAdminRequest(request: Request): boolean {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const payload = token ? verifyJwtToken(token) : null;
  return Boolean(payload && payload.role === 'admin');
}

export const GET: APIRoute = async () => {
  try {
    const data = await getSiteSettings(db);
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: 'Error cargando configuración de la tienda' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!isAdminRequest(request)) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado: se requiere sesión de administrador' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  try {
    const body = await request.json();
    const data = await upsertSiteSettings(db, body);
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: 'Error actualizando configuración de la tienda' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};