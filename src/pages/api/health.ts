import type { APIRoute } from 'astro';
import { db } from '../../db/client';

export const GET: APIRoute = async () => {
  try {
    return new Response(JSON.stringify({
      status: "ok",
      app: "Suzuki Parts Expert Astro",
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
