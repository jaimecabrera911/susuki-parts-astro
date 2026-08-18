import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Package, Tag } from 'lucide-react';
import type { SuzukiPart } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

interface SearchablePartSelectProps {
  parts: SuzukiPart[];
  selectedPartId: string;
  onSelectPart: (part: SuzukiPart) => void;
  label?: string;
  placeholder?: string;
}

export const SearchablePartSelect: React.FC<SearchablePartSelectProps> = ({
  parts,
  selectedPartId,
  onSelectPart,
  label = "VINCULAR A REPUESTO DEL CATÁLOGO",
  placeholder = "Buscar por nombre, referencia OEM o código..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedPart = parts.find(p => p.id === selectedPartId);

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

  const filteredParts = parts.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchesName = p.name.toLowerCase().includes(q);
    const matchesOem = p.oemNumbers.some(o => o.toLowerCase().includes(q));
    const matchesId = p.id.toLowerCase().includes(q);
    const matchesCat = p.category?.toLowerCase().includes(q);
    return matchesName || matchesOem || matchesId || matchesCat;
  });

  const handleSelect = (part: SuzukiPart) => {
    onSelectPart(part);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div id="searchable-part-select" className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}

      {/* Selected Product Card Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={`w-full flex items-center justify-between p-2.5 bg-white border rounded-xl text-xs font-medium transition-all text-left shadow-xs ${
          isOpen
            ? 'border-[#E60012] ring-2 ring-[#E60012]/15'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {selectedPart ? (
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-0.5 shrink-0">
              {selectedPart.image ? (
                <img src={selectedPart.image} alt={selectedPart.name} className="w-full h-full object-contain" />
              ) : (
                <Package className="w-4 h-4 text-[#0A3088]" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-extrabold text-slate-900 truncate font-display">{selectedPart.name}</p>
                <span className="text-[10px] font-mono font-bold text-[#E60012] bg-red-50 border border-red-200 px-1 py-0.5 rounded shrink-0">
                  {selectedPart.oemNumbers[0] || 'OEM'}
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-500 font-bold">
                {formatCurrency(selectedPart.price)} • Stock: {selectedPart.stock} ud.
              </p>
            </div>
          </div>
        ) : (
          <span className="text-slate-400 text-xs font-medium">Seleccionar producto del catálogo...</span>
        )}

        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 custom-scrollbar animate-in fade-in zoom-in-95">
          <div className="relative mb-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] font-medium"
            />
          </div>

          <div className="space-y-1">
            {filteredParts.map(part => {
              const isSelected = part.id === selectedPartId;
              return (
                <button
                  key={part.id}
                  type="button"
                  onClick={() => handleSelect(part)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors text-left ${
                    isSelected
                      ? 'bg-red-50 border border-red-200 text-[#E60012] font-bold'
                      : 'hover:bg-slate-50 border border-transparent text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center p-0.5 shrink-0">
                      {part.image ? (
                        <img src={part.image} alt={part.name} className="w-full h-full object-contain" />
                      ) : (
                        <Package className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-extrabold font-display line-clamp-2 text-slate-900">{part.name}</p>
                      </div>
                      <p className="text-[10px] font-mono text-slate-500 font-bold">
                        OEM: {part.oemNumbers[0]} • {formatCurrency(part.price)}
                      </p>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-[#E60012] stroke-[3] shrink-0" />}
                </button>
              );
            })}

            {filteredParts.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400 font-medium">
                No se encontraron repuestos con "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
