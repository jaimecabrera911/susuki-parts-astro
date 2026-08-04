import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ status: "ok", app: "Suzuki Parts Expert Astro" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};
