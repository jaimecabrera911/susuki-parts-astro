import React, { useState, useEffect, useMemo, useRef } from "react";
import { Layers, ZoomIn, ZoomOut, RotateCcw, Package } from "lucide-react";
import { BiLinkExternal } from "react-icons/bi";
import type { SuzukiPart, ExplodedDiagram } from "../types";
import { shouldShowProductImages, getDetailPrimary } from "../utils/config";

interface ProductImageGalleryProps {
  part: SuzukiPart;
  schematics?: ExplodedDiagram[];
  onViewSchematics?: (schematicId: string, partId: string) => void;
}

type GalleryTab = "despiece" | "images";

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  part,
  schematics,
  onViewSchematics,
}) => {
  const [liveSchematics, setLiveSchematics] = useState<ExplodedDiagram[]>(
    schematics || [],
  );
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const galleryImages = useMemo(
    () =>
      part.images && part.images.length > 0
        ? part.images
        : part.image
          ? [part.image]
          : [],
    [part.images, part.image],
  );

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

  // Find schematic info by explicit hotspot match or schematicId.
  // Sin fallback por categoría: el despiece solo se muestra con vínculo real.
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
        image: hotspotMatch.diagramImage || "",
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
          image: diagram.diagramImage || "",
        };
      }
    }

    return null;
  }, [part, allDiagrams]);

  const showImages = shouldShowProductImages();
  const hasDespiece = !!diagramInfo;
  const hasVisibleImages = showImages && galleryImages.length > 0;
  const detailPrimary = getDetailPrimary();

  // Tab default comes from the global setting (preference, never a blocker).
  const [activeTab, setActiveTab] = useState<GalleryTab>(
    detailPrimary === "despiece" ? "despiece" : "images",
  );

  useEffect(() => {
    setActiveIndex(0);
    setZoomLevel(1);
    setActiveTab(detailPrimary === "despiece" ? "despiece" : "images");
  }, [part.id, detailPrimary]);

  const openSchematics = () => {
    if (onViewSchematics && diagramInfo) {
      onViewSchematics(diagramInfo.id, part.id);
    }
  };

  const handleClick = () => {
    if (zoomLevel <= 1) openSchematics();
  };

  const renderZoomToolbar = () => (
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
  );

  // ---------- DESPIECE TAB (exactly as the previous commit's Case 1) ----------
  const renderDespieceTab = () => {
    if (!diagramInfo) return null;
    return (
      <div className="w-full space-y-2.5">
        {/* Header — diagram title + hotspot badge + zoom controls */}
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
            {renderZoomToolbar()}
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

        {/* Clickable diagram image with fixed area */}
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
            onClick={handleClick}
          >
            <div
              className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: "center center",
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
            onClick={openSchematics}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-[#E60012] text-white text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-md opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
          >
            <BiLinkExternal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Abrir</span>
          </div>
        </div>
      </div>
    );
  };

  // ---------- IMAGES TAB (carousel with thumbnails) ----------
  const safeIndex =
    galleryImages.length === 0 ? 0 : Math.min(activeIndex, galleryImages.length - 1);

  const renderImagesTab = () => {
    if (galleryImages.length === 0) return null;
    return (
      <div className="w-full space-y-2">
        {/* Header — zoom controls */}
        <div className="flex items-center justify-between gap-2 px-1 min-h-[28px]">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Imagen {safeIndex + 1} de {galleryImages.length}
          </div>
          {renderZoomToolbar()}
        </div>

        {/* Main area — stable aspect */}
        <div className="relative bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden aspect-4/3 sm:aspect-16/10 shadow-xs group">
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
              key={galleryImages[safeIndex]}
              src={galleryImages[safeIndex]}
              alt={part.name}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain transition-transform duration-200 origin-center select-none pointer-events-none"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: "center center",
              }}
            />
          </div>
        </div>

        {/* Thumbnails strip */}
        {galleryImages.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar px-0.5 pb-0.5">
            {galleryImages.map((src, idx) => (
              <button
                key={src}
                type="button"
                onClick={() => {
                  setActiveIndex(idx);
                  setZoomLevel(1);
                }}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl border-2 overflow-hidden bg-white transition-all cursor-pointer ${
                  idx === safeIndex
                    ? "border-[#E60012] ring-2 ring-[#E60012]/15"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                aria-label={`Ver imagen ${idx + 1}`}
              >
                <img
                  src={src}
                  alt={`${part.name} ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ---------- RENDER ----------

  const tabsRow = hasDespiece && hasVisibleImages ? (
    <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-0.5 rounded-xl w-fit">
      <button
        type="button"
        onClick={() => {
          setActiveTab("despiece");
          setZoomLevel(1);
        }}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
          activeTab === "despiece"
            ? "bg-[#E60012] text-white shadow-xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-white"
        }`}
        aria-pressed={activeTab === "despiece"}
      >
        <Layers className="w-3.5 h-3.5" aria-hidden="true" />
        Despiece
      </button>
      <button
        type="button"
        onClick={() => {
          setActiveTab("images");
          setZoomLevel(1);
        }}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
          activeTab === "images"
            ? "bg-[#E60012] text-white shadow-xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-white"
        }`}
        aria-pressed={activeTab === "images"}
      >
        <Package className="w-3.5 h-3.5" aria-hidden="true" />
        Imágenes
      </button>
    </div>
  ) : null;

  // Empty state: only when there is neither despiece nor visible images.
  if (!hasDespiece && !hasVisibleImages) {
    return (
      <div
        id="product-image-gallery"
        className="w-full aspect-4/3 sm:aspect-16/10 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-2.5 text-slate-300"
      >
        <Package className="w-10 h-10" />
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
          {showImages ? "Sin imagen disponible" : "Imágenes no disponibles"}
        </span>
      </div>
    );
  }

  return (
    <div id="product-image-gallery" className="w-full space-y-2">
      {tabsRow}

      {/* Despiece: shown alone when there is no carousel need, or as its own tab */}
      {hasDespiece && (activeTab === "despiece" || !hasVisibleImages)
        ? renderDespieceTab()
        : renderImagesTab()}
    </div>
  );
};