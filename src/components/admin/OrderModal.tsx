import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, User, MapPin, Truck, ShieldCheck, CheckCircle2, Clock, Package, AlertCircle, FileText, ExternalLink, Lock, Globe, Send, MessageSquare } from 'lucide-react';
import type { Order, OrderStatus, OrderMessage } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';
import { fetchDefaultCarrierName, sendOrderMessageApi } from '../../services/api';
import { parseOrderNotes, formatOrderMessageTime } from '../../utils/orderNotes';
import { getStoredUser } from '../../utils/auth';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSaveOrder: (updatedOrder: Order) => void;
}

interface StatusOption {
  id: string;
  name: string;
  color: string;
}

const STATUS_THEMES: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-[#0A3088] border-blue-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200'
};

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onSaveOrder
}) => {
  if (!isOpen || !order) return null;

  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [carrierOptions, setCarrierOptions] = useState<string[]>([]);
  const [defaultCarrier, setDefaultCarrier] = useState<string>('');

  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [shippingCarrier, setShippingCarrier] = useState<string>(order.shippingCarrier || '');
  const [trackingNumber, setTrackingNumber] = useState<string>(order.trackingNumber || '');
  const [notes, setNotes] = useState<string>(order.notes || '');

  // Admin Order Chat & Private Notes State
  const [orderMessages, setOrderMessages] = useState<OrderMessage[]>([]);
  const [adminMsgText, setAdminMsgText] = useState<string>('');
  const [isPrivateToggle, setIsPrivateToggle] = useState<boolean>(false);
  const [isSubmittingAdminMsg, setIsSubmittingAdminMsg] = useState<boolean>(false);

  const handleSendAdminMsg = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = adminMsgText.trim();
    if (!trimmed || !order?.id || isSubmittingAdminMsg) return;

    setIsSubmittingAdminMsg(true);
    try {
      // Always identify admin sender independently from customer session
      // to avoid naming confusion when both sessions share localStorage.
      const currentUser = getStoredUser();
      const isCurrentUserAdmin = currentUser?.role === 'admin';
      const adminName = isCurrentUserAdmin
        ? (currentUser?.fullName || 'Soporte Suzuki')
        : 'Soporte Suzuki (Admin)';

      const res = await sendOrderMessageApi(order.id, trimmed, 'admin', adminName, isPrivateToggle);
      if (res.success && Array.isArray(res.data)) {
        setOrderMessages(res.data);
        setAdminMsgText('');
      } else if (!res.success) {
        console.error('Error del servidor al enviar mensaje admin:', res.error);
      }
    } catch (err) {
      console.error('Error enviando mensaje administrativo:', err);
    } finally {
      setIsSubmittingAdminMsg(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/api/order-statuses')
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        setStatusOptions(((json?.data) || []).filter((s: any) => s.active));
      })
      .catch(() => { if (!cancelled) setStatusOptions([]); });
    fetch('/api/carriers')
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        setCarrierOptions(((json?.data) || []).filter((c: any) => c.active).map((c: any) => c.name));
      })
      .catch(() => { if (!cancelled) setCarrierOptions([]); });
    fetchDefaultCarrierName()
      .then(name => { if (!cancelled) setDefaultCarrier(name); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setShippingCarrier(order.shippingCarrier || '');
      setTrackingNumber(order.trackingNumber || '');
      setNotes(order.notes || '');
      // Initialize chat messages from order notes on every order change
      setOrderMessages(parseOrderNotes(order.notes, order.customerName));
    }
  }, [order]);

  // Default the carrier to the DB default once the catalog is loaded
  useEffect(() => {
    if ((defaultCarrier || carrierOptions[0]) && !shippingCarrier) {
      setShippingCarrier(defaultCarrier || carrierOptions[0]);
    }
  }, [carrierOptions, defaultCarrier]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Order = {
      ...order,
      status,
      shippingCarrier: shippingCarrier.trim(),
      trackingNumber: trackingNumber.trim(),
      notes: notes.trim()
    };
    onSaveOrder(updated);
    onClose();
  };

  const getStatusTheme = (st: OrderStatus) => {
    const found = statusOptions.find(s => s.name === st);
    return STATUS_THEMES[found?.color || 'slate'] || STATUS_THEMES.slate;
  };

  return (
    <div id="order-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-[95vw] md:max-w-4xl lg:max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 md:px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0 pr-4">
            <div className="w-11 h-11 rounded-2xl bg-red-50 text-[#E60012] border border-red-200 flex items-center justify-center shrink-0 shadow-xs">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 font-display truncate">
                  Pedido {order.id}
                </h2>
                <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getStatusTheme(status)}`}>
                  {status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Registrado el {order.date} • Garantía: {order.guaranteeCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
          
          {/* Customer & Shipping Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Customer Info Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase font-mono border-b border-slate-200 pb-2">
                <User className="w-4 h-4 text-[#0A3088]" />
                <span>Información del Cliente</span>
              </div>
              <div className="text-xs space-y-1 pt-1 font-medium">
                <p className="font-bold text-slate-900 text-sm font-display">{order.customerName}</p>
                <p className="text-slate-600 font-mono"><span className="font-bold text-slate-400">CC / NIT:</span> {order.documentId}</p>
                <p className="text-slate-600 font-mono"><span className="font-bold text-slate-400">Email:</span> {order.email}</p>
                <p className="text-slate-600 font-mono"><span className="font-bold text-slate-400">Teléfono:</span> {order.phone}</p>
              </div>
            </div>

            {/* Shipping Address Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase font-mono border-b border-slate-200 pb-2">
                <MapPin className="w-4 h-4 text-[#059669]" />
                <span>Dirección de Envío</span>
              </div>
              <div className="text-xs space-y-1 pt-1 font-medium">
                <p className="font-bold text-slate-900 text-sm font-display">{order.city}</p>
                <p className="text-slate-600">{order.shippingAddress}</p>
                <p className="text-slate-600 font-mono"><span className="font-bold text-slate-400">Código Postal:</span> {order.postalCode}</p>
                <p className="text-slate-600 font-mono"><span className="font-bold text-slate-400">Método Pago:</span> {order.paymentMethod.toUpperCase()}</p>
              </div>
            </div>

          </div>

          {/* Items Purchased Table */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <span className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
              Repuestos Solicitados ({order.items.length})
            </span>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase font-mono">
                    <th className="py-2.5 px-3">Repuesto OEM</th>
                    <th className="py-2.5 px-3 text-center">Cantidad</th>
                    <th className="py-2.5 px-3 text-right">Precio Unitario</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-0.5 shrink-0">
                            {item.part.image ? (
                              <img src={item.part.image} alt={item.part.name} className="w-full h-full object-contain" />
                            ) : (
                              <Package className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 font-display">{item.part.name}</p>
                            <p className="text-[10px] font-mono text-slate-500 font-bold">
                              OEM: {item.part.oemNumbers[0]} • Modelo: {item.motorcycle.modelName} ({item.motorcycle.year})
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {item.quantity} ud.
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                        {formatCurrency(item.part.price)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#E60012]">
                        {formatCurrency(item.part.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Repuestos:</span>
                <span className="font-bold text-slate-900">{formatCurrency(order.subtotal ?? order.totalPrice)}</span>
              </div>
              {order.discount && order.discount > 0 ? (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Descuento ({order.discountCode || 'Cupón'}):</span>
                  <span>- {formatCurrency(order.discount)}</span>
                </div>
              ) : null}
              {order.taxAmount && order.taxAmount > 0 ? (
                <div className="flex justify-between text-slate-600">
                  <span>Impuesto ({order.taxRate || 19}% IVA):</span>
                  <span className="font-bold text-slate-900">+ {formatCurrency(order.taxAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-slate-600">
                <span>Envío ({order.shippingCarrier || defaultCarrier}):</span>
                <span className="font-bold text-slate-900">{order.shippingCost === 0 || !order.shippingCost ? '¡Flete GRATIS!' : formatCurrency(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between text-slate-900 pt-2 border-t border-slate-200 font-black text-sm font-display">
                <span>Total Facturado:</span>
                <span className="font-mono text-[#E60012] text-base font-black">{formatCurrency(order.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Logistics & Order Management Controls */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <span className="text-xs font-bold text-slate-900 uppercase font-mono flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#0A3088]" />
              <span>Gestión de Estado & Logística de Despacho</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                  Estado del Pedido *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E60012]"
                >
                  {statusOptions.length === 0 && (
                    <option value="" disabled>Cargando estados...</option>
                  )}
                  {statusOptions.map(st => (
                    <option key={st.id} value={st.name}>{st.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                  Empresa de Transportes
                </label>
                <select
                  value={shippingCarrier}
                  onChange={(e) => setShippingCarrier(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E60012]"
                >
                  {carrierOptions.length === 0 && (
                    <option value="" disabled>Cargando transportadoras...</option>
                  )}
                  {carrierOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                  Número de Guía de Transporte
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Ej. SE789456123CO"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E60012]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                  Notas de Despacho & Observaciones Internas
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Añade notas sobre el empaque, guía de envío o soporte de pago..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#E60012] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Admin Order Chat & Internal Notes Panel */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase font-mono flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#0A3088]" />
                <span>Historial de Conversación & Notas Internas de Bodega</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono font-bold">
                {orderMessages.length} registros
              </span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1 bg-white p-3 rounded-xl border border-slate-200">
              {orderMessages.length === 0 ? (
                <p className="text-slate-400 text-center py-3 font-mono text-[11px]">
                  Sin mensajes ni notas registradas en este pedido.
                </p>
              ) : (
                orderMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'admin' ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-slate-500">
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase flex items-center gap-1 ${
                          msg.isPrivate
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : msg.sender === 'admin'
                            ? 'bg-sky-100 text-[#0A3088] border border-sky-200'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {msg.isPrivate ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                        {msg.isPrivate ? 'Nota Interna Bodega' : (msg.senderName || (msg.sender === 'admin' ? 'Soporte' : 'Cliente'))}
                      </span>
                      {msg.timestamp && (
                        <>
                          <span>•</span>
                          <span className="text-[10px] text-slate-400 font-medium">{formatOrderMessageTime(msg.timestamp)}</span>
                        </>
                      )}
                    </div>
                    <div
                      className={`p-2.5 rounded-2xl text-xs font-sans leading-relaxed shadow-2xs max-w-[85%] ${
                        msg.isPrivate
                          ? 'bg-amber-50 text-amber-950 border border-amber-200 rounded-tl-none font-medium'
                          : msg.sender === 'admin'
                          ? 'bg-[#0A3088] text-white rounded-tl-none'
                          : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-tr-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Admin Message Input & Privacy Toggle Form */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono font-bold text-slate-600">Tipo de mensaje a registrar:</span>
                <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setIsPrivateToggle(false)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-colors flex items-center gap-1 ${
                      !isPrivateToggle ? 'bg-[#0A3088] text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Globe className="w-3 h-3" /> Público (Verá el Cliente)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrivateToggle(true)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-colors flex items-center gap-1 ${
                      isPrivateToggle ? 'bg-amber-500 text-slate-950' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Lock className="w-3 h-3" /> Nota Privada (Solo Bodega)
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={adminMsgText}
                  onChange={(e) => setAdminMsgText(e.target.value)}
                  placeholder={isPrivateToggle ? "Escribe una nota interna para el equipo de bodega..." : "Escribe una respuesta para el cliente..."}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-sans text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20"
                />
                <button
                  type="button"
                  onClick={handleSendAdminMsg}
                  disabled={!adminMsgText.trim() || isSubmittingAdminMsg}
                  className={`px-4 py-2 disabled:opacity-50 text-xs font-bold uppercase rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs ${
                    isPrivateToggle ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-[#E60012] hover:bg-red-700 text-white'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isPrivateToggle ? 'Guardar Nota' : 'Enviar Respuesta'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Cambios de Pedido</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
