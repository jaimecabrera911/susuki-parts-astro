import React from 'react';
import { 
  X, Truck, DollarSign, Clock, Calendar, ShieldCheck, 
  MapPin, Edit, CheckCircle2, XCircle, AlertCircle, Info 
} from 'lucide-react';
import type { ShippingMethod, ShippingZone } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

interface ShippingViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  method: ShippingMethod | null;
  zones: ShippingZone[];
  onEdit?: (method: ShippingMethod) => void;
}

const CARRIER_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  'Servientrega': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Inter Rapidísimo': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'Coordinadora': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Envía': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'TCC': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Retiro en tienda': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' }
};

const ALL_DAYS = [
  { id: '1', short: 'LUN', full: 'Lunes' },
  { id: '2', short: 'MAR', full: 'Martes' },
  { id: '3', short: 'MIÉ', full: 'Miércoles' },
  { id: '4', short: 'JUE', full: 'Jueves' },
  { id: '5', short: 'VIE', full: 'Viernes' },
  { id: '6', short: 'SÁB', full: 'Sábado' },
  { id: '7', short: 'DOM', full: 'Domingo' }
];

export const ShippingViewModal: React.FC<ShippingViewModalProps> = ({
  isOpen,
  onClose,
  method,
  zones,
  onEdit
}) => {
  if (!isOpen || !method) return null;

  const badgeStyle = CARRIER_BADGES[method.carrier] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200'
  };

  const dispatchDays = method.dispatchDays || ['1', '2', '3', '4', '5'];

  return (
    <div 
      id="shipping-view-modal" 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col font-sans animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5 min-w-0 pr-2">
            <div className="w-11 h-11 rounded-2xl bg-red-50 text-[#E60012] border border-red-200 flex items-center justify-center shrink-0 shadow-xs">
              <Truck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`px-2.5 py-0.5 text-[10px] font-mono font-extrabold uppercase rounded-lg border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                  {method.carrier}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  method.active
                    ? 'bg-emerald-50 text-[#059669] border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {method.active ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                      <span>Activo en Checkout</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-slate-400" />
                      <span>Inactivo / Oculto</span>
                    </>
                  )}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 font-display truncate leading-tight">
                {method.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(method);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold font-sans flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar bg-white">
          
          {/* Resumen Principal de Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans mb-1">
                Flete Base / Fallback
              </span>
              <div className="font-mono text-lg font-black text-slate-900 flex items-center gap-1">
                {method.price === 0 ? (
                  <span className="text-[#059669]">¡Gratis! ($0)</span>
                ) : (
                  formatCurrency(method.price)
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans mb-1">
                Tiempo de Entrega
              </span>
              <div className="font-mono text-lg font-black text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{method.estimatedDays === 0 ? 'Inmediata' : `${method.estimatedDays} días hábiles`}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans mb-1">
                Envío Gratis Desde
              </span>
              <div className="font-mono text-lg font-black text-slate-900">
                {method.freeShippingThreshold ? (
                  <span className="text-[#059669]">{formatCurrency(method.freeShippingThreshold)}</span>
                ) : (
                  <span className="text-slate-400 font-sans text-xs font-semibold">No configurado</span>
                )}
              </div>
            </div>
          </div>

          {/* Descripción */}
          {method.description && (
            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#0A3088] shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-[#0A3088] uppercase tracking-wider block font-sans">
                  Descripción para el Cliente
                </span>
                <p className="text-xs text-slate-700 leading-relaxed mt-0.5">
                  {method.description}
                </p>
              </div>
            </div>
          )}

          {/* Desglose de Tarifas por Zona */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#E60012]" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-sans">
                  Tarifas Específicas por Zona Geográfica
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-500">
                {zones.length} {zones.length === 1 ? 'zona registrada' : 'zonas registradas'}
              </span>
            </div>

            {zones.length === 0 ? (
              <div className="p-4 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                No hay zonas geográficas configuradas en el sistema.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                {zones.map((zone) => {
                  const rateEntry = method.zoneRates?.find(zr => zr.zoneId === zone.id);
                  const effectivePrice = rateEntry !== undefined ? rateEntry.price : method.price;
                  const hasCustomRate = rateEntry !== undefined;

                  return (
                    <div key={zone.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-white transition-colors bg-white/70">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {zone.name}
                          </span>
                          {hasCustomRate ? (
                            <span className="px-1.5 py-0.5 text-[9px] font-mono font-extrabold bg-blue-50 text-[#0A3088] border border-blue-200 rounded">
                              Tarifa Específica
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-[9px] font-mono font-extrabold bg-slate-100 text-slate-500 border border-slate-200 rounded">
                              Tarifa Base
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {zone.departments.length > 0
                            ? zone.departments.map(d => d.name + (d.cities.length ? ` (${d.cities.length} ciudades)` : '')).join(', ')
                            : 'Resto del país / Cobertura nacional'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-sm font-black text-slate-900">
                          {effectivePrice === 0 ? (
                            <span className="text-[#059669]">¡Gratis!</span>
                          ) : (
                            formatCurrency(effectivePrice)
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reglas de Despacho y Logística */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-sans">
                Operación y Despacho Semanal
              </h3>
            </div>

            {/* Días activos */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans mb-2">
                Días de Despacho Habilitados:
              </span>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map(day => {
                  const isActiveDay = dispatchDays.includes(day.id);
                  return (
                    <div
                      key={day.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 ${
                        isActiveDay
                          ? 'bg-[#E60012] text-white border-[#E60012] shadow-xs'
                          : 'bg-white text-slate-400 border-slate-200 opacity-60'
                      }`}
                    >
                      <span>{day.short}</span>
                      <span className="text-[10px] font-sans font-normal opacity-90 hidden sm:inline">({day.full})</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hora de corte */}
            {method.dispatchCutoff && (
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-600 font-sans font-semibold">Hora límite de despacho diario:</span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-bold">
                  {method.dispatchCutoff} hrs
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(method);
              }}
              className="px-5 py-2.5 text-xs font-black text-white bg-[#E60012] hover:bg-[#b5000b] rounded-xl shadow-md shadow-red-500/20 transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider font-sans"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Editar Método</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
