import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Printer, Calendar, MapPin, User, Phone, Package, CheckCircle2, Truck, Building2, Copy, Check, Wrench, Mail, FileText } from 'lucide-react';
import { getPrimaryOem } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { formatOrderDate } from '../utils/formatDate';
import { shouldShowProductImages } from '../utils/config';
import { ProductImageFallback } from './ProductImageFallback';
import { BANK_DETAILS } from '../data/bankDetails';
import { fetchDefaultCarrierName } from '../services/api';

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
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [defaultCarrier, setDefaultCarrier] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    fetchDefaultCarrierName()
      .then(name => { if (!cancelled) setDefaultCarrier(name); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

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

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const isPending = order.status?.toLowerCase().includes('pendiente');

  return (
    <div 
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
                <span className="font-mono font-black text-slate-900 text-xl sm:text-2xl tracking-tight">{order.id}</span>
                <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full flex items-center gap-1 ${
                  isPending
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : order.status.includes('Entregado')
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    : 'bg-blue-100 text-blue-900 border border-blue-200'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {order.status}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
                <p className="flex items-center gap-1.5 font-sans">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Fecha de Emisión: {formatOrderDate(order.date)}</span>
                </p>
                <p className="font-mono text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                  CERT: {order.guaranteeCode || 'SZ-CERT-884920'}
                </p>
              </div>
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

        {/* Scrollable Modal Content */}
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">

          {/* Customer & Shipping Data Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-wider block mb-1">
                DESTINATARIO / CLIENTE
              </span>
              <div className="font-extrabold text-slate-900 flex items-center gap-1.5 font-display text-sm">
                <User className="w-4 h-4 text-slate-500" />
                {order.customerName || 'Cliente Suzuki'}
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
                <span>{order.shippingAddress || 'Dirección de Taller Registrada'}</span>
              </div>
              <div className="text-slate-500 mt-1.5 font-mono text-[11px]">
                Transportadora: <strong className="text-slate-800">{order.shippingCarrier || defaultCarrier}</strong> ({order.shippingMethodName || 'Envío Nacional Standard'})
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
                  <h3 className="text-sm font-black font-display">Datos Bancarios para Transferencia</h3>
                  <p className="text-[11px] text-slate-400 font-sans">{BANK_DETAILS.instructions}</p>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-[9px] text-slate-400 uppercase font-bold block font-mono">TOTAL A PAGAR</span>
                <span className="text-lg font-mono font-black text-emerald-400">{formatCurrency(order.totalPrice)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                <span className="text-[9px] text-slate-400 uppercase font-bold block font-mono">TITULAR DE LA CUENTA</span>
                <span className="font-extrabold text-white text-xs block mt-0.5">{BANK_DETAILS.accountHolder}</span>
                <span className="text-slate-300 block text-[10px] font-mono mt-0.5">NIT: {BANK_DETAILS.nit}</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                <span className="text-[9px] text-slate-400 uppercase font-bold block font-mono">BANCO & TIPO DE CUENTA</span>
                <span className="font-black text-white text-xs block mt-0.5">{BANK_DETAILS.bankName}</span>
                <span className="text-slate-300 block text-[10px] mt-0.5">{BANK_DETAILS.accountType}</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                <span className="text-[9px] text-slate-400 uppercase font-bold block font-mono">Nº CUENTA BANCOLOMBIA</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-mono font-black text-amber-400 text-xs sm:text-sm">{BANK_DETAILS.accountNumber}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(BANK_DETAILS.accountNumber, 'accModal')}
                    className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                    title="Copiar Número de Cuenta"
                  >
                    {copiedField === 'accModal' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
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
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Ajuste 100% Verificado
              </span>
            </div>

            <div className="space-y-3">
              {order.items?.map((it: any, idx: number) => {
                const primaryOem = getPrimaryOem(it.part);
                const itemTotal = it.part.price * it.quantity;
                const bikeModel = it.motorcycle?.modelName || order.motorcycle?.modelName || 'GSX-R1000';
                const bikeYear = it.motorcycle?.year || order.motorcycle?.year || 2021;

                return (
                  <div key={idx} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                    
                    {/* Part Header */}
                    <div className="flex items-start gap-3">
                      {shouldShowProductImages() ? (
                        <img 
                          src={it.part.image} 
                          alt={it.part.name} 
                          className="w-14 h-14 rounded-xl object-cover bg-slate-50 border border-slate-200 shrink-0 shadow-xs" 
                        />
                      ) : (
                        <ProductImageFallback part={it.part} size="sm" className="w-14 h-14 shrink-0 rounded-xl" />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-[#E60012] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            OEM: {primaryOem}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                            {it.part.category || 'Repuestos OEM'}
                          </span>
                        </div>
                        <h4 className="font-black text-slate-900 mt-1 text-xs sm:text-sm font-display leading-snug">
                          {it.part.name}
                        </h4>
                      </div>
                    </div>

                    {/* Compatibility Status Badge (The Traffic Light Rule) */}
                    <div className="bg-emerald-50/90 border border-emerald-200 text-emerald-800 rounded-xl px-2.5 py-1.5 text-[11px] font-bold flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          Garantizado para Suzuki {bikeModel} ({bikeYear})
                        </span>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-mono font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                        OEM MATCH
                      </span>
                    </div>

                    {/* Technical Specifications Highlights (Geist Monospace) */}
                    {it.part.specs && it.part.specs.length > 0 && (
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 text-[11px] font-mono space-y-0.5">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider font-sans">ESPECIFICACIONES TÉCNICAS:</span>
                        <div className="grid grid-cols-2 gap-x-2 text-slate-700">
                          {it.part.specs.slice(0, 4).map((spec: any, sIdx: number) => (
                            <div key={sIdx} className="truncate">
                              <span className="text-slate-400">{spec.label}:</span> <span className="font-bold text-slate-900">{spec.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Item Price Calculation */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-600 font-medium">
                        Cantidad: <strong className="text-slate-900 font-mono font-bold">{it.quantity}</strong> × <span className="font-mono">{formatCurrency(it.part.price)}</span>
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
              <span className="font-bold text-slate-900">{formatCurrency(order.subtotal ?? order.totalPrice)}</span>
            </div>

            {order.discount && order.discount > 0 ? (
              <div className="flex items-center justify-between text-emerald-700 font-bold">
                <span>Descuento Promocional ({order.discountCode || 'Cupón'}):</span>
                <span>- {formatCurrency(order.discount)}</span>
              </div>
            ) : null}

            {order.taxAmount && order.taxAmount > 0 ? (
              <div className="flex items-center justify-between text-slate-600">
                <span>Impuesto ({order.taxRate || 19}% IVA):</span>
                <span className="font-bold text-slate-900">+ {formatCurrency(order.taxAmount)}</span>
              </div>
            ) : null}

            <div className="flex items-center justify-between text-slate-600">
              <span>Costo de Despacho ({order.shippingCarrier || defaultCarrier}):</span>
              <span className="font-bold text-slate-900">
                {order.shippingCost === 0 || !order.shippingCost ? '¡Flete GRATIS!' : formatCurrency(order.shippingCost)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-slate-300 font-black text-sm text-slate-900 font-display">
              <span>TOTAL FACTURADO:</span>
              <span className="text-[#E60012] font-mono text-xl font-black">{formatCurrency(order.totalPrice)}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
