import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import type { SuzukiPart } from '../types';
import { DIAGRAM_SVGS } from '../data/svgAssets';

interface ProductImageGalleryProps {
  part: SuzukiPart;
  onViewSchematics?: (schematicId: string) => void;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  part,
}) => {
  // Generate multi-angle gallery list
  const getGalleryImages = (): { id: string; url: string; label: string; isSchematic?: boolean }[] => {
    if (part.images && part.images.length > 0) {
      return part.images.map((url, i) => ({
        id: `img-${i}`,
        url,
        label: i === 0 ? 'Vista Principal' : `Vista Ángulo ${i + 1}`,
      }));
    }

    const gallery: { id: string; url: string; label: string; isSchematic?: boolean }[] = [
      {
        id: 'main-oem',
        url: part.image,
        label: 'Vista Principal OEM',
      },
    ];

    if (part.schematicId && DIAGRAM_SVGS[part.schematicId]) {
      gallery.push({
        id: 'schematic-view',
        url: DIAGRAM_SVGS[part.schematicId],
        label: 'Despiece Técnico',
        isSchematic: true,
      });
    }

    return gallery;
  };

  const images = getGalleryImages();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selected index when part changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [part.id]);

  const activeImage = images[selectedIndex] || images[0] || { id: 'fallback', url: part.image, label: 'Vista Principal' };

  // Hover zoom lens state
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Lightbox fullscreen zoom modal state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxScale, setLightboxScale] = useState(1);
  const [lightboxPos, setLightboxPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Handle Mouse Hover inside main image box
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  // Lightbox Controls
  const handleZoomIn = () => setLightboxScale((prev) => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setLightboxScale((prev) => Math.max(prev - 0.5, 1));
  const handleResetZoom = () => {
    setLightboxScale(1);
    setLightboxPos({ x: 0, y: 0 });
  };

  const handleNextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
    handleResetZoom();
  };

  const handlePrevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
    handleResetZoom();
  };

  // Dragging inside Lightbox
  const handleMouseDown = (e: React.MouseEvent) => {
    if (lightboxScale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - lightboxPos.x,
      y: e.clientY - lightboxPos.y,
    };
  };

  const handleMouseDrag = (e: React.MouseEvent) => {
    if (!isDragging || lightboxScale <= 1) return;
    setLightboxPos({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Close Lightbox on ESC key and lock body scroll
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen]);

  return (
    <div className="space-y-3 w-full">
      {/* 1. MAIN LARGE IMAGE BOX WITH HOVER MAGNIFIER */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsLightboxOpen(true)}
        className="relative bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden aspect-4/3 sm:aspect-16/10 cursor-zoom-in group select-none shadow-xs transition-all hover:border-slate-300"
      >
        {/* Main Visible Image */}
        <div className="w-full h-full p-6 flex items-center justify-center overflow-hidden">
          <img
            src={activeImage.url}
            alt={`${part.name} - ${activeImage.label}`}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-full object-contain transition-transform duration-200 ease-out"
            style={{
              transform: isHovering && (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) ? 'scale(1.4)' : 'scale(1)',
              transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
            }}
          />
        </div>

        {/* Hover Cue Badge */}
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none">
          <ZoomIn className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />
          <span>{isHovering ? 'Explorando Zoom' : 'Clic para Pantalla Completa'}</span>
        </div>

        {/* OEM Authenticity Badge */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs border border-slate-200/90 text-slate-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 pointer-events-none">
          <ShieldCheck className="w-3 h-3 text-emerald-600" aria-hidden="true" />
          <span>OEM #{part.oemNumber}</span>
        </div>

        {/* Fullscreen Button Icon Overlay */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLightboxOpen(true);
          }}
          aria-label="Ampliar imagen en pantalla completa"
          className="absolute bottom-3 right-3 w-11 h-11 flex items-center justify-center bg-white/90 hover:bg-white text-slate-800 hover:text-[#E60012] rounded-xl shadow-md border border-slate-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
          title="Ampliar imagen en pantalla completa"
        >
          <Maximize2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* 2. THUMBNAIL STRIP BELOW (NO TEXT LABELS, CLEAN THUMBNAILS ONLY) */}
      <div>
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {images.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                title={img.label}
                aria-label={`Seleccionar ${img.label}`}
                className={`group relative rounded-xl p-1 border transition-all cursor-pointer shrink-0 w-16 h-16 sm:w-20 sm:h-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
                  isSelected
                    ? 'border-[#E60012] bg-red-50/50 ring-2 ring-[#E60012]/30 shadow-xs scale-105'
                    : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="w-full h-full rounded-lg bg-white overflow-hidden flex items-center justify-center p-1 border border-slate-100">
                  <img
                    src={img.url}
                    alt={img.label}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. LIGHTBOX FULLSCREEN ZOOM MODAL (USING PORTAL TO BODY) */}
      {isLightboxOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada interactiva de imagen de producto"
          className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 select-none animate-in fade-in duration-200"
          onMouseUp={handleMouseUp}
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Lightbox Header Bar */}
          <div 
            className="flex items-center justify-between gap-4 text-white z-10 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-lg">
                OEM {part.oemNumber}
              </span>
              <div className="hidden sm:block">
                <h3 className="font-bold text-sm text-slate-100 truncate max-w-md">{part.name}</h3>
                <p className="text-[11px] text-slate-400">{activeImage.label}</p>
              </div>
            </div>

            {/* Lightbox Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={lightboxScale <= 1}
                  aria-label="Reducir zoom"
                  className="w-11 h-11 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                  title="Reducir zoom (-)"
                >
                  <ZoomOut className="w-4 h-4" aria-hidden="true" />
                </button>
                <span className="font-mono text-xs font-bold px-2 text-slate-200 min-w-[48px] text-center">
                  {Math.round(lightboxScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={lightboxScale >= 4}
                  aria-label="Aumentar zoom"
                  className="w-11 h-11 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                  title="Aumentar zoom (+)"
                >
                  <ZoomIn className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  aria-label="Restablecer zoom"
                  className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                  title="Restablecer tamaño"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                aria-label="Cerrar vista interactiva"
                className="w-11 h-11 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors cursor-pointer ml-2 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                title="Cerrar vista interactiva (ESC)"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Lightbox Main Canvas (Zoomable & Pannable) */}
          <div
            className="flex-1 relative flex items-center justify-center overflow-hidden my-4 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseDrag}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Image Button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                aria-label="Imagen anterior"
                className="absolute left-2 sm:left-6 z-20 w-11 h-11 flex items-center justify-center bg-slate-900/90 hover:bg-slate-800 text-white rounded-2xl border border-slate-700 shadow-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                title="Imagen Anterior"
              >
                <ChevronLeft className="w-6 h-6" aria-hidden="true" />
              </button>
            )}

            {/* Zoomable Image Container with contrast frame */}
            <div
              className="transition-transform duration-75 ease-out max-w-full max-h-full flex items-center justify-center"
              style={{
                transform: `translate(${lightboxPos.x}px, ${lightboxPos.y}px) scale(${lightboxScale})`,
              }}
            >
              <div className="bg-slate-900 border border-slate-700/80 p-3 sm:p-5 rounded-3xl shadow-2xl flex items-center justify-center max-h-[75vh] max-w-[85vw] min-w-[280px] min-h-[250px] overflow-hidden ring-1 ring-white/10 relative">
                <img
                  src={activeImage.url}
                  alt={part.name}
                  referrerPolicy="no-referrer"
                  className="max-h-[68vh] max-w-[80vw] w-auto h-auto object-contain rounded-xl pointer-events-none drop-shadow-2xl"
                />
              </div>
            </div>

            {/* Next Image Button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                aria-label="Siguiente imagen"
                className="absolute right-2 sm:right-6 z-20 w-11 h-11 flex items-center justify-center bg-slate-900/90 hover:bg-slate-800 text-white rounded-2xl border border-slate-700 shadow-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                title="Siguiente Imagen"
              >
                <ChevronRight className="w-6 h-6" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Lightbox Footer Thumbnail Selector */}
          <div 
            className="flex items-center justify-center gap-3 z-10 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 max-w-xl mx-auto overflow-x-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => {
                  setSelectedIndex(idx);
                  handleResetZoom();
                }}
                aria-label={`Ver ${img.label}`}
                title={img.label}
                className={`w-14 h-14 rounded-xl p-1 bg-slate-950 border transition-all cursor-pointer shrink-0 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
                  idx === selectedIndex
                    ? 'border-red-500 ring-2 ring-red-500/50 scale-105 shadow-lg'
                    : 'border-slate-700 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="w-full h-full rounded-lg bg-slate-900 flex items-center justify-center p-0.5 border border-slate-800">
                  <img
                    src={img.url}
                    alt={img.label}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain rounded"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

