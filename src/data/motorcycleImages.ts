export const MOTORCYCLE_PNGS: Record<string, string> = {
  'gixxer-150-fi': '/motorcycles/gixxer-150-fi.png',
  'gixxer-250': '/motorcycles/gixxer-250.png',
  'gsx-r1000': '/motorcycles/gsx-r1000.png',
  'vstrom-650': '/motorcycles/vstrom-650.png',
  'dr-650': '/motorcycles/dr-650.png',
  'gn-125': '/motorcycles/gn-125.png',
};

export const getMotorcyclePng = (modelId: string): string =>
  MOTORCYCLE_PNGS[modelId] ?? '/motorcycles/gsx-r1000.png';
