import type { FooterConfig, SiteSettings, SocialLinks } from '../types';

/**
 * Valores bootstrap de la tienda (documented config module).
 * Fuente única para el seed del primer arranque de `site_settings`.
 * En runtime la fuente de verdad es la BD (site_settings), no estas constantes.
 */
export const STORE_BOOTSTRAP = {
  storeName: 'Suzuki Parts Expert',
  storeLogo: '',
  storeTagline: 'REPUESTOS COLOMBIA',
  whatsappNumber: '573009128888',
  contactEmail: 'admin@suzukiparts.com.co',
  storeAddress: '',
  socialLinks: {
    facebook: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    whatsapp: ''
  },
  location: {
    country: 'CO',
    department: '11',
    city: '11001'
  }
};

export const FOOTER_BOOTSTRAP: FooterConfig = {
  tagline: 'REPUESTOS COLOMBIA',
  description:
    'Sistema oficial de consulta y suministro de repuestos con garantía de ajuste técnico OEM.',
  copyright: '© 2026 SUZUKI REPUESTOS COLOMBIA | INDUSTRIAL PRECISION',
  legalLinks: [
    { label: 'Technical Specifications', href: '#tutorial' },
    { label: 'OEM Verification Process', href: '#oem-verification' },
    { label: 'Shipping Policy & Warranty', href: '#shipping-policy' },
    { label: 'Privacy Compliance', href: '#privacy' }
  ]
};

/**
 * Default operating location for the store (currently Colombia-only).
 * Mantiene el nombre histórico para columnas default del schema y el seed.
 */
export const STORE_DEFAULT_LOCATION = STORE_BOOTSTRAP.location;

/**
 * Valor bootstrap para "mostrar imágenes": se lee del env únicamente para el
 * seed del primer arranque. Después, la BD es la fuente de verdad en runtime.
 * Si la variable no está definida o es distinta de 'false', se muestran.
 */
export const getBootstrapShowProductImages = (): boolean => {
  const envVal = import.meta.env?.PUBLIC_SHOW_PRODUCT_IMAGES;
  if (envVal === 'false' || envVal === false) return false;
  return true;
};

/**
 * Estado neutro vacío, usado como valor inicial antes de cargar la BD y como
 * base al mezclar datos parciales. Nunca contiene valores de negocio fabricados.
 */
export const emptySiteSettings = (): SiteSettings => ({
  id: 'default',
  storeName: '',
  storeLogo: '',
  storeTagline: '',
  whatsappNumber: '',
  contactEmail: '',
  storeAddress: '',
  socialLinks: undefined,
  defaultCountry: '',
  defaultDepartment: '',
  defaultCity: '',
  showProductImages: false,
  taxName: '',
  taxRate: 0,
  taxActive: false,
  returnMaxDays: 0,
  footerConfig: undefined,
  updatedAt: ''
});

let currentSettings: SiteSettings = emptySiteSettings();

// En el cliente, usa la configuración real que el server ya cargó desde la BD
// (inyectada por Layout.astro como window.__SITE_SETTINGS__) para evitar el
// flash de los valores bootstrap antes del fetch de /api/settings.
if (typeof window !== 'undefined') {
  const injected = (window as unknown as { __SITE_SETTINGS__?: Partial<SiteSettings> })
    .__SITE_SETTINGS__;
  if (injected) {
    currentSettings = { ...emptySiteSettings(), ...injected };
  }
}

/**
 * Actualiza la caché de configuración con los valores persistidos en la BD.
 * Lo invoca el SiteSettingsProvider tras fetchear `/api/settings`.
 */
export function setSiteSettingsFromDb(data: Partial<SiteSettings>) {
  currentSettings = { ...emptySiteSettings(), ...data };
}

export function getSiteSettingsSnapshot(): SiteSettings {
  return currentSettings;
}

export const shouldShowProductImages = (): boolean =>
  getSiteSettingsSnapshot().showProductImages === true;

export const getWhatsAppNumber = (): string =>
  getSiteSettingsSnapshot().whatsappNumber;

export const getStoreName = (): string =>
  getSiteSettingsSnapshot().storeName;

export const getStoreTagline = (): string =>
  getSiteSettingsSnapshot().storeTagline;

export const getStoreLogo = (): string =>
  getSiteSettingsSnapshot().storeLogo;

export const getFooterConfig = (): FooterConfig | null => {
  const snap = getSiteSettingsSnapshot();
  if (!snap.footerConfig) {
    return null;
  }
  return snap.footerConfig;
};

export const getContactEmail = (): string =>
  getSiteSettingsSnapshot().contactEmail;

export const getStoreAddress = (): string =>
  getSiteSettingsSnapshot().storeAddress;

export const getSocialLinks = (): SocialLinks | null =>
  getSiteSettingsSnapshot().socialLinks ?? null;

export const getDefaultLocation = () => {
  const snap = getSiteSettingsSnapshot();
  return {
    country: snap.defaultCountry,
    department: snap.defaultDepartment,
    city: snap.defaultCity
  };
};

export const getTaxConfig = () => {
  const snap = getSiteSettingsSnapshot();
  return {
    taxName: snap.taxName,
    taxRate: typeof snap.taxRate === 'number' ? snap.taxRate : null,
    active: snap.taxActive === true
  };
};

export const getReturnMaxDays = (): number | null => {
  const snap = getSiteSettingsSnapshot();
  return typeof snap.returnMaxDays === 'number' ? snap.returnMaxDays : null;
};
