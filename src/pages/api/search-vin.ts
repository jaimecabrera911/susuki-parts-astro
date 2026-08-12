import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { vin } = body;

    if (!vin) {
      return new Response(JSON.stringify({ error: "VIN es requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const cleanVin = String(vin).trim().toUpperCase();

    return new Response(JSON.stringify({
      vin: cleanVin,
      found: false,
      message: "VIN no registrado en la base de datos. Selecciona manualmente la moto en el Selector Rápido."
    }), {
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
