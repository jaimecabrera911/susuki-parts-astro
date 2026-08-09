import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { parts } from '../../db/schema';
import { like } from 'drizzle-orm';
import { INITIAL_ADMIN_PARTS } from '../../data/adminStore';

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();
    const { oem } = body;

    if (!oem) {
      return new Response(JSON.stringify({ error: "Número OEM es requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const cleanOem = String(oem).trim().toUpperCase();

    const rawParts = await db.select().from(parts).where(like(parts.oemNumbers, `%${cleanOem}%`));

    if (rawParts && rawParts.length > 0) {
      const p = rawParts[0];
      const formatted = {
        ...p,
        oemNumbers: typeof p.oemNumbers === 'string' ? JSON.parse(p.oemNumbers || '[]') : p.oemNumbers,
        images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : p.images,
        specs: typeof p.specs === 'string' ? JSON.parse(p.specs || '[]') : p.specs,
        compatibility: typeof p.compatibility === 'string' ? JSON.parse(p.compatibility || '[]') : p.compatibility,
        diagramHotspot: typeof p.diagramHotspot === 'string' ? JSON.parse(p.diagramHotspot || 'null') : p.diagramHotspot
      };
      return new Response(JSON.stringify({ found: true, part: formatted }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const fallback = INITIAL_ADMIN_PARTS.find(item =>
      item.oemNumbers.some(n => n.toUpperCase().includes(cleanOem))
    );
    if (fallback) {
      return new Response(JSON.stringify({ found: true, part: fallback }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ found: false, message: `No se encontró la referencia OEM '${cleanOem}' en la base de datos.` }), {
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
