import React, { useState, useEffect } from 'react';
import { X, Truck, Calendar, DollarSign, Clock, ShieldCheck, Check } from 'lucide-react';
import type { ShippingMethod, ShippingZone, ZoneRate } from '../../types';
import { fetchCarrierNames, fetchDefaultCarrierName } from '../../services/api';
import { formatThousands } from '../../utils/formatCurrency';

interface ShippingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shippingMethod: Partial<ShippingMethod>) => void;
  initialMethod?: ShippingMethod | null;
  zones?: ShippingZone[];
}

const DAYS_OF_WEEK = [
  { id: '1', name: 'Lunes', short: 'LUN' },
  { id: '2', name: 'Martes', short: 'MAR' },
  { id: '3', name: 'Miércoles', short: 'MIÉ' },
  { id: '4', name: 'Jueves', short: 'JUE' },
  { id: '5', name: 'Viernes', short: 'VIE' },
  { id: '6', name: 'Sábado', short: 'SÁB' },
  { id: '7', name: 'Domingo', short: 'DOM' }
];

export const ShippingModal: React.FC<ShippingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMethod,
  zones = []
}) => {
  const [formData, setFormData] = useState({
    name: '',
    carrier: '',
    description: '',
    price: 0,
    estimatedDays: 3,
    dispatchDays: ['1', '2', '3', '4', '5'],
    dispatchCutoff: '',
    freeShippingThreshold: '',
    active: true
  });

  const [carrierOptions, setCarrierOptions] = useState<string[]>([]);
  const [zoneRatesMap, setZoneRatesMap] = useState<Record<string, number>>({});
  const [priceInput, setPriceInput] = useState<string>('0');
  const [estimatedDaysInput, setEstimatedDaysInput] = useState<string>('3');
  const [thresholdInput, setThresholdInput] = useState<string>('');
  const [zoneRateInputs, setZoneRateInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    fetchCarrierNames()
      .then(names => { if (!cancelled) setCarrierOptions(names); })
      .catch(() => { if (!cancelled) setCarrierOptions([]); });
    return () => { cancelled = true; };
  }, []);

  // Default the carrier to the DB default once the catalog is loaded
  useEffect(() => {
    if (carrierOptions.length === 0 || formData.carrier) return;
    let cancelled = false;
    fetchDefaultCarrierName()
      .then(name => { if (!cancelled) setFormData(prev => ({ ...prev, carrier: name })); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [carrierOptions]);

  useEffect(() => {
    if (initialMethod) {
      setFormData({
        name: initialMethod.name || '',
        carrier: initialMethod.carrier || '',
        description: initialMethod.description || '',
        price: initialMethod.price || 0,
        estimatedDays: initialMethod.estimatedDays ?? 3,
        dispatchDays: initialMethod.dispatchDays || ['1', '2', '3', '4', '5'],
        dispatchCutoff: initialMethod.dispatchCutoff || '',
        freeShippingThreshold: initialMethod.freeShippingThreshold !== undefined && initialMethod.freeShippingThreshold !== null
          ? String(initialMethod.freeShippingThreshold)
          : '',
        active: initialMethod.active !== undefined ? initialMethod.active : true
      });

      const initialMap: Record<string, number> = {};
      if (initialMethod.zoneRates && Array.isArray(initialMethod.zoneRates)) {
        initialMethod.zoneRates.forEach(zr => {
          initialMap[zr.zoneId] = zr.price;
        });
      }
      setZoneRatesMap(initialMap);
    } else {
      setFormData({
        name: '',
        carrier: '',
        description: '',
        price: 0,
        estimatedDays: 3,
        dispatchDays: ['1', '2', '3', '4', '5'],
        dispatchCutoff: '',
        freeShippingThreshold: '',
        active: true
      });
      setZoneRatesMap({});
    }
  }, [initialMethod, isOpen]);

  useEffect(() => {
    setPriceInput(formatThousands(formData.price || 0));
  }, [formData.price]);

  useEffect(() => {
    setEstimatedDaysInput(String(formData.estimatedDays ?? 3));
  }, [formData.estimatedDays]);

  useEffect(() => {
    setThresholdInput(
      formData.freeShippingThreshold !== undefined && formData.freeShippingThreshold !== ''
        ? formatThousands(Number(formData.freeShippingThreshold) || 0)
        : ''
    );
  }, [formData.freeShippingThreshold]);

  if (!isOpen) return null;

  const commitPrice = () => {
    const digits = priceInput.replace(/\D/g, '');
    if (digits === '') {
      setPriceInput(formatThousands(formData.price || 0));
      return;
    }
    setFormData({ ...formData, price: Number(digits) });
  };

  const commitEstimatedDays = () => {
    const digits = estimatedDaysInput.replace(/\D/g, '');
    if (digits === '') {
      setEstimatedDaysInput(String(formData.estimatedDays ?? 3));
      return;
    }
    const clamped = Math.min(30, Math.max(0, Number(digits)));
    setFormData({ ...formData, estimatedDays: clamped });
  };

  const commitThreshold = () => {
    const digits = thresholdInput.replace(/\D/g, '');
    if (digits === '') {
      setThresholdInput('');
      setFormData({ ...formData, freeShippingThreshold: '' });
      return;
    }
    setFormData({ ...formData, freeShippingThreshold: String(Number(digits)) });
  };

  const commitZoneRate = (zoneId: string) => {
    const digits = (zoneRateInputs[zoneId] ?? '').replace(/\D/g, '');
    const base = zoneRatesMap[zoneId] ?? formData.price;
    if (digits === '') {
      setZoneRateInputs(prev => ({ ...prev, [zoneId]: formatThousands(base) }));
      return;
    }
    const val = Number(digits);
    setZoneRatesMap(prev => ({ ...prev, [zoneId]: val }));
    setZoneRateInputs(prev => ({ ...prev, [zoneId]: formatThousands(val) }));
  };

  const handleToggleDay = (dayId: string) => {
    setFormData(prev => {
      const exists = prev.dispatchDays.includes(dayId);
      const nextDays = exists
        ? prev.dispatchDays.filter(d => d !== dayId)
        : [...prev.dispatchDays, dayId].sort();
      return { ...prev, dispatchDays: nextDays };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const formattedZoneRates: ZoneRate[] = Object.entries(zoneRatesMap).map(([zoneId, price]) => ({
      zoneId,
      price: Number(price || 0)
    }));

    onSave({
      id: initialMethod?.id,
      name: formData.name.trim(),
      carrier: formData.carrier,
      description: formData.description.trim(),
      price: Number(formData.price || 0),
      estimatedDays: Number(formData.estimatedDays || 1),
      dispatchDays: formData.dispatchDays.length > 0 ? formData.dispatchDays : ['1', '2', '3', '4', '5'],
      dispatchCutoff: formData.dispatchCutoff.trim() !== '' ? formData.dispatchCutoff : undefined,
      freeShippingThreshold: formData.freeShippingThreshold.trim() !== '' ? Number(formData.freeShippingThreshold) : undefined,
      active: formData.active,
      zoneRates: formattedZoneRates
    });

    onClose();
  };

  return (
    <div id="shipping-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col font-sans animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E60012] text-white flex items-center justify-center font-black shrink-0 shadow-md shadow-red-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white font-display">
                {initialMethod ? 'EDITAR MÉTODO DE ENVÍO' : 'NUEVO MÉTODO DE ENVÍO SUZUKI'}
              </h3>
              <p className="text-xs text-slate-300 font-mono">
                PERSISTENCIA DE TARIFAS Y TRANSPORTADORAS EN NEON DB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#f7f9fb] custom-scrollbar">
          
          {/* Nombre y Transportadora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                Nombre del Método <span className="text-[#E60012]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Envío Nacional Estándar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                Empresa Transportadora <span className="text-[#E60012]">*</span>
              </label>
              <select
                value={formData.carrier}
                onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
              >
                {carrierOptions.length === 0 && (
                  <option value="" disabled>Cargando transportadoras...</option>
                )}
                {carrierOptions.map(carrier => (
                  <option key={carrier} value={carrier}>{carrier}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Precio Base y Tarifas por Zona */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                Costo Base / Fallback (COP $) <span className="text-[#E60012]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono font-bold text-xs">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  required
                  placeholder="15.000"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value.replace(/\D/g, ''))}
                  onFocus={(e) => setPriceInput(e.target.value.replace(/\D/g, ''))}
                  onBlur={commitPrice}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                  className="w-full pl-8 pr-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                Tiempo Estimado de Entrega <span className="text-[#E60012]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  required
                  placeholder="3"
                  value={estimatedDaysInput}
                  onChange={(e) => setEstimatedDaysInput(e.target.value.replace(/\D/g, ''))}
                  onFocus={(e) => setEstimatedDaysInput(e.target.value.replace(/\D/g, ''))}
                  onBlur={commitEstimatedDays}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                />
                <span className="absolute right-3.5 top-2.5 text-[10px] font-mono text-slate-500 font-bold uppercase">días hábiles</span>
              </div>
            </div>
          </div>

          {/* Tarifas Específicas por Zona de Envío */}
          {zones && zones.length > 0 && (
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
              <div>
                <span className="text-xs font-black text-slate-900 uppercase block font-sans">
                  Tarifas por Zonas de Envío
                </span>
                <span className="text-[11px] text-slate-500">
                  Define el costo específico para este método según la zona geográfica de destino:
                </span>
              </div>

              <div className="space-y-2.5">
                {zones.map(zone => {
                  const currentRate = zoneRatesMap[zone.id] ?? formData.price;
                  return (
                    <div key={zone.id} className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-900 block truncate">{zone.name}</span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {zone.departments.length > 0
                            ? zone.departments.map(d => d.name + (d.cities.length ? ` (${d.cities.length} ciudad${d.cities.length !== 1 ? 'es' : ''})` : '')).join(', ')
                            : 'Resto del país / Cobertura general'}
                        </span>
                      </div>
                      <div className="w-36 shrink-0 relative">
                        <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono text-xs">$</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={12}
                          value={zoneRateInputs[zone.id] ?? formatThousands(currentRate)}
                          onChange={(e) => setZoneRateInputs(prev => ({ ...prev, [zone.id]: e.target.value.replace(/\D/g, '') }))}
                          onFocus={(e) => setZoneRateInputs(prev => ({ ...prev, [zone.id]: e.target.value.replace(/\D/g, '') }))}
                          onBlur={() => commitZoneRate(zone.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                          className="w-full pl-6 pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-900 text-right focus:border-red-500 outline-hidden"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Días de Despacho (Semana) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
              Días en que opera el despacho de repuestos
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => {
                const selected = formData.dispatchDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => handleToggleDay(day.id)}
                    className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                      selected
                        ? 'bg-[#E60012] text-white border-[#E60012] shadow-xs'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5" />}
                    {day.short}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-sans">
              El motor logístico del checkout excluirá los días sin despacho para dar la fecha exacta de llegada.
            </p>
          </div>

          {/* Hora límite de despacho */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
              Hora Límite de Despacho (HH:mm)
            </label>
            <input
              type="time"
              placeholder="Ej. 14:00"
              value={formData.dispatchCutoff}
              onChange={(e) => setFormData({ ...formData, dispatchCutoff: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
            />
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-sans">
              Pedidos hechos después de esta hora se despachan el siguiente día hábil. Opcional.
            </p>
          </div>

          {/* Umbral Envío Gratis Opcional */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
              Monto Mínimo para Envío GRATIS (COP $)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={12}
              placeholder="Ej. 250.000 (Opcional)"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value.replace(/\D/g, ''))}
              onFocus={(e) => setThresholdInput(e.target.value.replace(/\D/g, ''))}
              onBlur={commitThreshold}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
              Descripción Corta para el Cliente
            </label>
            <textarea
              rows={2}
              placeholder="Ej. Cobertura a nivel nacional con guía rastreable en tiempo real."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
            />
          </div>

          {/* Estado Activo / Inactivo */}
          <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200">
            <div>
              <span className="text-xs font-black text-slate-900 uppercase block font-sans">
                Estado de la Opción de Envío
              </span>
              <span className="text-[11px] text-slate-500">
                {formData.active ? 'Visible en el Checkout para todos los clientes' : 'Oculto temporalmente en la tienda'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, active: !formData.active })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                formData.active ? 'bg-[#059669]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.active ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-white border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-black text-white bg-[#E60012] hover:bg-[#b5000b] active:bg-[#900008] rounded-xl shadow-md shadow-red-500/20 transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider font-sans"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Método de Envío</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
