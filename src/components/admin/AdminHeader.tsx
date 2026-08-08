import React from 'react';
import { Search, Plus, RefreshCw, ShieldCheck, Wrench } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  onRefresh?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  onPrimaryAction,
  primaryActionLabel = 'Nuevo Registro',
  onRefresh
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
          <span>ADMINISTRACIÓN</span>
          <span>/</span>
          <span className="text-[#E60012] font-black">{title}</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">{title}</h1>
        <p className="text-xs text-slate-500 font-sans mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre, ref..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 transition-all font-medium font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Recargar datos"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Primary Action Button (Suzuki Red CTA per DESIGN.md) */}
        {onPrimaryAction && (
          <button
            onClick={onPrimaryAction}
            className="px-4 py-2.5 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all duration-150 flex items-center gap-2 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>{primaryActionLabel}</span>
          </button>
        )}

        {/* Admin Avatar Badge */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#E60012] font-black text-xs shadow-xs">
            AD
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-bold text-slate-900 leading-tight">Admin Taller</p>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold uppercase font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span>
              Verificado
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
