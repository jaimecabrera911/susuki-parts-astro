import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

export interface AdminFilterOption {
  value: string;
  label: string;
}

export interface AdminFilterDef {
  key: string;
  label: string;
  options: AdminFilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface AdminFilterBarProps {
  filters: AdminFilterDef[];
}

export const AdminFilterBar: React.FC<AdminFilterBarProps> = ({ filters }) => {
  return (
    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
      {filters.map((filter) => (
        <div key={filter.key} className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            {filter.label}:
          </span>
          <select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#E60012] font-semibold"
            aria-label={filter.label}
          >
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
};

export const FilterResetButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-[#E60012] hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
    title="Limpiar filtros"
  >
    <SlidersHorizontal className="w-3.5 h-3.5" />
    <span>Limpiar</span>
  </button>
);