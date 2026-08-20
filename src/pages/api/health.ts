import type { APIRoute } from 'astro';
import { db } from '../../db/client';
import { getStoreName } from '../../utils/config';

export const GET: APIRoute = async () => {
  try {
    return new Response(JSON.stringify({
      status: "ok",
      app: getStoreName(),
      database: "Neon PostgreSQL",
      connected: !!db
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ status: "error", error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
