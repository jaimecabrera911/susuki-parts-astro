import type { APIRoute } from 'astro';
import { verifyJwtToken } from '../../utils/jwt';
import { uploadImage } from '../../utils/storage';

function isAdminRequest(request: Request): boolean {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const payload = token ? verifyJwtToken(token) : null;
  return Boolean(payload && payload.role && payload.role !== 'customer');
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
    
    if (!file || typeof file === 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Se requiere un archivo de imagen válido (PNG, JPG, WEBP, SVG).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fileName = (file as any).name || `imagen-${Date.now()}.png`;
    const ext = fileName.split('.').pop()?.toLowerCase() || 'png';
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      gif: 'image/gif'
    };
    const contentType = (file as any).type || mimeTypes[ext] || 'image/png';

    if (!contentType.startsWith('image/')) {
      return new Response(
        JSON.stringify({ success: false, error: 'El archivo debe ser una imagen válida (PNG, JPG, WEBP, SVG, GIF).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const safeName = fileName.replace(/[^a-z0-9.\-]+/gi, '-').toLowerCase() || `imagen-${Date.now()}.${ext}`;
    const key = `${folder}/img-${Date.now()}-${safeName}`;
    const arrayBuf = await (file as Blob).arrayBuffer();
    const body = Buffer.from(arrayBuf);

    const url = await uploadImage({ body, key, contentType });
    return new Response(
      JSON.stringify({ success: true, data: { url, key } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error en POST /api/upload:', error?.message || error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Error subiendo la imagen al almacenamiento de la tienda'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};