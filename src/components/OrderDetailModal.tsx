import React, { useState, useEffect } from "react";
import { UserAvatar } from "./UserAvatar";
import { ReturnRequestModal } from "./ReturnRequestModal";
import { ReturnStatusTimeline } from "./ReturnStatusTimeline";
import {
  X,
  ShieldCheck,
  Printer,
  Calendar,
  MapPin,
  User,
  Phone,
  Package,
  CheckCircle2,
  Truck,
  Building2,
  Copy,
  Check,
  Wrench,
  Mail,
  FileText,
  RotateCcw,
  Send,
  MessageSquare,
} from "lucide-react";
import { getPrimaryOem } from "../types";
import { formatCurrency } from "../utils/formatCurrency";
import { formatOrderDate } from "../utils/formatDate";
import { shouldShowProductImages } from "../utils/config";
import { ProductImageFallback } from "./ProductImageFallback";
import { BANK_DETAILS } from "../data/bankDetails";
import {
  fetchDefaultCarrierName,
  fetchReturns,
  saveReturnApi,
  sendOrderMessageApi,
} from "../services/api";
import { parseReturnNotes, formatMessageTime } from "../utils/returnNotes";
import { parseOrderNotes, formatOrderMessageTime } from "../utils/orderNotes";

interface OrderDetailModalProps {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [defaultCarrier, setDefaultCarrier] = useState<string>("");
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [activeReturn, setActiveReturn] = useState<any | null>(null);
  const [customerMessage, setCustomerMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Order Chat state
  const [orderMessages, setOrderMessages] = useState<any[]>([]);
  const [orderInputText, setOrderInputText] = useState("");
  const [isSendingOrderMsg, setIsSendingOrderMsg] = useState(false);

  useEffect(() => {
    if (order?.notes) {
      setOrderMessages(parseOrderNotes(order.notes, order.customerName));
    } else {
      setOrderMessages([]);
    }
  }, [order?.notes, order?.customerName]);

  const handleSendOrderMsg = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = orderInputText.trim();
    if (!trimmed || !order?.id || isSendingOrderMsg) return;

    setIsSendingOrderMsg(true);
    try {
      const res = await sendOrderMessageApi(
        order.id,
        trimmed,
        "customer",
        order.customerName,
        false,
      );
      if (res.success && Array.isArray(res.data)) {
        setOrderMessages(res.data);
        setOrderInputText("");
      }
    } catch (err) {
      console.error("Error enviando mensaje del pedido:", err);
    } finally {
      setIsSendingOrderMsg(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchDefaultCarrierName()
      .then((name) => {
        if (!cancelled) setDefaultCarrier(name);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isOpen && order?.id) {
      fetchReturns(undefined, undefined, order.id)
        .then((returns) => {
          if (returns && returns.length > 0) {
            setActiveReturn(returns[0]);
          } else {
            setActiveReturn(null);
          }
        })
        .catch(() => setActiveReturn(null));
    } else {
      setActiveReturn(null);
    }
  }, [isOpen, order?.id]);

  const handleSendCustomerMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customerMessage.trim();
    if (!trimmed || !activeReturn || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      const existingNotes = parseReturnNotes(
        activeReturn.notes,
        order?.customerName || "Cliente",
      );
      const newMsg = {
        id: `msg-${Date.now()}`,
        sender: "customer",
        senderName: order?.customerName || "Cliente",
        text: trimmed,
        timestamp: new Date().toISOString(),
      };
      const updatedNotesList = [...existingNotes, newMsg];
      const updatedReturn = {
        ...activeReturn,
        notes: JSON.stringify(updatedNotesList),
        updatedAt: new Date().toISOString(),
      };

      await saveReturnApi(updatedReturn);
      setActiveReturn(updatedReturn);
      setCustomerMessage("");
    } catch (err) {
      console.error("Error enviando mensaje de devolución:", err);
    } finally {
      setIsSendingMessage(false);
    }
  };

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

  if (!isOpen || !order) return null;

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const isPending = order.status?.toLowerCase().includes("pendiente");

  return (
    <div
      id="order-detail-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Gradient Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#E60012] via-amber-500 to-emerald-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalles del pedido"
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-slate-100 pb-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-slate-900 text-xl sm:text-2xl tracking-tight">
                  {order.id}
                </span>
                <span
                  className={`text-xs font-bold uppercase px-3 py-1 rounded-full flex items-center gap-1 ${
                    isPending
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : order.status.includes("Entregado")
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                        : "bg-blue-100 text-blue-900 border border-blue-200"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {order.status}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
                <p className="flex items-center gap-1.5 font-sans">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Fecha de Emisión: {formatOrderDate(order.date)}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Imprimir Pedido</span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
          {/* Customer & Shipping Data Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-wider block mb-1">
                DESTINATARIO / CLIENTE
              </span>
              <div className="font-extrabold text-slate-900 flex items-center gap-2 font-display text-sm">
                <UserAvatar
                  fullName={order.customerName}
                  className="w-6 h-6"
                  textClassName="text-[10px]"
                />
                <span>{order.customerName || "Cliente no registrado"}</span>
              </div>
              {order.phone && (
                <div className="text-slate-600 mt-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {order.phone} {order.email && `(${order.email})`}
                </div>
              )}
              {order.documentId && (
                <div className="text-slate-500 font-mono mt-0.5 text-[11px]">
                  Cédula / NIT: <strong>{order.documentId}</strong>
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-wider block mb-1">
                DIRECCIÓN & LUGAR DE DESPACHO
              </span>
              <div className="font-semibold text-slate-800 flex items-start gap-1.5 text-xs">
                <MapPin className="w-4 h-4 text-[#E60012] shrink-0 mt-0.5" />
                <span>
                  {order.shippingAddress || "Dirección no registrada"}
                </span>
              </div>
              <div className="text-slate-500 mt-1.5 font-mono text-[11px]">
                Transportadora:{" "}
                <strong className="text-slate-800">
                  {order.shippingCarrier || defaultCarrier}
                </strong>{" "}
                ({order.shippingMethodName || "No especificado"})
              </div>
            </div>
          </div>

          {/* Bank Transfer Payment Card (Always visible if Pending or for reference) */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md border border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-3 mb-3 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black text-sm shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black font-display">
                    Datos Bancarios para Transferencia
                  </h3>
                  <p className="text-[11px] text-slate-400 font-sans">
                    {BANK_DETAILS.instructions}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-[9px] text-slate-400 uppercase font-bold block font-mono">
                  TOTAL A PAGAR
                </span>
                <span className="text-lg font-mono font-black text-emerald-400">
                  {formatCurrency(order.totalPrice)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                <span className="text-[9px] text-slate-400 uppercase font-bold block font-mono">
                  TITULAR DE LA CUENTA
                </span>
                <span className="font-extrabold text-white text-xs block mt-0.5">
                  {BANK_DETAILS.accountHolder}
                </span>
                <span className="text-slate-300 block text-[10px] font-mono mt-0.5">
                  NIT: {BANK_DETAILS.nit}
                </span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                <span className="text-[9px] text-slate-400 uppercase font-bold block font-mono">
                  BANCO & TIPO DE CUENTA
                </span>
                <span className="font-black text-white text-xs block mt-0.5">
                  {BANK_DETAILS.bankName}
                </span>
                <span className="text-slate-300 block text-[10px] mt-0.5">
                  {BANK_DETAILS.accountType}
                </span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                <span className="text-[9px] text-slate-400 uppercase font-bold block font-mono">
                  Nº CUENTA BANCOLOMBIA
                </span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-mono font-black text-amber-400 text-xs sm:text-sm">
                    {BANK_DETAILS.accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(BANK_DETAILS.accountNumber, "accModal")
                    }
                    className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                    title="Copiar Número de Cuenta"
                  >
                    {copiedField === "accModal" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Items List (Repuestos Incluidos) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-900 tracking-wider block font-display">
                REPUESTOS INCLUIDOS EN ESTE PEDIDO ({order.items?.length || 0}):
              </span>
            </div>

            <div className="space-y-3">
              {order.items?.map((it: any, idx: number) => {
                const primaryOem = getPrimaryOem(it.part);
                const itemTotal = it.part.price * it.quantity;
                const bikeBrand =
                  it.motorcycle?.brand || order.motorcycle?.brand || "";
                const bikeModel =
                  it.motorcycle?.modelName || order.motorcycle?.modelName || "";
                const bikeYear =
                  it.motorcycle?.year || order.motorcycle?.year || "";

                return (
                  <div
                    key={idx}
                    className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5"
                  >
                    {/* Part Header */}
                    <div className="flex items-start gap-3">
                      {shouldShowProductImages() ? (
                        <img
                          src={it.part.image}
                          alt={it.part.name}
                          className="w-14 h-14 rounded-xl object-cover bg-slate-50 border border-slate-200 shrink-0 shadow-xs"
                        />
                      ) : (
                        <ProductImageFallback
                          part={it.part}
                          size="sm"
                          className="w-14 h-14 shrink-0 rounded-xl"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-[#E60012] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            OEM: {primaryOem}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                            {it.part.category || "Repuestos OEM"}
                          </span>
                        </div>
                        <h4 className="font-black text-slate-900 mt-1 text-xs sm:text-sm font-display leading-snug">
                          {it.part.name}
                        </h4>
                      </div>

                      {/* Compatibility Status Badge (The Traffic Light Rule) */}
                      <div className="bg-emerald-50/90 border border-emerald-200 text-emerald-800 rounded-xl px-2.5 py-1.5 text-[11px] font-bold shrink-0 ml-2">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">
                            {[bikeBrand, bikeModel, bikeYear && `(${bikeYear})`]
                              .filter(Boolean)
                              .join(" ") || "moto no especificada"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Item Price Calculation */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-600 font-medium">
                        Cantidad:{" "}
                        <strong className="text-slate-900 font-mono font-bold">
                          {it.quantity}
                        </strong>{" "}
                        ×{" "}
                        <span className="font-mono">
                          {formatCurrency(it.part.price)}
                        </span>
                      </span>
                      <span className="font-mono font-black text-slate-900 text-sm">
                        {formatCurrency(itemTotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs space-y-2 font-mono">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal Repuestos OEM:</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(order.subtotal ?? order.totalPrice)}
              </span>
            </div>

            {order.discount && order.discount > 0 ? (
              <div className="flex items-center justify-between text-emerald-700 font-bold">
                <span>
                  Descuento Promocional ({order.discountCode || "Cupón"}):
                </span>
                <span>- {formatCurrency(order.discount)}</span>
              </div>
            ) : null}

            {order.taxAmount && order.taxAmount > 0 ? (
              <div className="flex items-center justify-between text-slate-600">
                <span>Impuesto ({order.taxRate || 19}% IVA):</span>
                <span className="font-bold text-slate-900">
                  + {formatCurrency(order.taxAmount)}
                </span>
              </div>
            ) : null}

            <div className="flex items-center justify-between text-slate-600">
              <span>
                Costo de Despacho ({order.shippingCarrier || defaultCarrier}):
              </span>
              <span className="font-bold text-slate-900">
                {order.shippingCost === 0 || !order.shippingCost
                  ? "¡Flete GRATIS!"
                  : formatCurrency(order.shippingCost)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-slate-300 font-black text-sm text-slate-900 font-display">
              <span>TOTAL FACTURADO:</span>
              <span className="text-[#E60012] font-mono text-xl font-black">
                {formatCurrency(order.totalPrice)}
              </span>
            </div>

            {/* Request Return Button OR Return Status Banner */}
            <div className="pt-3">
              {activeReturn ? (
                <div className="p-5 bg-[#f7f9fb] text-slate-900 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-5 h-5 text-amber-600" />
                      <span className="font-black text-xs uppercase tracking-wider font-display text-slate-900">
                        Trámite de Devolución {activeReturn.id}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-extrabold uppercase px-3 py-1 rounded-full border ${
                        activeReturn.status === "Pendiente"
                          ? "bg-amber-50 text-amber-900 border-amber-300"
                          : activeReturn.status === "Aprobada" ||
                              activeReturn.status === "En tránsito"
                            ? "bg-sky-50 text-sky-900 border-sky-300"
                            : activeReturn.status === "Reembolsada"
                              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                              : "bg-red-50 text-red-900 border-red-300"
                      }`}
                    >
                      {activeReturn.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center py-1 font-mono text-[9px]">
                    <div
                      className={`p-1.5 rounded-xl font-bold transition-all ${activeReturn.status === "Pendiente" ? "bg-amber-500 text-slate-950 font-black shadow-xs" : "bg-slate-200/80 text-slate-500 border border-slate-300"}`}
                    >
                      1. Solicitada
                    </div>
                    <div
                      className={`p-1.5 rounded-xl font-bold transition-all ${activeReturn.status === "Aprobada" ? "bg-sky-600 text-white font-black shadow-xs" : "bg-slate-200/80 text-slate-500 border border-slate-300"}`}
                    >
                      2. Aprobada
                    </div>
                    <div
                      className={`p-1.5 rounded-xl font-bold transition-all ${activeReturn.status === "En tránsito" || activeReturn.status === "Pieza recibida" ? "bg-indigo-600 text-white font-black shadow-xs" : "bg-slate-200/80 text-slate-500 border border-slate-300"}`}
                    >
                      3. En Tránsito
                    </div>
                    <div
                      className={`p-1.5 rounded-xl font-bold transition-all ${activeReturn.status === "Reembolsada" ? "bg-emerald-600 text-white font-black shadow-xs" : activeReturn.status === "Rechazada" ? "bg-red-600 text-white font-black" : "bg-slate-200/80 text-slate-500 border border-slate-300"}`}
                    >
                      {activeReturn.status === "Rechazada"
                        ? "Rechazada"
                        : "4. Reembolsada"}
                    </div>
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-700 font-sans">
                    <p>
                      <strong>Motivo:</strong> {activeReturn.reason}
                    </p>
                    <p>
                      <strong>Solución Solicitada:</strong>{" "}
                      <span className="font-bold text-slate-900">
                        {activeReturn.isUnpaidCancel ||
                        order?.paymentStatus === "pending" ||
                        order?.status === "Pendiente"
                          ? "🚫 Anulación sin Desembolso ($0 COP)"
                          : activeReturn.resolutionType === "exchange"
                            ? "🔄 Cambio de Repuesto"
                            : activeReturn.resolutionType === "store_credit"
                              ? "🏷️ Bono de Tienda"
                              : "💵 Reembolso de Dinero"}
                      </span>
                    </p>
                    {activeReturn.returnTrackingNumber && (
                      <p>
                        <strong>Guía de Envío Retorno:</strong>{" "}
                        <span className="font-bold text-slate-900">
                          {activeReturn.returnCarrier} #
                          {activeReturn.returnTrackingNumber}
                        </span>
                      </p>
                    )}
                    {activeReturn.refundAmount > 0 && (
                      <p>
                        <strong>Monto Reembolso:</strong>{" "}
                        <span className="text-emerald-700 font-mono font-black text-sm">
                          {formatCurrency(activeReturn.refundAmount)}
                        </span>{" "}
                        {activeReturn.refundMethod
                          ? `(${activeReturn.refundMethod})`
                          : ""}
                      </p>
                    )}
                    {activeReturn.refundReference && (
                      <p className="text-[11px] font-mono text-slate-500">
                        Ref. Pago: {activeReturn.refundReference}
                      </p>
                    )}
                  </div>

                  {/* Chat / Historial de Conversación y Envío de Mensajes */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-200">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#E60012]" />
                      HISTORIAL DE CONVERSACIÓN & NOTAS DE SOPORTE
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 bg-white p-3 rounded-2xl border border-slate-200">
                      {parseReturnNotes(
                        activeReturn.notes,
                        activeReturn.customerName || order?.customerName,
                      ).length === 0 ? (
                        <p className="text-slate-400 text-center py-3 font-mono text-[11px]">
                          Sin mensajes en la conversación.
                        </p>
                      ) : (
                        parseReturnNotes(
                          activeReturn.notes,
                          activeReturn.customerName || order?.customerName,
                        ).map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col ${msg.sender === "admin" ? "items-start" : "items-end"}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-slate-500">
                              <span
                                className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase ${msg.sender === "admin" ? "bg-red-100 text-[#E60012] border border-red-200" : "bg-slate-200 text-slate-800"}`}
                              >
                                {msg.senderName ||
                                  (msg.sender === "admin"
                                    ? "Soporte Suzuki"
                                    : "Tú")}
                              </span>
                              {msg.timestamp && (
                                <>
                                  <span>•</span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {formatMessageTime(msg.timestamp)}
                                  </span>
                                </>
                              )}
                            </div>
                            <div
                              className={`p-2.5 rounded-2xl text-xs font-sans leading-relaxed shadow-2xs max-w-[85%] ${
                                msg.sender === "admin"
                                  ? "bg-slate-900 text-white rounded-tl-none"
                                  : "bg-slate-100 text-slate-900 border border-slate-200 rounded-tr-none"
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Customer Message Input Box */}
                    <form
                      onSubmit={handleSendCustomerMessage}
                      className="flex gap-2 pt-1"
                    >
                      <input
                        type="text"
                        value={customerMessage}
                        onChange={(e) => setCustomerMessage(e.target.value)}
                        placeholder="Escribe tu mensaje o respuesta para soporte..."
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-sans text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20"
                      />
                      <button
                        type="submit"
                        disabled={!customerMessage.trim() || isSendingMessage}
                        className="px-4 py-2 bg-[#E60012] hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold uppercase rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar</span>
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowReturnModal(true)}
                  className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Solicitar Devolución / Garantía (RMA)</span>
                </button>
              )}
            </div>

            {/* Chat / Conversación & Soporte Directo del Pedido */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#0A3088]" />
                  CONVERSACIÓN & SOPORTE DEL PEDIDO
                </p>
                <span className="text-[10px] text-slate-500 font-mono font-bold">
                  {orderMessages.filter((m) => !m.isPrivate).length} mensajes
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 bg-white p-3 rounded-xl border border-slate-200">
                {orderMessages.filter((m) => !m.isPrivate).length === 0 ? (
                  <p className="text-slate-400 text-center py-3 font-mono text-[11px]">
                    ¿Tienes alguna duda sobre tu pedido o pago? Escribe un
                    mensaje a nuestro equipo de soporte.
                  </p>
                ) : (
                  orderMessages
                    .filter((m) => !m.isPrivate)
                    .map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${msg.sender === "admin" ? "items-start" : "items-end"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-slate-500">
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase ${msg.sender === "admin" ? "bg-sky-100 text-[#0A3088] border border-sky-200" : "bg-slate-200 text-slate-800"}`}
                          >
                            {msg.senderName ||
                              (msg.sender === "admin"
                                ? "Soporte Suzuki"
                                : "Tú")}
                          </span>
                          {msg.timestamp && (
                            <>
                              <span>•</span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {formatOrderMessageTime(msg.timestamp)}
                              </span>
                            </>
                          )}
                        </div>
                        <div
                          className={`p-2.5 rounded-2xl text-xs font-sans leading-relaxed shadow-2xs max-w-[85%] ${
                            msg.sender === "admin"
                              ? "bg-[#0A3088] text-white rounded-tl-none"
                              : "bg-slate-100 text-slate-900 border border-slate-200 rounded-tr-none"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* Order Message Input Box */}
              <form onSubmit={handleSendOrderMsg} className="flex gap-2">
                <input
                  type="text"
                  value={orderInputText}
                  onChange={(e) => setOrderInputText(e.target.value)}
                  placeholder="Escribe tu consulta sobre el pedido..."
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-sans text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0A3088] focus:ring-2 focus:ring-[#0A3088]/20"
                />
                <button
                  type="submit"
                  disabled={!orderInputText.trim() || isSendingOrderMsg}
                  className="px-4 py-2 bg-[#0A3088] hover:bg-[#3d59b1] disabled:opacity-50 text-white text-xs font-bold uppercase rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <ReturnRequestModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        order={order}
        onSuccess={() => {
          setShowReturnModal(false);
          if (order?.id) {
            fetchReturns(undefined, undefined, order.id)
              .then((returns) => {
                if (returns && returns.length > 0) setActiveReturn(returns[0]);
              })
              .catch(() => {});
          }
        }}
      />
    </div>
  );
};
