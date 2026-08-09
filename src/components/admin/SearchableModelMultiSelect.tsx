import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, X, Tag } from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import type { SuzukiModel } from '../../types';

interface SearchableModelMultiSelectProps {
  models: SuzukiModel[];
  selectedModelIds: string[];
  onChange: (selectedIds: string[]) => void;
  label?: string;
  placeholder?: string;
}

export const SearchableModelMultiSelect: React.FC<SearchableModelMultiSelectProps> = ({
  models,
  selectedModelIds,
  onChange,
  label = "Modelos de Moto Aplicables",
  placeholder = "Buscar modelos por nombre o categoría..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredModels = models.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleModel = (id: string) => {
    if (selectedModelIds.includes(id)) {
      onChange(selectedModelIds.filter(item => item !== id));
    } else {
      onChange([...selectedModelIds, id]);
    }
  };

  const removeModel = (id: string) => {
    onChange(selectedModelIds.filter(item => item !== id));
  };

  const selectedModels = models.filter(m => selectedModelIds.includes(m.id));

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono">
            {label}
          </label>
          <span className="text-[10px] font-mono font-bold text-slate-500">
            {selectedModelIds.length} seleccionados
          </span>
        </div>
      )}

      {/* Selected Tags Chips */}
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px] p-2 bg-slate-50 border border-slate-200 rounded-xl">
        {selectedModels.map(m => (
          <span
            key={m.id}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-xs animate-in fade-in"
          >
            <FaMotorcycle className="w-3 h-3 text-[#E60012]" />
            <span>{m.name}</span>
            <button
              type="button"
              onClick={() => removeModel(m.id)}
              className="text-slate-400 hover:text-[#dc2626] font-bold ml-0.5"
            >
              ✕
            </button>
          </span>
        ))}

        {selectedModels.length === 0 && (
          <span className="text-xs text-slate-400 font-medium italic py-0.5 px-1">
            Ningún modelo seleccionado aún. Haz clic abajo para buscar.
          </span>
        )}
      </div>

      {/* Autocomplete Input Trigger */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown Options Container */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-1.5 custom-scrollbar animate-in fade-in zoom-in-95">
          <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase border-b border-slate-100 flex items-center justify-between">
            <span>Resultados ({filteredModels.length})</span>
            {selectedModelIds.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-red-600 hover:underline cursor-pointer"
              >
                Desmarcar todos
              </button>
            )}
          </div>

          <div className="space-y-0.5 pt-1">
            {filteredModels.map(m => {
              const isChecked = selectedModelIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleModel(m.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium transition-colors text-left ${
                    isChecked
                      ? 'bg-red-50 text-[#E60012] font-bold border border-red-200'
                      : 'text-slate-800 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isChecked ? 'bg-[#E60012] border-[#E60012] text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="truncate">
                      <p className="font-bold font-display text-slate-900 leading-tight">{m.name}</p>
                      <p className="text-[10px] font-mono text-slate-500 font-normal">
                        {m.category} • {Math.min(...m.years)}-{Math.max(...m.years)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredModels.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400 font-medium">
                No se encontraron modelos con "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
