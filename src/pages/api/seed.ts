import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { seedGeography, seedShipping, seedSchematicSections, seedOrderStatuses, seedCarriers, seedModelCategories } from '../../db/writers';

export const POST: APIRoute = async () => {
  try {
    const db = getDb();

    // 1. Geography (countries -> states -> cities) in 3NF
    await seedGeography(db);

    // 2. Shipping zones + methods (with normalized mappings) in 3NF
    await seedShipping(db);

    // 3. Schematic sections catalog
    await seedSchematicSections(db);

    // 4. Order statuses + carriers catalogs
    await seedOrderStatuses(db);
    await seedCarriers(db);

    // 5. Model categories catalog
    await seedModelCategories(db);

    return new Response(JSON.stringify({ success: true, message: 'Países, departamentos, ciudades (3NF), zonas y métodos de envío (3NF), secciones de despiece, estados de pedido, transportadoras y categorías de moto sembrados. Los catálogos (marcas, modelos, repuestos, diagramas) se gestionan desde el Panel Admin.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
