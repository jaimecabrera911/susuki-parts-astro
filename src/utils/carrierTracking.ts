/**
 * Helper utility for carrier tracking URLs and metadata in Colombia.
 */

export interface CarrierBadgeInfo {
  name: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  brandColor: string;
}

/**
 * Returns brand metadata for styling carrier badges in UI.
 */
export function getCarrierBadgeInfo(carrierName?: string | null): CarrierBadgeInfo {
  const norm = (carrierName || '').toLowerCase().trim();

  if (norm.includes('servientrega')) {
    return {
      name: 'Servientrega',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-800',
      badgeBorder: 'border-emerald-200',
      brandColor: '#00875A',
    };
  }
  if (norm.includes('inter') || norm.includes('rapidismo') || norm.includes('rapidisimo')) {
    return {
      name: 'Inter Rapidísimo',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-900',
      badgeBorder: 'border-amber-200',
      brandColor: '#D97706',
    };
  }
  if (norm.includes('coordinadora')) {
    return {
      name: 'Coordinadora',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-900',
      badgeBorder: 'border-blue-200',
      brandColor: '#1D4ED8',
    };
  }
  if (norm.includes('envia') || norm.includes('colvanes')) {
    return {
      name: 'Envía Colvanes',
      badgeBg: 'bg-red-50',
      badgeText: 'text-red-900',
      badgeBorder: 'border-red-200',
      brandColor: '#DC2626',
    };
  }
  if (norm.includes('tcc')) {
    return {
      name: 'TCC',
      badgeBg: 'bg-yellow-50',
      badgeText: 'text-yellow-900',
      badgeBorder: 'border-yellow-200',
      brandColor: '#CA8A04',
    };
  }
  if (norm.includes('deprisa')) {
    return {
      name: 'Deprisa',
      badgeBg: 'bg-sky-50',
      badgeText: 'text-sky-900',
      badgeBorder: 'border-sky-200',
      brandColor: '#0284C7',
    };
  }
  if (norm.includes('retiro') || norm.includes('tienda') || norm.includes('recogida')) {
    return {
      name: 'Retiro en Tienda',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-900',
      badgeBorder: 'border-purple-200',
      brandColor: '#7C3AED',
    };
  }

  return {
    name: carrierName || 'Transportadora Local',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-300',
    brandColor: '#475569',
  };
}

/**
 * Builds direct official tracking URL for standard Colombian carriers.
 * If customUrl is provided by admin, it takes precedence.
 */
export function getCarrierTrackingUrl(
  carrierName?: string | null,
  trackingNumber?: string | null,
  customUrl?: string | null
): string | null {
  if (customUrl && customUrl.trim()) {
    return customUrl.trim();
  }

  if (!trackingNumber || !trackingNumber.trim()) {
    return null;
  }

  const cleanNum = trackingNumber.trim();
  const norm = (carrierName || '').toLowerCase().trim();

  if (norm.includes('servientrega')) {
    return `https://www.servientrega.com/wps/portal/Colombia/transaccional/rastreo-envios?guia=${cleanNum}`;
  }
  if (norm.includes('inter') || norm.includes('rapidismo') || norm.includes('rapidisimo')) {
    return `https://www.interrapidisimo.com/sigue-tu-envio/?guia=${cleanNum}`;
  }
  if (norm.includes('coordinadora')) {
    return `https://www.coordinadora.com/portafolio-de-servicios/servicios-en-linea/rastrear-guias/?guia=${cleanNum}`;
  }
  if (norm.includes('envia') || norm.includes('colvanes')) {
    return `https://envia.co/rastreo-de-envio?guia=${cleanNum}`;
  }
  if (norm.includes('tcc')) {
    return `https://tcc.com.co/logistica/rastrear-envio/?guia=${cleanNum}`;
  }
  if (norm.includes('deprisa')) {
    return `https://www.deprisa.com/rastreo?guia=${cleanNum}`;
  }
  if (norm.includes('encoexpress')) {
    return `https://encoexpress.com.co/`;
  }

  return null;
}
