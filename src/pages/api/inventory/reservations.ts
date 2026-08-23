import type { APIRoute } from 'astro';
import { getDb } from '../../../db/client';
import {
  getActiveStockReservations,
  expireOverdueReservations,
  extendStockReservation,
  releaseStockReservation,
  consumeStockReservation,
  getInventoryReservationSettings,
  upsertInventoryReservationSettings
} from '../../../db/writers';
import { verifyJwtToken } from '../../../utils/jwt';

function getUserFromRequest(request: Request): any | null {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  return token ? verifyJwtToken(token) : null;
}

export const GET: APIRoute = async ({ url, request }) => {
  try {
    const db = getDb();
    const action = url.searchParams.get('action');

    if (action === 'settings') {
      const settings = await getInventoryReservationSettings(db);
      return new Response(JSON.stringify({ success: true, data: settings }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Default GET: Fetch active reservations & summary stats
    const reservations = await getActiveStockReservations(db);
    const activeList = reservations.filter(r => r.status === 'active' && !r.isExpired);
    const expiredList = reservations.filter(r => r.isExpired || r.status === 'expired');

    const stats = {
      totalActive: activeList.length,
      totalReservedUnits: activeList.reduce((sum, r) => sum + (r.quantity || 0), 0),
      totalExpired: expiredList.length
    };

    return new Response(JSON.stringify({
      success: true,
      stats,
      data: reservations
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en GET /api/inventory/reservations:', error?.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const user = getUserFromRequest(request);
    const body = await request.json();
    const action = body.action || 'expire_overdue';

    if (action === 'settings') {
      const updated = await upsertInventoryReservationSettings(db, body.settings || body);
      return new Response(JSON.stringify({ success: true, data: updated }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'expire_overdue') {
      const result = await expireOverdueReservations(db);
      return new Response(JSON.stringify({
        success: true,
        message: `Se procesaron ${result.expiredCount} reservas vencidas.`,
        data: result
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'extend') {
      if (!body.orderId) throw new Error('El ID del pedido (orderId) es requerido para extender el tiempo de reserva');
      const additionalMinutes = Number(body.additionalMinutes || body.minutes || 60);
      const reason = body.reason || 'Solicitud de prórroga concedida';
      const adminName = user?.fullName || body.adminName || 'Administrador';

      const result = await extendStockReservation(db, {
        orderId: body.orderId,
        additionalMinutes,
        reason,
        adminName
      });

      return new Response(JSON.stringify({
        success: true,
        data: result,
        message: `Tiempo de reserva extendido exitosamente (+${additionalMinutes} min)`
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'release') {
      if (!body.orderId) throw new Error('El ID del pedido (orderId) es requerido para liberar la reserva');
      const reason = body.reason || 'Liberación manual de reserva';
      const targetStatus = body.status || 'Cancelado';
      const performer = user?.fullName || 'Administrador';

      let result: any = null;
      await db.transaction(async (tx) => {
        result = await releaseStockReservation(tx, body.orderId, reason, targetStatus, performer);
      });

      return new Response(JSON.stringify({
        success: true,
        data: result,
        message: 'Reserva de stock liberada exitosamente'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'consume') {
      if (!body.orderId) throw new Error('El ID del pedido (orderId) es requerido para consumir la reserva');
      const performer = user?.fullName || 'Administrador';

      let result: any = null;
      await db.transaction(async (tx) => {
        result = await consumeStockReservation(tx, body.orderId, performer);
      });

      return new Response(JSON.stringify({
        success: true,
        data: result,
        message: 'Reserva confirmada y stock descontado exitosamente'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    throw new Error(`Acción desconocida: "${action}"`);
  } catch (error: any) {
    console.error('Error en POST /api/inventory/reservations:', error?.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
