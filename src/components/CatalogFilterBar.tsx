import React from 'react';
import { Filter, Search, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { ActiveMotorcycle } from '../types';

interface CatalogFilterBarProps {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onlyCompatible: boolean;
  setOnlyCompatible: (val: boolean) => void;
  activeMotorcycle: ActiveMotorcycle | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const CatalogFilterBar: React.FC<CatalogFilterBarProps> = ({
  selectedCategory,
  setSelectedCategory,
  onlyCompatible,
  setOnlyCompatible,
  activeMotorcycle,
  searchQuery,
  setSearchQuery
}) => {
  const categories = [
    { id: 'all', label: 'Todos los Repuestos' },
    { id: 'filtros', label: 'Filtros & Mantenimiento' },
    { id: 'motor', label: 'Motor & Inyección' },
    { id: 'frenos', label: 'Frenos & ABS' },
    { id: 'transmision', label: 'Transmisión & Arrastre' },
    { id: 'electrico', label: 'Sistema Eléctrico' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-8 space-y-4">
      
      {/* Search Input for mobile & Quick Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por nombre o ref. OEM..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
          />
        </div>

        {/* Toggle Only Compatible */}
        <button
          onClick={() => {
            if (activeMotorcycle) {
              setOnlyCompatible(!onlyCompatible);
            }
          }}
          disabled={!activeMotorcycle}
          className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
            onlyCompatible
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : activeMotorcycle
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
          }`}
          title={activeMotorcycle ? 'Filtrar piezas compatibles' : 'Selecciona una moto en tu garaje primero'}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>
            {onlyCompatible
              ? `Mostrando solo compatibles con ${activeMotorcycle?.modelName}`
              : activeMotorcycle
                ? `Filtrar solo compatibles con ${activeMotorcycle.modelName}`
                : 'Selecciona moto para activar filtro'}
          </span>
        </button>

      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider shrink-0 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Categoría:
        </span>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              selectedCategory === c.id
                ? 'bg-[#E60012] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

    </div>
  );
};
