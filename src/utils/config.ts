/**
 * Global helper to determine whether product images should be rendered.
 * If PUBLIC_SHOW_PRODUCT_IMAGES is set to 'false', product images are hidden
 * across all cards, drawers, order tables, checkout pages, and detail views.
 * If the environment variable is not defined or set to 'true', images are shown by default.
 */
export const shouldShowProductImages = (): boolean => {
  const envVal = import.meta.env.PUBLIC_SHOW_PRODUCT_IMAGES;
  if (envVal === 'false' || envVal === false) {
    return false;
  }
  return true;
};
