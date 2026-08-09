export const NEON_API_BASE_URL = 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1';

export type ImageFolder = 'models' | 'parts' | 'schematics' | 'brands' | 'users';

export function getImageUrl(url: string | null | undefined, folder: ImageFolder = 'parts', defaultId?: string): string {
  if (!url) {
    return `${NEON_API_BASE_URL}/${folder}/${defaultId || 'default'}.jpg`;
  }
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  return `${NEON_API_BASE_URL}/${folder}/${cleanPath}`;
}
