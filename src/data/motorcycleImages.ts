export const MOTORCYCLE_PNGS: Record<string, string> = {
  'gixxer-150-fi': '/motorcycles/gixxer-150-fi.png',
  'gixxer-150': '/motorcycles/gixxer-150-fi.png',
  'gixxer-250': '/motorcycles/gixxer-250.png',
  'gsx-r1000': '/motorcycles/gsx-r1000.png',
  'vstrom-650': '/motorcycles/vstrom-650.png',
  'dr-650': '/motorcycles/dr-650.png',
  'gn-125': '/motorcycles/gn-125.png',
  'gn125': '/motorcycles/gn-125.png'
};

export const getMotorcyclePng = (modelId: string): string => {
  if (!modelId) return '';
  
  // Exact match
  if (MOTORCYCLE_PNGS[modelId]) return MOTORCYCLE_PNGS[modelId];

  // Normalized matching (ignores hyphens, spaces, uppercase)
  const normalized = modelId.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (normalized.includes('gn125')) return MOTORCYCLE_PNGS['gn-125'];
  if (normalized.includes('gixxer250')) return MOTORCYCLE_PNGS['gixxer-250'];
  if (normalized.includes('gixxer150') || normalized.includes('gixxer')) return MOTORCYCLE_PNGS['gixxer-150-fi'];
  if (normalized.includes('vstrom650') || normalized.includes('vstrom')) return MOTORCYCLE_PNGS['vstrom-650'];
  if (normalized.includes('dr650') || normalized.includes('dr')) return MOTORCYCLE_PNGS['dr-650'];
  if (normalized.includes('gsxr1000') || normalized.includes('gsxr')) return MOTORCYCLE_PNGS['gsx-r1000'];

  return '';
};
