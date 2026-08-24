import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { parts, partOemNumbers } from '../../db/schema';
import { like, inArray } from 'drizzle-orm';
import { formatParts } from '../../db/writers';

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

    const oemRows = await db.select({ partId: partOemNumbers.partId }).from(partOemNumbers).where(like(partOemNumbers.oemNumber, `%${cleanOem}%`));
    const ids = [...new Set(oemRows.map(r => r.partId))];

    if (ids.length) {
      const rawParts = await db.select().from(parts).where(inArray(parts.id, ids)).limit(1);
      const [formatted] = await formatParts(db, rawParts);
      if (formatted) {
        const primaryOem = formatted.oemNumbers?.[0] || formatted.sku;
        const matchedOem = formatted.oemNumbers?.find((o: string) => o.toUpperCase().includes(cleanOem)) || cleanOem;
        const isSuperseded = Boolean(
          formatted.oemNumbers &&
          formatted.oemNumbers.length > 1 &&
          primaryOem.toUpperCase() !== matchedOem.toUpperCase()
        );

        return new Response(JSON.stringify({
          found: true,
          part: formatted,
          supersession: isSuperseded ? {
            searchedOem: matchedOem,
            currentOem: primaryOem,
            isSuperseded: true
          } : null
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
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
