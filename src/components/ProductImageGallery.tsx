import React, { useState, useEffect, useMemo, useRef } from "react";
import { Layers, ArrowUpRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { BiLinkExternal } from "react-icons/bi";
import type { SuzukiPart, ExplodedDiagram } from "../types";
import { shouldShowProductImages } from "../utils/config";
import { ProductImageFallback } from "./ProductImageFallback";
import { DIAGRAM_SVGS } from "../data/svgAssets";

interface ProductImageGalleryProps {
  part: SuzukiPart;
  schematics?: ExplodedDiagram[];
  onViewSchematics?: (schematicId: string, partId: string) => void;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  part,
  schematics,
  onViewSchematics,
}) => {
  const [liveSchematics, setLiveSchematics] = useState<ExplodedDiagram[]>(
    schematics || [],
  );
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Drag to pan state for zoom
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1 || !containerRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    containerRef.current.scrollLeft = dragStart.scrollLeft - dx;
    containerRef.current.scrollTop = dragStart.scrollTop - dy;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    async function loadSchematics() {
      try {
        const res = await fetch("/api/schematics")
          .then((r) => r.json())
          .catch(() => ({ data: [] }));
        if (res?.data?.length > 0) setLiveSchematics(res.data);
      } catch (e) {
        console.error("Error fetching schematics in ProductImageGallery:", e);
      }
    }
    loadSchematics();
  }, []);

  useEffect(() => {
    if (schematics && schematics.length > 0) {
      setLiveSchematics(schematics);
    }
  }, [schematics]);

  const allDiagrams = liveSchematics;

  // Find schematic info by explicit hotspot match, schematicId or category fallback
  const diagramInfo = useMemo(() => {
    // 1. Direct Hotspot Match: Find schematic where this part is pinned in hotspots
    const hotspotMatch = allDiagrams.find(
      (d) =>
        d.hotspots &&
        Array.isArray(d.hotspots) &&
        d.hotspots.some((h) => h.partId === part.id),
    );

    if (hotspotMatch) {
      const spot = hotspotMatch.hotspots.find((h) => h.partId === part.id);
      return {
        id: hotspotMatch.id,
        title: hotspotMatch.title,
        section: hotspotMatch.section,
        hotspot: spot
          ? { itemNumber: spot.itemNumber, x: spot.x, y: spot.y }
          : null,
        image:
          hotspotMatch.diagramImage ||
          (DIAGRAM_SVGS as Record<string, string>)[hotspotMatch.id] ||
          "",
      };
    }

    // 2. Explicit part.schematicId Match
    if (part.schematicId) {
      const diagram = allDiagrams.find((d) => d.id === part.schematicId);
      if (diagram) {
        return {
          id: diagram.id,
          title: diagram.title,
          section: diagram.section,
          hotspot: part.diagramHotspot ?? null,
          image:
            diagram.diagramImage ||
            (DIAGRAM_SVGS as Record<string, string>)[diagram.id] ||
            "",
        };
      }
    }

    // 3. Category Fallback
    let categorySchematicId = "";
    if (part.category === "filtros") categorySchematicId = "diag-vstrom-intake";
    else if (part.category === "motor")
      categorySchematicId = "diag-gixxer-engine";
    else if (part.category === "transmision")
      categorySchematicId = "diag-transmission";
    else if (part.category === "frenos")
      categorySchematicId = "diag-gsxr-brake";

    if (categorySchematicId) {
      const diagram = allDiagrams.find((d) => d.id === categorySchematicId);
      if (diagram) {
        return {
          id: diagram.id,
          title: diagram.title,
          section: diagram.section,
          hotspot: part.diagramHotspot ?? null,
          image:
            diagram.diagramImage ||
            (DIAGRAM_SVGS as Record<string, string>)[diagram.id] ||
            "",
        };
      }
    }

    return null;
  }, [part, allDiagrams]);

  // ---------- CASE 1: Schematic Diagram Available — ALWAYS show the exploded view diagram image ----------
  if (diagramInfo) {
    const handleClick = () => {
      if (onViewSchematics && diagramInfo.id) {
        onViewSchematics(diagramInfo.id, part.id);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    };

    return (
      <div id="product-image-gallery" className="w-full space-y-2.5">
        {/* Header — diagram title + section + zoom controls */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <Layers
              className="w-3.5 h-3.5 text-[#E60012] shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <div className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-slate-500">
                Diagrama de Despiece Técnico
              </div>
              <div className="text-xs font-extrabold text-slate-900 truncate">
                {diagramInfo.title}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom Toolbar */}
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-0.5 rounded-lg shadow-2xs">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomLevel((prev) =>
                    Math.max(1, Number((prev - 0.25).toFixed(2))),
                  );
                }}
                disabled={zoomLevel <= 1}
                className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-40 transition-all cursor-pointer"
                title="Alejar zoom (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <span className="px-1 font-mono text-[10px] font-bold text-slate-800 min-w-[36px] text-center select-none">
                {Math.round(zoomLevel * 100)}%
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomLevel((prev) =>
                    Math.min(2.5, Number((prev + 0.25).toFixed(2))),
                  );
                }}
                disabled={zoomLevel >= 2.5}
                className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-40 transition-all cursor-pointer"
                title="Acercar zoom (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              {zoomLevel > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomLevel(1);
                  }}
                  className="p-1 rounded text-[#E60012] hover:bg-red-50 transition-all cursor-pointer"
                  title="Restablecer zoom (100%)"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
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
        </div>

        {/* Clickable diagram image (ALWAYS SHOWN) */}
        <div className="relative bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden min-h-[260px] sm:min-h-[320px] max-h-[360px] group shadow-xs transition-all hover:border-[#E60012] hover:shadow-md flex items-center justify-center p-3 bg-white">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`w-full h-[260px] sm:h-[320px] custom-scrollbar bg-white select-none relative flex items-center justify-center ${
              zoomLevel > 1
                ? isDragging
                  ? "overflow-auto cursor-grabbing"
                  : "overflow-auto cursor-grab"
                : "overflow-hidden cursor-pointer"
            }`}
            onClick={() => {
              if (zoomLevel <= 1) handleClick();
            }}
          >
            <div
              className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: zoomLevel > 1 ? "top left" : "center center",
              }}
            >
              <div className="relative inline-flex items-center justify-center max-w-full max-h-full">
                <img
                  src={diagramInfo.image}
                  alt={`Despiece: ${diagramInfo.title}`}
                  referrerPolicy="no-referrer"
                  style={{
                    maxHeight: "290px",
                    maxWidth: "100%",
                    objectFit: "contain",
                  }}
                  className="block pointer-events-none select-none"
                />

                {/* Hotspot pin — perfectly proportionate, concentric and centered */}
                {diagramInfo.hotspot && (
                  <div
                    className="absolute z-10 pointer-events-none flex items-center justify-center"
                    style={{
                      left: `${diagramInfo.hotspot.x}%`,
                      top: `${diagramInfo.hotspot.y}%`,
                      transform: `translate(-50%, -50%) scale(${1 / zoomLevel})`,
                    }}
                    aria-label={`Pieza #${diagramInfo.hotspot.itemNumber}`}
                  >
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full font-mono font-black text-[10px] bg-[#E60012] text-white ring-2 ring-white ring-offset-1 ring-offset-red-500/30 shadow-xs animate-pulse">
                      {diagramInfo.hotspot.itemNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hover CTA overlay */}
          <div
            onClick={handleClick}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-[#E60012] text-white text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-md opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
          >
            <BiLinkExternal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Abrir</span>
          </div>
        </div>
      </div>
    );
  }

  // ---------- CASE 2: Static product photo / fallback ----------
  return (
    <div id="product-image-gallery" className="w-full space-y-2">
      <div className="flex items-center justify-end px-1">
        {/* Zoom Toolbar for Static Photo */}
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-0.5 rounded-lg shadow-2xs">
          <button
            type="button"
            onClick={() =>
              setZoomLevel((prev) =>
                Math.max(1, Number((prev - 0.25).toFixed(2))),
              )
            }
            disabled={zoomLevel <= 1}
            className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-40 transition-all cursor-pointer"
            title="Alejar zoom (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="px-1 font-mono text-[10px] font-bold text-slate-800 min-w-[36px] text-center select-none">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            type="button"
            onClick={() =>
              setZoomLevel((prev) =>
                Math.min(2.5, Number((prev + 0.25).toFixed(2))),
              )
            }
            disabled={zoomLevel >= 2.5}
            className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-40 transition-all cursor-pointer"
            title="Acercar zoom (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {zoomLevel > 1 && (
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-1 rounded text-[#E60012] hover:bg-red-50 transition-all cursor-pointer"
              title="Restablecer zoom (100%)"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {shouldShowProductImages() ? (
        <div className="relative bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden aspect-4/3 sm:aspect-16/10 shadow-xs">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`w-full h-full p-4 flex items-center justify-center custom-scrollbar ${
              zoomLevel > 1
                ? isDragging
                  ? "overflow-auto cursor-grabbing"
                  : "overflow-auto cursor-grab"
                : "overflow-hidden"
            }`}
          >
            <img
              src={part.image}
              alt={part.name}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain transition-transform duration-200 origin-center select-none pointer-events-none"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: zoomLevel > 1 ? "top left" : "center center",
              }}
            />
          </div>
        </div>
      ) : (
        <ProductImageFallback
          part={part}
          size="lg"
          className="w-full aspect-4/3 sm:aspect-16/10"
        />
      )}
    </div>
  );
};
