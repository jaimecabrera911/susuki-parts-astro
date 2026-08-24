import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

function getEnv(key: string): string {
  const val = import.meta.env?.[key] ?? process.env?.[key];
  return typeof val === 'string' ? val : '';
}

export function getStorageBucket(): string {
  return getEnv('AWS_S3_BUCKET_NAME') || 'moto-parts-bucket';
}

function getClient(): S3Client | null {
  const endpoint = getEnv('AWS_ENDPOINT_URL_S3').trim();
  const accessKeyId = getEnv('AWS_ACCESS_KEY_ID').trim();
  const secretAccessKey = getEnv('AWS_SECRET_ACCESS_KEY').trim();

  // El endpoint debe ser una URL HTTP o HTTPS válida (no una URL de postgresql:// ni placeholders)
  if (
    !endpoint ||
    !accessKeyId ||
    !secretAccessKey ||
    (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) ||
    endpoint.includes('tu-endpoint') ||
    accessKeyId.includes('tu_access_key')
  ) {
    return null;
  }

  return new S3Client({
    region: getEnv('AWS_REGION') || 'us-east-2',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

export async function uploadImage(params: {
  body: Buffer;
  key: string;
  contentType: string;
}): Promise<string> {
  const client = getClient();
  const bucket = getStorageBucket();

  // 1. Si hay cliente S3 con endpoint HTTP/HTTPS válido, subir a la nube
  if (client) {
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: params.key,
          Body: params.body,
          ContentType: params.contentType,
        }),
      );
      const endpoint = getEnv('AWS_ENDPOINT_URL_S3').replace(/\/+$/, '');
      return `${endpoint}/${bucket}/${params.key}`;
    } catch (s3Error: any) {
      console.warn('Error al subir a S3, guardando imagen directamente en base de datos Neon:', s3Error?.message);
    }
  }

  // 2. Si no hay S3 configurado, convertir a Data URL para persistir directamente en Neon PostgreSQL
  const base64 = params.body.toString('base64');
  return `data:${params.contentType};base64,${base64}`;
}