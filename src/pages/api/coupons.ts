import type { APIRoute } from 'astro';
import { INITIAL_COUPONS } from '../../data/taxCouponsData';
import type { Coupon } from '../../types';

let memoryCoupons: Coupon[] = [...INITIAL_COUPONS];

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ success: true, data: memoryCoupons }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    if (Array.isArray(body)) {
      memoryCoupons = body;
    } else if (body.id && body.code) {
      const idx = memoryCoupons.findIndex(c => c.id === body.id);
      if (idx >= 0) {
        memoryCoupons[idx] = body;
      } else {
        memoryCoupons.unshift(body);
      }
    }
    return new Response(JSON.stringify({ success: true, data: memoryCoupons }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: 'Error guardando cupón de descuento' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
