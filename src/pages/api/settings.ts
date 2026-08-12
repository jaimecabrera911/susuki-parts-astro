import type { APIRoute } from 'astro';
import { db } from '../../db/client';
import { getSiteSettings, upsertSiteSettings } from '../../db/writers';

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
