import type { APIRoute } from 'astro';
import { SUZUKI_PARTS } from '../../data/suzukiData';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { oem } = body;

    if (!oem) {
      return new Response(JSON.stringify({ error: "Número OEM es requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const cleanOem = String(oem).trim().toUpperCase();
    const part = SUZUKI_PARTS.find(p => p.oemNumber.toUpperCase().includes(cleanOem) || cleanOem.includes(p.oemNumber.toUpperCase()));

    if (part) {
      return new Response(JSON.stringify({ found: true, part }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ found: false, message: `No se encontró la referencia OEM '${cleanOem}' en la base de datos activa.` }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
