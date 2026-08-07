import React, { useEffect } from 'react';
import { X, ShieldCheck, Printer, Calendar, MapPin, User, Phone, Package, CheckCircle2, Truck } from 'lucide-react';
import { getPrimaryOem } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { shouldShowProductImages } from '../utils/config';
import { ProductImageFallback } from './ProductImageFallback';


interface OrderDetailModalProps {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Gradient Banner */}
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
                <span className="font-mono font-black text-slate-900 text-xl tracking-tight">{order.id}</span>
                <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full flex items-center gap-1 ${
                  order.status.includes('Pendiente')
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : order.status.includes('Entregado')
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-blue-100 text-blue-900'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {order.status}
                </span>

              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Fecha de Emisión: {order.date}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Imprimir Certificado</span>
            </button>
          </div>
        </div>

        {/* Shipping & Customer Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              DESTINATARIO / CLIENTE
            </span>
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              {order.customerName || 'Cliente Suzuki'}
            </div>
            {order.phone && (
              <div className="text-slate-600 mt-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {order.phone}
              </div>
            )}
          </div>

          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              DIRECCIÓN DE DESPACHO
            </span>
            <div className="font-semibold text-slate-800 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#E60012] shrink-0 mt-0.5" />
              <span>{order.shippingAddress || 'Dirección de Taller Registrada'}</span>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3 mb-6">
          <span className="text-xs font-black uppercase text-slate-700 tracking-wider block">
            REPUESTOS INCLUIDOS ({order.items.length}):
          </span>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {order.items.map((it: any, idx: number) => {
              const primaryOem = getPrimaryOem(it.part);
              const itemTotal = it.part.price * it.quantity;
              const bikeLabel = it.motorcycle 
                ? `${it.motorcycle.brand} ${it.motorcycle.modelName} (${it.motorcycle.year})` 
                : (order.motorcycle ? `${order.motorcycle.brand} ${order.motorcycle.modelName} (${order.motorcycle.year})` : 'Compatibilidad General');

              return (
                <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs shadow-2xs">
                  <div className="flex items-center gap-3">
                    {shouldShowProductImages() ? (
                      <img 
                        src={it.part.image} 
                        alt={it.part.name} 
                        className="w-12 h-12 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0" 
                      />
                    ) : (
                      <ProductImageFallback part={it.part} size="sm" className="w-12 h-12 shrink-0" />
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-[#E60012] bg-red-50 px-2 py-0.5 rounded border border-red-100">
                          OEM: {primaryOem}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          🏍️ {bikeLabel}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 mt-1 line-clamp-1">{it.part.name}</h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {formatCurrency(it.part.price)} x {it.quantity} ud.
                      </p>
                    </div>
                  </div>
                  <div className="text-right font-mono font-black text-slate-900 text-sm shrink-0">
                    {formatCurrency(itemTotal)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        {/* Total Summary Footer */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>Envío Nacional Asegurado: <strong className="text-emerald-400">Gratis ($0)</strong></span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">TOTAL FACTURADO</span>
            <span className="text-xl font-mono font-black text-white">{formatCurrency(order.totalPrice)}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
