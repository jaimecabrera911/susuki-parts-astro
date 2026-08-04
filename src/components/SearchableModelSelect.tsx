import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Bike } from 'lucide-react';
import type { SuzukiModel } from '../types';

interface SearchableModelSelectProps {
  models: SuzukiModel[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export const SearchableModelSelect: React.FC<SearchableModelSelectProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  placeholder = "Buscar o seleccionar modelo...",
  label = "MODELO",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedModel = models.find((m) => m.id === selectedModelId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter models based on search term
  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleSelect = (modelId: string) => {
    onSelectModel(modelId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectModel('');
    setSearchQuery('');
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label htmlFor="searchable-model-select-input" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}

      {/* Main Trigger Button / Search Bar */}
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label || "Seleccionar modelo"}
        disabled={disabled}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            handleOpen();
          }
        }}
        className={`w-full flex items-center justify-between p-2.5 bg-white border rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
          isOpen
            ? 'border-[#E60012] ring-2 ring-[#E60012]/15 shadow-sm'
            : selectedModel
            ? 'border-slate-300 hover:border-slate-400 text-slate-900 bg-white'
            : 'border-slate-300 hover:border-slate-400 text-slate-600 bg-slate-50/80'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
      >
        <div className="flex items-center gap-2 truncate pr-1">
          <Bike className={`w-4 h-4 shrink-0 ${selectedModel ? 'text-[#E60012]' : 'text-slate-500'}`} />
          {selectedModel ? (
            <span className="text-slate-900 font-extrabold text-xs truncate">
              {selectedModel.name}
            </span>
          ) : (
            <span className="text-slate-600 font-normal text-xs truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedModel && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  handleClear(e as any);
                }
              }}
              className="p-1 text-slate-500 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
              title="Limpiar selección"
              aria-label="Limpiar selección de modelo"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#E60012]' : ''
            }`}
          />
        </div>
      </button>

      {/* Autocomplete Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 min-w-[240px]">
          {/* Internal Search Input */}
          <div className="p-2 border-b border-slate-200 bg-slate-50/80 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
            <input
              id="searchable-model-select-input"
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Escribe para buscar (ej. V-Strom, GSX, GN)..."
              className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-500 font-semibold focus:outline-none py-1"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar texto de búsqueda"
                className="p-1 text-slate-500 hover:text-slate-700 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Model Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 p-1">
            {filteredModels.length > 0 ? (
              filteredModels.map((m) => {
                const isSelected = m.id === selectedModelId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelect(m.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-red-50 text-[#E60012] font-bold'
                        : 'hover:bg-slate-100/80 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs group-hover:text-[#E60012] transition-colors">
                        {m.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {m.category} • {m.years.length} Años disponibles
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#E60012] shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No se encontraron modelos con &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
