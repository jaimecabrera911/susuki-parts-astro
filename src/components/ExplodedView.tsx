import React, { useState } from 'react';
import { EXPLODED_DIAGRAMS, SUZUKI_PARTS } from '../data/suzukiData';
import type { ExplodedDiagram, SuzukiPart, ActiveMotorcycle } from '../types';
import { Layers, ZoomIn, ZoomOut, CheckCircle2, AlertTriangle, ShoppingBag, Eye, Info, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

interface ExplodedViewProps {
  activeMotorcycle: ActiveMotorcycle | null;
  onAddToCart: (part: SuzukiPart) => void;
  onOpenPartDetail: (part: SuzukiPart) => void;
  initialSchematicId?: string;
}

export const ExplodedView: React.FC<ExplodedViewProps> = ({
  activeMotorcycle,
  onAddToCart,
  onOpenPartDetail,
  initialSchematicId
}) => {
  const [selectedDiagramId, setSelectedDiagramId] = useState<string>(
    initialSchematicId || EXPLODED_DIAGRAMS[0].id
  );
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const currentDiagram = EXPLODED_DIAGRAMS.find(d => d.id === selectedDiagramId) || EXPLODED_DIAGRAMS[0];
  
  // Get part associated with selected hotspot
  const selectedPart = SUZUKI_PARTS.find(p => p.id === selectedPartId);

  // Check compatibility of selected diagram part
  let isPartCompatible = false;
  if (selectedPart && activeMotorcycle) {
    isPartCompatible = selectedPart.compatibility.some(c => {
      if (c.modelId !== activeMotorcycle.modelId) return false;
      if (activeMotorcycle.year < c.yearStart || activeMotorcycle.year > c.yearEnd) return false;
      if (c.version && c.version !== activeMotorcycle.version) return false;
      return true;
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Title & Selector Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#E60012]" />
              <h2 className="text-xl font-black text-slate-900">Visor de Diagramas de Despiece (Exploded View)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Haz clic en los puntos numerados sobre el plano para identificar repuestos OEM originales con precisión micrométrica.
            </p>
          </div>

          {/* Diagram Picker Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {EXPLODED_DIAGRAMS.map(diag => (
              <button
                key={diag.id}
                onClick={() => {
                  setSelectedDiagramId(diag.id);
                  setSelectedPartId(null);
                  setZoomLevel(1);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedDiagramId === diag.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {diag.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Schematic Stage + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Schematic Blueprint Area */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 p-4 relative overflow-hidden flex flex-col justify-between min-h-[480px]">
          
          {/* Blueprint Header controls */}
          <div className="flex items-center justify-between z-10 bg-slate-900/90 backdrop-blur-xs p-3 rounded-xl border border-slate-800 text-white text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-mono block uppercase">PLANO TÉCNICO REGISTRADO</span>
              <span className="font-extrabold text-sm">{currentDiagram.title}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2))}
                aria-label="Acercar zoom del plano"
                className="w-11 h-11 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                title="Acercar Zoom"
              >
                <ZoomIn className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
                aria-label="Alejar zoom del plano"
                className="w-11 h-11 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                title="Alejar Zoom"
              >
                <ZoomOut className="w-4 h-4" aria-hidden="true" />
              </button>
              <span className="font-mono text-[11px] text-slate-400 px-2">{Math.round(zoomLevel * 100)}%</span>
            </div>
          </div>

          {/* Canvas Blueprint Container with Hotspots */}
          <div className="relative w-full h-full min-h-[380px] flex items-center justify-center overflow-hidden my-4">
            <div 
              className="relative transition-transform duration-200 ease-out max-w-full"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={currentDiagram.diagramImage}
                alt={currentDiagram.title}
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[420px] object-contain rounded-xl opacity-80"
              />

              {/* Hotspot Pin Markers */}
              {currentDiagram.hotspots.map(spot => {
                const isSelected = selectedPartId === spot.partId;
                return (
                  <button
                    key={spot.itemNumber}
                    type="button"
                    onClick={() => setSelectedPartId(spot.partId)}
                    aria-label={`Punto de despiece #${spot.itemNumber}`}
                    style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full font-black text-xs flex items-center justify-center transition-all shadow-lg cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E60012] ${
                      isSelected
                        ? 'bg-[#E60012] text-white ring-4 ring-red-400/50 scale-125 z-30'
                        : 'bg-white text-slate-900 hover:bg-[#E60012] hover:text-white ring-2 ring-slate-900 z-20'
                    }`}
                  >
                    {spot.itemNumber}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Legend */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-slate-300 text-xs flex items-center justify-between">
            <span>Objetivo: <strong className="text-white">{currentDiagram.modelTarget}</strong></span>
            <span className="text-[11px] text-slate-400 font-mono">Seleccionado: {selectedPart ? selectedPart.oemNumber : 'Ningún elemento'}</span>
          </div>

        </div>

        {/* Right Col: Selected Part Details & Purchase Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs">
          
          {selectedPart ? (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md text-slate-600">
                  REF. OEM DEL DIAGRAMA
                </span>
                <span className="font-mono font-extrabold text-[#E60012] text-sm">
                  {selectedPart.oemNumber}
                </span>
              </div>

              {/* Product Image Card */}
              <div 
                onClick={() => onOpenPartDetail(selectedPart)}
                className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center p-3 relative group cursor-pointer hover:border-slate-300 transition-colors"
                title="Clic para ver detalle completo con zoom"
              >
                <img
                  src={selectedPart.image}
                  alt={selectedPart.name}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver Ficha y Zoom
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  {selectedPart.name}
                </h3>
                <div className="text-2xl font-mono font-black text-slate-900 mt-2">
                  {formatCurrency(selectedPart.price)}
                </div>
              </div>

              {/* Active Compatibility Indicator */}
              {activeMotorcycle ? (
                <div className={`p-3 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                  isPartCompatible 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  {isPartCompatible ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                      <span>100% Compatible con tu {activeMotorcycle.modelName} ({activeMotorcycle.year})</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-[#E60012] shrink-0" aria-hidden="true" />
                      <span>Incompatible con {activeMotorcycle.modelName} ({activeMotorcycle.year})</span>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 font-bold flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                  <span>Selecciona tu moto en el Garaje para validar tolerancia</span>
                </div>
              )}

              {/* Specs Table */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
                <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-1">
                  Especificaciones Técnicas
                </div>
                {selectedPart.specs.map((s, idx) => (
                  <div key={idx} className="flex justify-between font-mono">
                    <span className="text-slate-500">{s.label}:</span>
                    <span className="font-bold text-slate-800">{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenPartDetail(selectedPart)}
                  className="w-full py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                >
                  <Eye className="w-4 h-4" aria-hidden="true" />
                  <span>Ver Ficha Técnica Completa</span>
                </button>

                <button
                  type="button"
                  onClick={() => onAddToCart(selectedPart)}
                  disabled={activeMotorcycle ? !isPartCompatible : false}
                  className="w-full py-3 min-h-[44px] bg-[#E60012] hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                >
                  <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                  <span>Añadir al Carrito</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3 my-auto">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <Info className="w-6 h-6" aria-hidden="true" />
              </div>
              <p className="font-bold text-slate-700 text-sm">
                Selecciona un punto en el plano
              </p>
              <p className="text-xs text-slate-500 max-w-xs">
                Haz clic en cualquiera de las marcas numeradas (1, 2, 3...) o en la lista inferior para inspeccionar la imagen del repuesto OEM y su compatibilidad.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* Corresponding Parts Gallery & List for this Exploded View */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" aria-hidden="true" />
              Repuestos e Imágenes Correspondientes a este Despiece
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Haz clic en cualquier imagen o pieza para ubicar su punto exacto en el diagrama superior.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            {currentDiagram.hotspots.length} Repuestos Registrados
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentDiagram.hotspots.map((spot) => {
            const partObj = SUZUKI_PARTS.find((p) => p.id === spot.partId);
            const isSelected = selectedPartId === spot.partId;

            if (!partObj) return null;

            return (
              <div
                key={spot.itemNumber}
                onClick={() => setSelectedPartId(spot.partId)}
                className={`rounded-2xl p-4 border transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-[#E60012] bg-red-50/30 ring-2 ring-[#E60012]/30 shadow-md'
                    : 'border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                      {spot.itemNumber}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded">
                      {partObj.oemNumber}
                    </span>
                  </div>

                  <div className="aspect-4/3 rounded-xl bg-white border border-slate-200 overflow-hidden p-2 flex items-center justify-center mb-3">
                    <img
                      src={partObj.image}
                      alt={partObj.name}
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2 mb-1">
                    {partObj.name}
                  </h4>
                  <div className="text-sm font-mono font-black text-[#E60012] mb-3">
                    {formatCurrency(partObj.price)}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPartId(spot.partId);
                    }}
                    className={`flex-1 py-2 px-2 text-[11px] min-h-[36px] font-bold uppercase rounded-lg transition-colors text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
                      isSelected
                        ? 'bg-[#E60012] text-white'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                    }`}
                  >
                    {isSelected ? 'Seleccionado' : 'Ver en Plano'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPartDetail(partObj);
                    }}
                    aria-label={`Ver ficha técnica de ${partObj.name}`}
                    className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                    title="Ver Ficha Técnica"
                  >
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
