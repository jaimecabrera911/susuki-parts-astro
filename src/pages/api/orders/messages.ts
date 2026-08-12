import type { APIRoute } from 'astro';
import { getDb } from '../../../db/client';
import { orders } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { parseOrderNotes, formatOrderNotes } from '../../../utils/orderNotes';
import type { OrderMessage } from '../../../types';

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();

    if (!body.orderId || !body.text) {
      throw new Error('Faltan parámetros obligatorios (orderId, text)');
    }

    const orderId = String(body.orderId).trim();
    const existingOrders = await db.select().from(orders).where(eq(orders.id, orderId));

    if (existingOrders.length === 0) {
      throw new Error(`No se encontró el pedido ${orderId}`);
    }

    const targetOrder = existingOrders[0];
    const existingMessages = parseOrderNotes(targetOrder.notes, targetOrder.customerName);

    const newMessage: OrderMessage = {
      id: `msg-${Date.now()}`,
      sender: body.sender === 'admin' ? 'admin' : 'customer',
      // For admin: never fall back to customer name. For customer: use their name.
      senderName: body.sender === 'admin'
        ? (body.senderName || 'Soporte Suzuki')
        : (body.senderName || targetOrder.customerName || 'Cliente'),
      text: String(body.text).trim(),
      isPrivate: Boolean(body.isPrivate),
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...existingMessages, newMessage];
    const notesJson = formatOrderNotes(updatedMessages);

    await db.update(orders).set({ notes: notesJson }).where(eq(orders.id, orderId));

    return new Response(JSON.stringify({ success: true, data: updatedMessages, message: 'Mensaje registrado con éxito' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
