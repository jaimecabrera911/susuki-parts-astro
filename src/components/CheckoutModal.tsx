import React, { useState, useEffect } from "react";
import { X, ShieldCheck, CheckCircle2, Printer, Truck, Globe, Clock } from "lucide-react";
import type { CartItem, ActiveMotorcycle } from "../types";
import { getCartShippingSummary } from "../types";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDocumentNumber } from "../utils/formatDocumentNumber";
import { saveOrderApi, fetchDefaultStatusName } from "../services/api";
import { useSiteSettings } from "./SiteSettingsProvider";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  activeMotorcycle: ActiveMotorcycle | null;
  onOrderComplete: (order: any) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  activeMotorcycle,
  onOrderComplete,
}) => {
  const [name, setName] = useState("Juan Pérez");
  const [address, setAddress] = useState(
    "Av. Central #450, Taller Mecánico Motos",
  );
  const [phone, setPhone] = useState("+57 310 982 7311");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  // Handle Escape key and body scroll lock
  useEffect(() => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const order = {
      id: "SZ-ORD-" + Math.floor(100000 + Math.random() * 900000),
      date: new Date().toISOString(),
      customerName: name,
      shippingAddress: address,
      phone,
      items: [...cartItems],
      totalPrice: total,
      motorcycle: activeMotorcycle,
      guaranteeCode:
        "SZ-CERT-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      status: (await fetchDefaultStatusName()) || "Pendiente de pago",
    };

    let finalOrder = order;
    try {
      const res = await saveOrderApi(order);
      if (res?.data) {
        finalOrder = { ...order, ...res.data };
      }
    } catch (err) {
      console.error("Error guardando orden en BD:", err);
    }

    setCompletedOrder(finalOrder);
    onOrderComplete(finalOrder);
    setIsSubmitting(false);
  };

  return (
    <div
      id="checkout-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 my-auto"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana de checkout"
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-slate-500 hover:text-slate-700 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {!completedOrder ? (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3
                  id="checkout-modal-title"
                  className="text-xl font-black text-slate-900"
                >
                  Checkout con Garantía de Ajuste OEM
                </h3>
                <p className="text-xs text-slate-500">
                  Resumen y validación final de pedido directo de bodega Suzuki
                </p>
              </div>
            </div>

            {/* Guaranteed Vehicle Info */}
            {activeMotorcycle && (
              <div className="bg-slate-900 text-white rounded-xl p-4 mb-6 border border-slate-800 text-xs flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                    CERTIFICADO DE COMPATIBILIDAD
                  </span>
                  <span className="font-black text-sm">
                    {activeMotorcycle.brand} {activeMotorcycle.modelName} (
                    {activeMotorcycle.year})
                  </span>
                  <p className="text-slate-400 mt-0.5">
                    Versión: {activeMotorcycle.version}
                  </p>
                </div>
                <div className="bg-emerald-500/10 text-emerald-300 font-mono text-[11px] px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  100% OK
                </div>
              </div>
            )}

            {/* Shipping & Delivery Estimate Badge / Mixed Banner */}
            <div className={`p-4 rounded-xl mb-6 border text-xs flex items-start gap-3 ${
              shippingSummary.isMixed
                ? 'bg-blue-50/80 border-blue-200 text-blue-950'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <Truck className={`w-5 h-5 shrink-0 mt-0.5 ${shippingSummary.isMixed ? 'text-blue-600' : 'text-emerald-600'}`} />
              <div className="space-y-1 w-full">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold uppercase font-mono text-[11px] tracking-wider text-slate-900">
                    {shippingSummary.isMixed ? 'Envío Consolidado (Pedido Mixto)' : 'Tiempo de Despacho Estimado'}
                  </span>
                  <span className="font-mono font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md text-[11px]">
                    {shippingSummary.maxLeadTimeDays}
                  </span>
                </div>
                {shippingSummary.isMixed ? (
                  <p className="text-[11px] text-blue-800 font-sans leading-relaxed">
                    {shippingSummary.mixedPolicyMessage}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 font-sans">
                    Tiempo estimado de preparación y despacho para los {cartItems.length} {cartItems.length === 1 ? 'repuesto' : 'repuestos'}.
                  </p>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="checkout-name"
                  className="block text-xs font-bold text-slate-700 uppercase mb-1"
                >
                  Nombre Completo / Razón Social
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-address"
                  className="block text-xs font-bold text-slate-700 uppercase mb-1"
                >
                  Dirección de Despacho / Taller
                </label>
                <input
                  id="checkout-address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-phone"
                  className="block text-xs font-bold text-slate-700 uppercase mb-1"
                >
                  Teléfono Móvil de Contacto
                </label>
                <input
                  id="checkout-phone"
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                />
              </div>

              <div className="border-t border-slate-200 pt-4 mt-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    TOTAL PAGO GARANTIZADO
                  </span>
                  <span className="text-lg font-mono font-black text-slate-900">
                    {formatCurrency(total)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 min-h-[44px] bg-[#E60012] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-colors shadow-md flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                >
                  {isSubmitting ? (
                    <span>Generando Despacho...</span>
                  ) : (
                    <span>Confirmar Pedido Garantizado</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Order Complete Dispatch Receipt */
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" aria-hidden="true" />
            </div>

            <h3 className="text-2xl font-black text-slate-900">
              ¡Pedido Generado Exitosamente!
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Orden de despacho registrada con sello de garantía Suzuki
              Repuestos Colombia.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 my-6 text-left space-y-3">
              <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">
                  NÚMERO DE ORDEN:
                </span>
                <span className="font-mono font-extrabold text-slate-900">
                  {formatDocumentNumber(completedOrder.id, completedOrder.prefix, completedOrder.documentNumber)}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">
                  VEHÍCULO ASOCIADO:
                </span>
                <span className="font-bold text-slate-900">
                  {completedOrder.motorcycle?.modelName} (
                  {completedOrder.motorcycle?.year})
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">
                  TOTAL FACTURADO:
                </span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  {formatCurrency(completedOrder.totalPrice)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-6 py-3 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
              >
                <Printer
                  className="w-4 h-4 text-slate-600"
                  aria-hidden="true"
                />
                <span>Imprimir Pedidotu</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-3 min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
              >
                Cerrar y Ver Pedidos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
