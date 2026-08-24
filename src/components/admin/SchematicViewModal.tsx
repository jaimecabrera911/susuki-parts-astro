import React, { useState, useMemo } from 'react';
import { X, Layers, Crosshair, Package, ShoppingCart, Check, ZoomIn, ZoomOut, RotateCcw, Edit, ExternalLink } from 'lucide-react';
import type { ExplodedDiagram, SuzukiPart } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

interface SchematicViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  schematic: ExplodedDiagram | null;
  parts: SuzukiPart[];
  onEditSchematic?: (schematic: ExplodedDiagram) => void;
  onEditPart?: (part: SuzukiPart) => void;
}

export const SchematicViewModal: React.FC<SchematicViewModalProps> = ({
  isOpen,
  onClose,
  schematic,
  parts,
  onEditSchematic,
  onEditPart
}) => {
  if (!isOpen || !schematic) return null;

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedHotspotIndex, setSelectedHotspotIndex] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<'item' | 'alpha'>('item');

  const sortedHotspotsWithIndex = useMemo(() => {
    const list = schematic.hotspots.map((hs, originalIndex) => {
      const part = parts.find(p => p.id === hs.partId);
      const name = (hs.label || part?.name || '').trim();
      return { hs, originalIndex, name, part };
    });

    if (sortMode === 'item') {
      return list.sort((a, b) => {
        if (a.hs.itemNumber !== b.hs.itemNumber) {
          return a.hs.itemNumber - b.hs.itemNumber;
        }
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base', numeric: true });
      });
    }

    return list.sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base', numeric: true })
    );
  }, [schematic.hotspots, sortMode, parts]);

  const selectedHotspot = selectedHotspotIndex !== null ? schematic.hotspots[selectedHotspotIndex] : null;
  const selectedPart = selectedHotspot ? parts.find(p => p.id === selectedHotspot.partId) : null;

  const handleAddToCart = (part: SuzukiPart) => {
    setAddedToCartPartId(part.id);
    setTimeout(() => setAddedToCartPartId(null), 1800);
  };

  return (
    <div id="schematic-view-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-[95vw] md:max-w-4xl lg:max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 md:px-8 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0 pr-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#059669] border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg md:text-xl font-black text-slate-900 font-display truncate">
                  {schematic.title}
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#059669] border border-emerald-200">
                  {schematic.hotspots.length} {schematic.hotspots.length === 1 ? 'poblado' : 'poblados'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {schematic.category} • {schematic.section} • {schematic.modelTarget || 'Aplica a modelos Suzuki'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onEditSchematic && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditSchematic(schematic);
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#0A3088] border border-blue-200 hover:bg-[#0A3088] hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
                title="Editar este despiece"
              >
                <Edit className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editar Despiece</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Diagram Viewport + Part Drawer */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 custom-scrollbar">
          
          {/* Main Diagram Canvas (2 cols) */}
          <div className="lg:col-span-2 space-y-3 flex flex-col">
            
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-mono font-bold text-slate-600 flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-[#059669]" />
                Haz clic en cualquier punto para inspeccionar repuesto
              </span>

              <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(1, Number((prev - 0.25).toFixed(2))))}
                  disabled={zoomLevel <= 1}
                  className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-all cursor-pointer"
                  title="Alejar zoom (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <span className="px-2 text-xs font-mono font-bold text-slate-900 min-w-[44px] text-center select-none">
                  {Math.round(zoomLevel * 100)}%
                </span>

                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(2.5, Number((prev + 0.25).toFixed(2))))}
                  disabled={zoomLevel >= 2.5}
                  className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-all cursor-pointer"
                  title="Acercar zoom (hasta 250%)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                {zoomLevel > 1 && (
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 rounded-lg text-[#E60012] hover:bg-red-50 transition-all text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                    title="Restablecer a 100%"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Diagram Viewport Container */}
            <div className="relative border border-slate-200 rounded-2xl overflow-auto bg-slate-50 shadow-xs max-h-[480px] custom-scrollbar flex items-center justify-center p-4">
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top left',
                  width: zoomLevel > 1 ? `${zoomLevel * 100}%` : '100%'
                }}
                className="relative w-full flex items-center justify-center bg-white transition-transform duration-200"
              >
                <div className="relative inline-block select-none">
                  {schematic.diagramImage ? (
                    <img
                      src={schematic.diagramImage}
                      alt={schematic.title}
                      className="max-w-full max-h-[440px] object-contain pointer-events-none select-none block"
                    />
                  ) : (
                    <div className="py-16 text-center text-slate-400 font-mono text-xs">
                      Sin diagrama disponible
                    </div>
                  )}

                  {/* Hotspot Pins */}
                  {schematic.hotspots.map((hs, idx) => {
                    const isSelected = selectedHotspotIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedHotspotIndex(idx)}
                        style={{
                          left: `${hs.x}%`,
                          top: `${hs.y}%`,
                          transform: `translate(-50%, -50%) scale(${1 / Math.sqrt(zoomLevel)})`
                        }}
                        className={`absolute z-10 w-6 h-6 rounded-full text-white font-mono font-black text-[11px] border-2 shadow-md flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-[#059669] border-yellow-300 ring-4 ring-emerald-400/60 scale-125 z-30 animate-pulse'
                            : 'bg-[#E60012] border-white hover:scale-125'
                        }`}
                        title={`Punto #${hs.itemNumber}: ${hs.label}`}
                      >
                        {isSelected && (
                          <span
                            className="absolute -inset-1 rounded-full bg-emerald-400/50 animate-pulse pointer-events-none"
                            aria-hidden="true"
                          />
                        )}
                        <span className="relative z-10">{hs.itemNumber}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Side Drawer: Inspection & Part Details (1 col) */}
          <div className="space-y-4 flex flex-col">
            <span className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider">
              Repuestos Vinculados en este Esquema
            </span>

            {/* Selected Part Detail Card */}
            {selectedPart ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white border border-emerald-200 flex items-center justify-center p-1 shrink-0">
                    {selectedPart.image ? (
                      <img src={selectedPart.image} alt={selectedPart.name} className="w-full h-full object-contain" />
                    ) : (
                      <Package className="w-6 h-6 text-[#059669]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono font-bold text-[#059669] bg-white border border-emerald-200 px-2 py-0.5 rounded">
                      Punto #{selectedHotspot?.itemNumber}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm font-display mt-1 leading-snug">
                      {selectedPart.name}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-600 font-bold mt-0.5">
                      OEM: {selectedPart.oemNumbers[0]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60">
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 font-bold uppercase">Precio Unitario</p>
                    <p className="text-base font-black font-mono text-[#E60012]">
                      {formatCurrency(selectedPart.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-slate-500 font-bold uppercase">Stock Disponible</p>
                    <p className={`text-xs font-mono font-bold ${selectedPart.stock > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {selectedPart.stock} unidades
                    </p>
                  </div>
                </div>

                {onEditPart && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEditPart(selectedPart);
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#0A3088] hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Editar Repuesto en Catálogo</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-medium py-6">
                👆 Haz clic en cualquier número del diagrama para ver su repuesto oficial Suzuki.
              </div>
            )}

            {/* List of all parts in this schematic */}
            <div className="space-y-2 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between gap-2 flex-wrap shrink-0 pt-1">
                <span className="text-[11px] font-bold text-slate-700 font-mono uppercase">
                  Repuestos en este Despiece ({schematic.hotspots.length})
                </span>
                {schematic.hotspots.length > 1 && (
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold shadow-xs">
                    <button
                      type="button"
                      onClick={() => setSortMode('alpha')}
                      className={`px-2 py-0.5 rounded-md transition-colors ${
                        sortMode === 'alpha'
                          ? 'bg-[#0A3088] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Ordenar alfabéticamente (A-Z)"
                    >
                      A-Z
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortMode('item')}
                      className={`px-2 py-0.5 rounded-md transition-colors ${
                        sortMode === 'item'
                          ? 'bg-[#0A3088] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Ordenar por número de ítem"
                    >
                      N° Ítem
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 flex-1 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                {sortedHotspotsWithIndex.map(({ hs, originalIndex }) => {
                  const part = parts.find(p => p.id === hs.partId);
                  const isSelected = selectedHotspotIndex === originalIndex;

                  return (
                    <button
                      key={originalIndex}
                      type="button"
                      onClick={() => setSelectedHotspotIndex(originalIndex)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="w-5 h-5 rounded-full bg-[#E60012] text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                          {hs.itemNumber}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate font-display text-[11px]">{hs.label}</p>
                          <p className="text-[10px] font-mono text-slate-500 font-bold">
                            OEM: {part ? part.oemNumbers[0] : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {part && (
                        <span className="text-[11px] font-mono font-bold text-[#E60012] shrink-0">
                          {formatCurrency(part.price)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 md:px-8 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <p className="text-xs font-mono text-slate-500 hidden sm:block">
            Esquema despiece homologado para el catálogo oficial de repuestos.
          </p>
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
            >
              Cerrar Vista
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
