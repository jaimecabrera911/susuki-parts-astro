import React, { useState, useEffect } from 'react';
import { Bike, Check, ChevronRight, RefreshCw, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';
import { SUZUKI_MODELS } from '../data/suzukiData';
import type { ActiveMotorcycle, SuzukiModel } from '../types';
import { SearchableModelSelect } from './SearchableModelSelect';

interface CompatibilitySelectorProps {
  activeMotorcycle: ActiveMotorcycle | null;
  onSelectMotorcycle: (moto: ActiveMotorcycle) => void;
  onClearMotorcycle: () => void;
  onGoToProducts?: () => void;
}

export const CompatibilitySelector: React.FC<CompatibilitySelectorProps> = ({
  activeMotorcycle,
  onSelectMotorcycle,
  onClearMotorcycle,
  onGoToProducts,
}) => {
  const [selectedBrand] = useState('SUZUKI');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [selectedVersion, setSelectedVersion] = useState<string>('');

  // Find currently chosen model object
  const currentModelObj = SUZUKI_MODELS.find(m => m.id === selectedModelId);

  // Sync state if activeMotorcycle changes
  useEffect(() => {
    if (activeMotorcycle) {
      setSelectedModelId(activeMotorcycle.modelId);
      setSelectedYear(activeMotorcycle.year);
      setSelectedVersion(activeMotorcycle.version);
    }
  }, [activeMotorcycle]);

  const handleApply = () => {
    if (!currentModelObj || !selectedYear || !selectedVersion) return;
    onSelectMotorcycle({
      brand: selectedBrand,
      modelId: currentModelObj.id,
      modelName: currentModelObj.name,
      year: Number(selectedYear),
      version: selectedVersion
    });
    if (onGoToProducts) {
      onGoToProducts();
    }
  };

  const isFormComplete = selectedModelId && selectedYear && selectedVersion;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8 max-w-4xl mx-auto my-6">
      
      {/* Active Garage Banner if bike is already set */}
      {activeMotorcycle ? (
        <div className="bg-slate-900 text-white rounded-xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-7 h-7" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.18)] shrink-0" aria-hidden="true" />
                <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider">COMPATIBILIDAD ACTIVA GARANTIZADA</span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                {activeMotorcycle.brand} {activeMotorcycle.modelName} ({activeMotorcycle.year})
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Versión: <span className="text-white font-medium">{activeMotorcycle.version}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {onGoToProducts && (
              <button
                type="button"
                onClick={onGoToProducts}
                className="px-4 py-2.5 min-h-[44px] bg-[#E60012] hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span>Ver Repuestos Garantizados</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={onClearMotorcycle}
              className="text-xs font-semibold px-3 py-2.5 min-h-[44px] text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              Cambiar Moto
            </button>
          </div>
        </div>
      ) : null}

      {/* Header title section */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Identifica tu Motocicleta
        </h2>
        <p className="text-slate-600 text-sm mt-2 leading-relaxed">
          Navega solo repuestos garantizados para tu versión exacta. Precisión industrial en cada pieza.
        </p>
      </div>

      {/* Quick Step Bar */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <span className="w-5 h-5 rounded-full bg-[#E60012] text-white flex items-center justify-center text-[10px]">1</span>
          MARCA
        </div>
        <div className="w-8 h-0.5 bg-[#E60012]"></div>
        <div className={`flex items-center gap-1.5 text-xs font-bold ${selectedModelId ? 'text-slate-800' : 'text-slate-600'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${selectedModelId ? 'bg-[#E60012] text-white' : 'bg-slate-200 text-slate-700'}`}>2</span>
          MODELO
        </div>
        <div className={`w-8 h-0.5 ${selectedModelId ? 'bg-[#E60012]' : 'bg-slate-200'}`}></div>
        <div className={`flex items-center gap-1.5 text-xs font-bold ${selectedYear ? 'text-slate-800' : 'text-slate-600'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${selectedYear ? 'bg-[#E60012] text-white' : 'bg-slate-200 text-slate-700'}`}>3</span>
          AÑO
        </div>
        <div className={`w-8 h-0.5 ${selectedYear ? 'bg-[#E60012]' : 'bg-slate-200'}`}></div>
        <div className={`flex items-center gap-1.5 text-xs font-bold ${selectedVersion ? 'text-slate-800' : 'text-slate-600'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${selectedVersion ? 'bg-[#E60012] text-white' : 'bg-slate-200 text-slate-700'}`}>4</span>
          VERSIÓN
        </div>
      </div>

      {/* Selector Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Step 1: Marca */}
        <div className="border border-red-200 bg-red-50/50 rounded-xl p-3.5 relative">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            <span>MARCA</span>
            <Check className="w-3.5 h-3.5 text-[#E60012]" aria-hidden="true" />
          </div>
          <div className="font-extrabold text-slate-900 text-sm">
            SUZUKI
          </div>
        </div>

        {/* Step 2: Modelo Autocomplete */}
        <div className={`border rounded-xl p-2.5 transition-all ${selectedModelId ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50'}`}>
          <SearchableModelSelect
            models={SUZUKI_MODELS}
            selectedModelId={selectedModelId}
            onSelectModel={(id) => {
              setSelectedModelId(id);
              setSelectedYear('');
              setSelectedVersion('');
            }}
            placeholder="Buscar modelo..."
            label="MODELO"
          />
        </div>

        {/* Step 3: Año */}
        <div className={`border rounded-xl p-3.5 transition-all ${selectedYear ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50'}`}>
          <label htmlFor="compatibility-year-select" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            AÑO
          </label>
          <select
            id="compatibility-year-select"
            value={selectedYear}
            disabled={!currentModelObj}
            onChange={(e) => {
              setSelectedYear(Number(e.target.value));
              setSelectedVersion('');
            }}
            className="w-full bg-transparent font-bold text-slate-900 text-sm focus:outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#E60012] rounded"
          >
            <option value="">{currentModelObj ? '-- Seleccionar Año --' : '---'}</option>
            {currentModelObj?.years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Step 4: Versión */}
        <div className={`border rounded-xl p-3.5 transition-all ${selectedVersion ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50'}`}>
          <label htmlFor="compatibility-version-select" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            VERSIÓN
          </label>
          <select
            id="compatibility-version-select"
            value={selectedVersion}
            disabled={!selectedYear || !currentModelObj}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="w-full bg-transparent font-bold text-slate-900 text-sm focus:outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#E60012] rounded"
          >
            <option value="">{selectedYear ? '-- Seleccionar Versión --' : '---'}</option>
            {currentModelObj?.versions.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Action Submit Button */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleApply}
          disabled={!isFormComplete}
          className="w-full sm:w-auto px-8 py-3.5 min-h-[44px] bg-[#E60012] hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
        >
          <span>Buscar Repuestos Garantizados</span>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

    </div>
  );
};
