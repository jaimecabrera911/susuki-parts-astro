import React from "react";
import {
  X,
  Trash2,
  ArrowRight,
  Plus,
  Minus,
  MessageSquare,
  Eye,
  Store,
  Truck,
  Globe,
  Clock,
} from "lucide-react";
import { FaBasketShopping, FaCartShopping } from "react-icons/fa6";
import { AiTwotoneSafetyCertificate } from "react-icons/ai";
import type { CartItem, ActiveMotorcycle, SuzukiPart, ShippingMethod } from "../types";
import { getPrimaryOem, getCartShippingSummary, getVariantTypeLabel, formatVariantAttributes } from "../types";
import { formatCurrency } from "../utils/formatCurrency";
import { getCartWhatsAppUrl } from "../utils/whatsapp";
import { shouldShowProductImages } from "../utils/config";
import { useSiteSettings } from "./SiteSettingsProvider";
import { ProductImageEmptyState } from "./ProductImageEmptyState";
import { IoChatbubbleEllipses } from "react-icons/io5";
import { fetchShippingMethods } from "../services/api";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (partId: string, delta: number, variantId?: string | null) => void;
  onRemoveItem: (partId: string, variantId?: string | null) => void;
  onProceedCheckout: () => void;
  onContinueShopping: () => void;
  onViewPartDetail?: (part: SuzukiPart) => void;
  activeMotorcycle: ActiveMotorcycle | null;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedCheckout,
  onContinueShopping,
  onViewPartDetail,
  activeMotorcycle,
}) => {
  const [freeThreshold, setFreeThreshold] = React.useState<number | null>(null);

  // Load active shipping methods to get real configured free shipping threshold
  React.useEffect(() => {
    if (!isOpen) return;
    fetchShippingMethods()
      .then((methods) => {
        const active = methods?.filter(
          (m: ShippingMethod) => m.active && typeof m.freeShippingThreshold === "number" && m.freeShippingThreshold > 0,
        );
        if (active && active.length > 0) {
          const minThreshold = Math.min(...active.map((m: ShippingMethod) => m.freeShippingThreshold!));
          setFreeThreshold(minThreshold);
        } else {
          setFreeThreshold(null);
        }
      })
      .catch(() => setFreeThreshold(null));
  }, [isOpen]);

  // Handle Escape key and body scroll lock
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const { settings } = useSiteSettings();
  if (!isOpen) return null;

  const total = cartItems.reduce(
    (acc, item) => {
      const price = item.selectedVariant?.price != null ? item.selectedVariant.price : item.part.price;
      return acc + price * item.quantity;
    },
    0,
  );

  const shippingSummary = getCartShippingSummary(cartItems, settings);

  return (
    <div
      id="cart-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      onClick={onClose}
      className="fixed inset-0 z-[70] overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end"
    >
      <div className="w-full pl-0 sm:pl-10 h-full flex justify-end">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-full sm:max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200 h-full max-h-[100dvh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shrink-0">
            <div className="flex items-center gap-2">
              <FaCartShopping
                className="w-5 h-5 text-[#E60012]"
                aria-hidden="true"
              />
              <h3 id="cart-drawer-title" className="font-extrabold text-base">
                Carrito de Repuestos Suzuki
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar carrito"
              className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 min-h-0 p-5 overflow-y-auto space-y-4 custom-scrollbar">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <FaCartShopping
                  className="w-12 h-12 text-slate-300 mb-3"
                  aria-hidden="true"
                />
                <p className="font-bold text-slate-700 text-sm">
                  Tu carrito está vacío
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Selecciona repuestos garantizados desde el catálogo o los
                  diagramas.
                </p>
                <button
                  type="button"
                  onClick={onContinueShopping}
                  className="mt-4 px-5 py-2.5 min-h-[44px] bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-md flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                >
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  <span>Seguir Comprando</span>
                </button>
              </div>
            ) : (
              cartItems.map((item, idx) => {
                const vehicleLabel = item.motorcycle
                  ? `${item.motorcycle.modelName} (${item.motorcycle.year})`
                  : activeMotorcycle
                    ? `${activeMotorcycle.modelName} (${activeMotorcycle.year})`
                    : "Vehículo Seleccionado";
                const itemPrice = item.selectedVariant?.price != null ? item.selectedVariant.price : item.part.price;
                const itemImage = item.selectedVariant?.image || item.part.image;
                const itemOem = item.selectedVariant?.sku || getPrimaryOem(item.part);
                const itemKey = `${item.part.id}-${item.selectedVariant?.id || 'base'}-${idx}`;

                return (
                  <div
                    key={itemKey}
                    className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 flex gap-3 relative transition-all group"
                  >
                    {shouldShowProductImages() ? (
                      <img
                        src={itemImage}
                        alt={item.part.name}
                        onClick={() =>
                          onViewPartDetail && onViewPartDetail(item.part)
                        }
                        className="w-16 h-16 rounded-lg object-cover bg-white border border-slate-200 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    ) : (
                      <div
                        onClick={() =>
                          onViewPartDetail && onViewPartDetail(item.part)
                        }
                      >
                        <ProductImageEmptyState className="w-16 h-16 cursor-pointer" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div
                          onClick={() =>
                            onViewPartDetail && onViewPartDetail(item.part)
                          }
                          className="font-mono text-[10px] font-bold text-[#E60012] cursor-pointer hover:underline"
                        >
                          {itemOem}
                        </div>

                        {onViewPartDetail && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewPartDetail(item.part);
                            }}
                            className="text-slate-500 hover:text-[#E60012] hover:bg-red-50 p-1.5 rounded transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                            title="Ver detalles del repuesto"
                            aria-label={`Ver detalles de ${item.part.name}`}
                          >
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            <span className="text-[10px]">Ver detalle</span>
                          </button>
                        )}
                      </div>

                      <h4
                        onClick={() =>
                          onViewPartDetail && onViewPartDetail(item.part)
                        }
                        className="font-bold text-xs text-slate-900 truncate cursor-pointer hover:text-[#E60012] transition-colors"
                        title={item.part.name}
                      >
                        {item.part.name}
                      </h4>

                      {/* Selected Variant Badge */}
                      {item.selectedVariant && (
                        <div className="mt-1 flex items-center gap-1 flex-wrap">
                          {Array.isArray(item.selectedVariant.attributes) && item.selectedVariant.attributes.length > 0 ? (
                            item.selectedVariant.attributes.map((attr, aIdx) => (
                              <span
                                key={aIdx}
                                className="text-[10px] font-mono text-slate-800 font-bold inline-flex items-center gap-1 bg-slate-100 border border-slate-200/90 px-1.5 py-0.5 rounded shadow-2xs"
                              >
                                {attr.hex && (
                                  <span
                                    className="w-2 h-2 rounded-full border border-black/20 shrink-0"
                                    style={{ backgroundColor: attr.hex }}
                                  />
                                )}
                                <span>
                                  {attr.name}: <strong>{attr.value}</strong>
                                </span>
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] font-mono text-slate-800 font-bold inline-flex items-center gap-1 bg-slate-100 border border-slate-200/90 px-1.5 py-0.5 rounded shadow-2xs">
                              {item.selectedVariant.variantType === 'color' || item.selectedVariant.colorHex ? (
                                <span
                                  className="w-2 h-2 rounded-full border border-black/20 shrink-0"
                                  style={{ backgroundColor: item.selectedVariant.colorHex || '#0045A5' }}
                                />
                              ) : null}
                              <span>{formatVariantAttributes(item.selectedVariant)}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Vehicle Specific Association Badge */}
                      <div
                        onClick={() =>
                          onViewPartDetail && onViewPartDetail(item.part)
                        }
                        className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-900 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/80 px-2 py-0.5 rounded-md w-fit max-w-full truncate cursor-pointer transition-colors"
                      >
                        <AiTwotoneSafetyCertificate
                          className="w-3 h-3 text-emerald-600 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="truncate">
                          Vehículo: {vehicleLabel}
                        </span>
                      </div>

                      {/* Delivery lead time badge */}
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                          item.part.availability === 'international'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : item.part.availability === 'on_order'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {item.part.availability === 'international' ? (
                            <Globe className="w-2.5 h-2.5 text-blue-600" />
                          ) : item.part.availability === 'on_order' ? (
                            <Clock className="w-2.5 h-2.5 text-amber-600" />
                          ) : (
                            <Truck className="w-2.5 h-2.5 text-emerald-600" />
                          )}
                        </span>
                      </div>

                      <div className="text-xs font-mono font-black text-slate-900 mt-1.5">
                        {formatCurrency(itemPrice)}
                      </div>

                      {/* Quantity Controls with Min 44x44px Touch Targets */}
                      <div
                        className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.part.id, -1, item.selectedVariant?.id)}
                            className="w-11 h-11 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                            aria-label={`Disminuir cantidad de ${item.part.name}`}
                          >
                            <Minus className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <span
                            className="text-xs font-mono font-bold px-2 min-w-[24px] text-center"
                            aria-label={`Cantidad: ${item.quantity}`}
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.part.id, 1, item.selectedVariant?.id)}
                            className="w-11 h-11 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                            aria-label={`Aumentar cantidad de ${item.part.name}`}
                          >
                            <Plus className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.part.id, item.selectedVariant?.id)}
                          className="w-11 h-11 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                          title="Eliminar del carrito"
                          aria-label={`Eliminar ${item.part.name} del carrito`}
                        >
                          <Trash2 className="w-5 h-5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-5 pb-6 sm:pb-5 border-t border-slate-200 bg-white space-y-3 shrink-0">
              {/* Free Shipping Progress Indicator (only if configured in DB shipping methods) */}
              {freeThreshold != null && freeThreshold > 0 && (() => {
                const FREE_THRESHOLD = freeThreshold;
                const progressPct = Math.min(
                  100,
                  Math.round((total / FREE_THRESHOLD) * 100),
                );
                const remaining = FREE_THRESHOLD - total;

                return (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                    {total >= FREE_THRESHOLD ? (
                      <div className="flex items-center gap-2 text-emerald-700 font-extrabold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>
                          ¡Felicidades! Tienes ENVÍO GRATIS a nivel nacional
                        </span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                          <span>
                            Faltan{" "}
                            <strong className="text-[#E60012] font-mono">
                              {formatCurrency(remaining)}
                            </strong>{" "}
                            para ENVÍO GRATIS
                          </span>
                          <span className="font-mono text-slate-400">
                            {progressPct}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-[#E60012] transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Mixed Cart Consolidated Shipping Notice */}
              {shippingSummary.isMixed && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
                  <Truck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-[11px] uppercase tracking-wide text-blue-950 block font-mono">
                      Aviso de Envío Consolidado
                    </span>
                    <p className="text-[11px] text-blue-800 font-sans leading-relaxed">
                      {shippingSummary.mixedPolicyMessage}
                    </p>
                    <span className="inline-block text-[10px] font-mono font-bold text-blue-900 mt-0.5">
                      ⏱️ Despacho estimado del paquete: {shippingSummary.maxLeadTimeDays}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1">
                <span>SUBTOTAL REPUESTOS:</span>
                <span className="text-lg text-[#E60012] font-mono font-black">
                  {formatCurrency(total)}
                </span>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={onContinueShopping}
                  className="w-full py-3 min-h-[44px] bg-[#0A3088] hover:bg-[#081f5c] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A3088]"
                >
                  <Store className="w-4 h-4" aria-hidden="true" />
                  <span>Seguir Comprando</span>
                </button>

                <button
                  type="button"
                  onClick={onProceedCheckout}
                  className="w-full py-3 min-h-[44px] bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                >
                  <FaBasketShopping />
                  <span>Completar Pedido</span>
                </button>

                <a
                  href={getCartWhatsAppUrl(cartItems, activeMotorcycle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 min-h-[44px] bg-[#25D366] hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                >
                  <IoChatbubbleEllipses />
                  <span>Cotizar por WhatsApp</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
