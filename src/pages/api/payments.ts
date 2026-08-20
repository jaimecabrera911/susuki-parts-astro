import type { APIRoute } from 'astro';
import { db } from '../../db/client';
import { getPaymentSettings, upsertPaymentSettings } from '../../db/writers';
import { verifyJwtToken } from '../../utils/jwt';

function isAdminRequest(request: Request): boolean {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const payload = token ? verifyJwtToken(token) : null;
  return Boolean(payload && payload.role === 'admin');
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const data = await getPaymentSettings(db);
    const isAdmin = isAdminRequest(request);

    // Si no es admin, ocultamos secretos de pasarela en la respuesta pública para el storefront
    const safeData = isAdmin
      ? data
      : {
          bankTransfer: {
            enabled: data.bankTransfer.enabled,
            accounts: data.bankTransfer.accounts.filter((acc) => acc.active)
          },
          wompi: {
            enabled: data.wompi.enabled,
            environment: data.wompi.environment,
            publicKey: data.wompi.publicKey
          }
        };

    return new Response(JSON.stringify({ success: true, data: safeData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error en GET /api/payments:', err?.message || err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Error cargando configuración de pagos' }),
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
    const data = await upsertPaymentSettings(db, body);
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error en POST /api/payments:', err?.message || err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Error actualizando configuración de pagos' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
