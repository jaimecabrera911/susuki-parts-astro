import React, { useMemo } from 'react';
import { Layers, ArrowUpRight } from 'lucide-react';
import type { SuzukiPart } from '../types';
import { shouldShowProductImages } from '../utils/config';
import { ProductImageFallback } from './ProductImageFallback';
import { DIAGRAM_SVGS } from '../data/svgAssets';
import { EXPLODED_DIAGRAMS } from '../data/suzukiData';

interface ProductImageGalleryProps {
  part: SuzukiPart;
  onViewSchematics?: (schematicId: string, partId: string) => void;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  part,
  onViewSchematics,
}) => {
  // Find schematic info by explicit schematicId or by matching category fallback
  const diagramInfo = useMemo(() => {
    let schematicId = part.schematicId;
    
    // Fallback: match category if explicit schematicId is not set
    if (!schematicId) {
      if (part.category === 'filtros' || part.category === 'admision') schematicId = 'diag-vstrom-intake';
      else if (part.category === 'motor' || part.category === 'bujias') schematicId = 'diag-gixxer-engine';
      else if (part.category === 'transmision') schematicId = 'diag-transmission';
      else if (part.category === 'frenos') schematicId = 'diag-gsxr-brake';
    }

    if (!schematicId) return null;
    const diagram = EXPLODED_DIAGRAMS.find(d => d.id === schematicId);
    const svgImage = (DIAGRAM_SVGS as Record<string, string>)[schematicId];
    
    if (!diagram || !svgImage) return null;

    return {
      id: schematicId,
      title: diagram.title,
      section: diagram.section,
      hotspot: part.diagramHotspot ?? null,
      image: svgImage
    };
  }, [part]);

  // ---------- CASE 1: Schematic Diagram Available — ALWAYS show the exploded view diagram image ----------
  if (diagramInfo) {
    const handleClick = () => {
      if (onViewSchematics && diagramInfo.id) {
        onViewSchematics(diagramInfo.id, part.id);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    };

    return (
      <div className="w-full space-y-2.5">
        {/* Header — diagram title + section */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <Layers className="w-3.5 h-3.5 text-[#E60012] shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <div className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-slate-500">
                Diagrama de Despiece Técnico
              </div>
              <div className="text-xs font-extrabold text-slate-900 truncate">
                {diagramInfo.title}
              </div>
            </div>
          </div>
          {diagramInfo.hotspot && (
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 border border-red-200 shrink-0">
              <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-[#E60012]">
                Pieza
              </span>
              <span className="text-xs font-mono font-black text-[#E60012]">
                #{diagramInfo.hotspot.itemNumber}
              </span>
            </div>
          )}
        </div>

        {/* Clickable diagram image (ALWAYS SHOWN) */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-label={`Ver despiece ${diagramInfo.title} en la vista completa`}
          className="relative bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden aspect-16/10 cursor-pointer group shadow-xs transition-all hover:border-[#E60012] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
        >
          <div className="w-full h-full p-4 flex items-center justify-center overflow-hidden bg-white">
            <img
              src={diagramInfo.image}
              alt={`Despiece: ${diagramInfo.title}`}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            />
          </div>

          {/* Hotspot pin — pulsing red marker at the part's coordinate */}
          {diagramInfo.hotspot && (
            <div
              className="absolute z-10 pointer-events-none"
              style={{
                left: `${diagramInfo.hotspot.x}%`,
                top: `${diagramInfo.hotspot.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              aria-label={`Pieza #${diagramInfo.hotspot.itemNumber}`}
            >
              <span className="absolute inset-0 -m-2 rounded-full bg-[#E60012]/25 animate-ping" aria-hidden="true" />
              <span className="relative inline-flex items-center justify-center w-10 h-10 rounded-full font-mono font-black text-xs bg-[#E60012] text-white ring-4 ring-white shadow-xl">
                {diagramInfo.hotspot.itemNumber}
              </span>
            </div>
          )}

          {/* Hover CTA overlay */}
          <div className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-[#E60012] text-white text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-md opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none">
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Abrir despiece</span>
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-[10px] text-slate-500 px-1 leading-relaxed">
          Haz clic en la imagen del despiece para inspeccionar todos los componentes en la vista de diagramas.
        </p>
      </div>
    );
  }

  // ---------- CASE 2: Static product photo / fallback ----------
  return (
    <div className="w-full">
      {shouldShowProductImages() ? (
        <div className="relative bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden aspect-4/3 sm:aspect-16/10 shadow-xs">
          <div className="w-full h-full p-6 flex items-center justify-center overflow-hidden">
            <img
              src={part.image}
              alt={part.name}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      ) : (
        <ProductImageFallback part={part} size="lg" className="w-full aspect-4/3 sm:aspect-16/10" />
      )}
    </div>
  );
};
