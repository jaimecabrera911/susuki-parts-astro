import type { APIRoute } from 'astro';
import { DEFAULT_TAX_CONFIG } from '../../data/taxCouponsData';
import type { TaxConfig } from '../../types';

let memoryTaxConfig: TaxConfig = { ...DEFAULT_TAX_CONFIG };

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ success: true, data: memoryTaxConfig }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    if (typeof body.taxRate === 'number') {
      memoryTaxConfig = {
        taxName: body.taxName || 'IVA Colombia',
        taxRate: body.taxRate,
        active: typeof body.active === 'boolean' ? body.active : true,
      };
    }
    return new Response(JSON.stringify({ success: true, data: memoryTaxConfig }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: 'Error actualizando configuración de impuestos' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
