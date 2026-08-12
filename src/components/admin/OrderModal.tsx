import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, User, MapPin, Truck, ShieldCheck, CheckCircle2, Clock, Package, AlertCircle, FileText, ExternalLink } from 'lucide-react';
import type { Order, OrderStatus } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSaveOrder: (updatedOrder: Order) => void;
}

const ORDER_STATUSES: OrderStatus[] = [
  'Pendiente de pago',
  'Pago confirmado',
  'Despachado en Bodega Central',
  'En tránsito',
  'Entregado',
  'Cancelado'
];

const CARRIER_OPTIONS = [
  'Servientrega',
  'Deprisa',
  'Encoexpress',
  'Interrapidísimo',
  'Coordinadora',
  'Envía Colvanes'
];

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onSaveOrder
}) => {
  if (!isOpen || !order) return null;

  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [shippingCarrier, setShippingCarrier] = useState<string>(order.shippingCarrier || CARRIER_OPTIONS[0]);
  const [trackingNumber, setTrackingNumber] = useState<string>(order.trackingNumber || '');
  const [notes, setNotes] = useState<string>(order.notes || '');

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setShippingCarrier(order.shippingCarrier || CARRIER_OPTIONS[0]);
      setTrackingNumber(order.trackingNumber || '');
      setNotes(order.notes || '');
    }
  }, [order]);

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
    switch (st) {
      case 'Pendiente de pago':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Pago confirmado':
        return 'bg-blue-50 text-[#0A3088] border-blue-200';
      case 'Despachado en Bodega Central':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'En tránsito':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Entregado':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelado':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto">
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
                <span>Envío ({order.shippingCarrier || 'Servientrega'}):</span>
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
                  {ORDER_STATUSES.map(st => (
                    <option key={st} value={st}>{st}</option>
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
                  {CARRIER_OPTIONS.map(c => (
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
