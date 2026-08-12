import React, { useState } from 'react';
import { Search, Hash, Shield, FileSearch, ArrowRight, HelpCircle, CheckCircle, AlertCircle } from 'lucide-react';
import type { ActiveMotorcycle, SuzukiPart, VinLookupResult } from '../types';

import { MOTORCYCLE_SVGS } from '../data/svgAssets';

interface TechnicalSearchCardProps {
  onSelectMotorcycle: (moto: ActiveMotorcycle) => void;
  onOpenPartDetail: (part: SuzukiPart) => void;
  onOpenTutorial: () => void;
}

export const TechnicalSearchCard: React.FC<TechnicalSearchCardProps> = ({
  onSelectMotorcycle,
  onOpenPartDetail,
  onOpenTutorial,
}) => {
  const [vinInput, setVinInput] = useState('');
  const [oemInput, setOemInput] = useState('');
  const [isSearchingVin, setIsSearchingVin] = useState(false);
  const [isSearchingOem, setIsSearchingOem] = useState(false);
  const [vinFeedback, setVinFeedback] = useState<VinLookupResult | null>(null);
  const [oemError, setOemError] = useState<string | null>(null);

  const handleSearchVin = async (sampleVal?: string) => {
    const term = sampleVal || vinInput;
    if (!term.trim()) return;

    setIsSearchingVin(true);
    setVinFeedback(null);

    try {
      const res = await fetch('/api/search-vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin: term })
      });
      const data: VinLookupResult = await res.json();
      setVinFeedback(data);

      if (data.found && data.motorcycle) {
        onSelectMotorcycle(data.motorcycle);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingVin(false);
    }
  };

  const handleSearchOem = async (sampleVal?: string) => {
    const term = sampleVal || oemInput;
    if (!term.trim()) return;

    setIsSearchingOem(true);
    setOemError(null);

    try {
      const res = await fetch('/api/search-oem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oem: term })
      });
      const data = await res.json();

      if (data.found && data.part) {
        onOpenPartDetail(data.part);
      } else {
        setOemError(data.message || 'Código OEM no encontrado.');
      }
    } catch (err) {
      console.error(err);
      setOemError('Error al conectar con la base de datos OEM.');
    } finally {
      setIsSearchingOem(false);
    }
  };

  return (
    <div id="technical-search-card" className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto my-6">
      
      {/* Left Card: Búsqueda Técnica */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileSearch className="w-5 h-5 text-[#E60012]" />
            <h3 className="text-xl font-black text-slate-900">Búsqueda Técnica</h3>
          </div>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Si conoces la referencia exacta o el número de identificación de tu vehículo (VIN), búscalo directamente.
          </p>

          {/* VIN Result Feedback */}
          {vinFeedback && (
            <div className={`p-3 rounded-xl mb-4 text-xs ${vinFeedback.found ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' : 'bg-amber-50 border border-amber-200 text-amber-900'}`}>
              <div className="flex items-start gap-2">
                {vinFeedback.found ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" /> : <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />}
                <div>
                  <div className="font-bold">{vinFeedback.found ? 'Vehículo Identificado y Activado' : 'Sin coincidencia exacta'}</div>
                  {vinFeedback.motorcycle && (
                    <p className="mt-0.5 font-medium">
                      {vinFeedback.motorcycle.brand} {vinFeedback.motorcycle.modelName} ({vinFeedback.motorcycle.year}) - {vinFeedback.motorcycle.version}
                    </p>
                  )}
                  {vinFeedback.specsSummary && (
                    <p className="text-[11px] text-slate-700 mt-1 font-mono">{vinFeedback.specsSummary}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* OEM Reference Field */}
          <div className="mb-2">
            <label htmlFor="oem-search-input" className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              REFERENCIA OEM
            </label>
            <div className="relative">
              <input
                id="oem-search-input"
                type="text"
                value={oemInput}
                onChange={(e) => setOemInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchOem()}
                placeholder="Ej. 13780-06G00..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-3.5 pr-14 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
              />
              <button
                type="button"
                onClick={() => handleSearchOem()}
                disabled={isSearchingOem}
                className="absolute right-1 top-1 bottom-1 w-11 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                aria-label="Buscar OEM"
              >
                <Search className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Quick Sample OEMs */}
            <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1 text-[11px]">
              <span className="text-slate-600 font-bold text-[10px] uppercase shrink-0">Ejemplos:</span>
              <button
                type="button"
                onClick={() => {
                  setOemInput('13780-06G00');
                  handleSearchOem('13780-06G00');
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-mono text-[10px] px-2.5 py-1.5 min-h-[36px] rounded-md transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
              >
                13780-06G00
              </button>
              <button
                type="button"
                onClick={() => {
                  setOemInput('16510-05240');
                  handleSearchOem('16510-05240');
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-mono text-[10px] px-2.5 py-1.5 min-h-[36px] rounded-md transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
              >
                16510-05240
              </button>
              <button
                type="button"
                onClick={() => {
                  setOemInput('59300-33820-000');
                  handleSearchOem('59300-33820-000');
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-mono text-[10px] px-2.5 py-1.5 min-h-[36px] rounded-md transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
              >
                59300-33820
              </button>
            </div>
          </div>

          {oemError && (
            <p className="text-xs text-[#E60012] font-semibold mt-2">{oemError}</p>
          )}

        </div>
      </div>

      {/* Right Card: Tutorial de Identificación */}
      <div className="relative border border-slate-800 rounded-2xl overflow-hidden bg-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between shadow-md group">
        
        {/* Background Overlay Image */}
        <div 
          className="absolute inset-0 opacity-25 group-hover:opacity-35 transition-opacity bg-cover bg-center" 
          style={{ backgroundImage: `url('${MOTORCYCLE_SVGS['gsx-r1000']}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent"></div>

        <div className="relative z-10">
          <span className="bg-[#E60012] text-white font-bold text-[10px] uppercase px-2.5 py-1 rounded-full tracking-wider inline-block mb-3">
            GUÍA TÉCNICA
          </span>
          <h3 className="text-2xl font-black text-white tracking-tight leading-snug">
            Tutorial de Identificación
          </h3>
          <p className="text-slate-300 text-xs mt-2 leading-relaxed">
            Aprende a localizar el VIN y los códigos de modelo en tu motocicleta para una precisión absoluta en el pedido de repuestos.
          </p>
        </div>

        <div className="relative z-10 mt-8">
          <button
            type="button"
            onClick={onOpenTutorial}
            className="w-full sm:w-auto px-6 py-3 min-h-[44px] bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span>Ver Guía Interactiva</span>
            <ArrowRight className="w-4 h-4 text-[#E60012]" aria-hidden="true" />
          </button>
        </div>

      </div>

    </div>
  );
};
