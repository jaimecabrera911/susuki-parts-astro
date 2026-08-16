import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { reviews } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { ensureUuid } from '../../db/writers';

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const partId = url.searchParams.get('partId');
    let data;
    if (partId) {
      data = await db.select().from(reviews).where(eq(reviews.partId, partId));
    } else {
      data = await db.select().from(reviews);
    }
    return new Response(JSON.stringify({ success: true, count: data.length, data }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();

    const newReview = {
      id: ensureUuid(body.id),
      partId: body.partId,
      userId: ensureUuid(body.userId),
      userName: body.userName || 'Cliente Suzuki',
      rating: Number(body.rating || 5),
      title: body.title || 'Reseña de producto',
      comment: body.comment || '',
      verifiedPurchase: body.verifiedPurchase !== undefined ? body.verifiedPurchase : true,
      createdAt: body.createdAt ? new Date(body.createdAt) : new Date()
    };

    await db.insert(reviews).values(newReview).onConflictDoNothing();

    return new Response(JSON.stringify({ success: true, data: newReview }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const id = url.searchParams.get('id');
    if (!id) throw new Error('Parámetro "id" es requerido');

    await db.delete(reviews).where(eq(reviews.id, id));

    return new Response(JSON.stringify({ success: true, message: `Reseña ${id} eliminada` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
