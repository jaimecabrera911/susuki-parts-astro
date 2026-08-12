import type { APIRoute } from 'astro';
import { verifyJwtToken } from '../../utils/jwt';
import { uploadImage } from '../../utils/storage';

function isAdminRequest(request: Request): boolean {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const payload = token ? verifyJwtToken(token) : null;
  return Boolean(payload && payload.role === 'admin');
}

export const POST: APIRoute = async ({ request }) => {
  if (!isAdminRequest(request)) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado: se requiere sesión de administrador' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folder = (formData.get('folder') as string) || 'store';
    if (!file || typeof file === 'string' || !file.type.startsWith('image/')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Se requiere un archivo de imagen válido (PNG, JPG, WEBP, SVG).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const safeName = file.name.replace(/[^a-z0-9.\-]+/gi, '-').toLowerCase() || `imagen-${Date.now()}.${ext}`;
    const key = `${folder}/logo-${Date.now()}-${safeName}`;
    const body = Buffer.from(await file.arrayBuffer());

    const url = await uploadImage({ body, key, contentType: file.type });
    return new Response(
      JSON.stringify({ success: true, data: { url, key } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error en POST /api/upload:', error?.message);
    return new Response(
      JSON.stringify({ success: false, error: 'Error subiendo la imagen al almacenamiento de la tienda' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};