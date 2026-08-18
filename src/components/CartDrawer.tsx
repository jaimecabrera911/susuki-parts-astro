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
} from "lucide-react";
import { FaBasketShopping, FaCartShopping } from "react-icons/fa6";
import { AiTwotoneSafetyCertificate } from "react-icons/ai";
import type { CartItem, ActiveMotorcycle, SuzukiPart } from "../types";
import { getPrimaryOem } from "../types";
import { formatCurrency } from "../utils/formatCurrency";
import { getCartWhatsAppUrl } from "../utils/whatsapp";
import { shouldShowProductImages } from "../utils/config";
import { ProductImageEmptyState } from "./ProductImageEmptyState";
import { IoChatbubbleEllipses } from "react-icons/io5";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (partId: string, delta: number) => void;
  onRemoveItem: (partId: string) => void;
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

  if (!isOpen) return null;

  const total = cartItems.reduce(
    (acc, item) => acc + item.part.price * item.quantity,
    0,
  );

  return (
    <div
      id="cart-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end"
    >
      <div className="w-full pl-0 sm:pl-10 h-full flex justify-end">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-full sm:max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200 h-full"
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
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
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
              cartItems.map((item) => {
                const vehicleLabel = item.motorcycle
                  ? `${item.motorcycle.modelName} (${item.motorcycle.year})`
                  : activeMotorcycle
                    ? `${activeMotorcycle.modelName} (${activeMotorcycle.year})`
                    : "Vehículo Seleccionado";

                return (
                  <div
                    key={item.part.id}
                    className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 flex gap-3 relative transition-all group"
                  >
                    {shouldShowProductImages() ? (
                      <img
                        src={item.part.image}
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
                          {getPrimaryOem(item.part)}
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

                      <div className="text-xs font-mono font-black text-slate-900 mt-1.5">
                        {formatCurrency(item.part.price)}
                      </div>

                      {/* Quantity Controls with Min 44x44px Touch Targets */}
                      <div
                        className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.part.id, -1)}
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
                            onClick={() => onUpdateQuantity(item.part.id, 1)}
                            className="w-11 h-11 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                            aria-label={`Aumentar cantidad de ${item.part.name}`}
                          >
                            <Plus className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.part.id)}
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
            <div className="p-5 border-t border-slate-200 bg-white space-y-3 shrink-0">
              {/* Free Shipping Progress Indicator */}
              {(() => {
                const FREE_THRESHOLD = 250000;
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
