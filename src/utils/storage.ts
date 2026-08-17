import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

function getEnv(key: string): string {
  const val = import.meta.env?.[key] ?? process.env?.[key];
  return typeof val === 'string' ? val : '';
}

export function getStorageBucket(): string {
  return getEnv('AWS_S3_BUCKET_NAME') || 'moto-parts-bucket';
}

function getClient(): S3Client | null {
  const endpoint = getEnv('AWS_ENDPOINT_URL_S3');
  const accessKeyId = getEnv('AWS_ACCESS_KEY_ID');
  const secretAccessKey = getEnv('AWS_SECRET_ACCESS_KEY');
  if (!endpoint || !accessKeyId || !secretAccessKey) {
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

  if (!client) {
    throw new Error('Credenciales de almacenamiento S3/Neon Storage no configuradas.');
  }

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
}