import React, { useState, useMemo, useEffect } from "react";
import {
  AlertTriangle,
  HelpCircle,
  Eye,
  ShieldCheck,
  Globe,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Heart,
  Layers,
} from "lucide-react";
import { AiTwotoneSafetyCertificate } from "react-icons/ai";
import { TbAlertHexagonFilled } from "react-icons/tb";
import { FaCartPlus, FaMotorcycle } from "react-icons/fa6";
import type {
  SuzukiPart,
  ActiveMotorcycle,
  AvailabilityStatus,
  ExplodedDiagram,
} from "../types";
import {
  getAvailabilityStatus,
  AVAILABILITY_META,
  getPrimaryOem,
  getEstimatedDeliveryTime,
} from "../types";
import { formatCurrency } from "../utils/formatCurrency";
import { getProductWhatsAppUrl } from "../utils/whatsapp";
import {
  shouldShowProductImages,
  PRODUCT_CARD_SCHEMATIC_CONFIG,
} from "../utils/config";
import { useSiteSettings } from "./SiteSettingsProvider";
import { ProductImageEmptyState } from "./ProductImageEmptyState";
import { IoChatbubbleEllipses } from "react-icons/io5";

interface ProductCardProps {
  part: SuzukiPart;
  activeMotorcycle: ActiveMotorcycle | null;
  onOpenDetail: (part: SuzukiPart) => void;
  onAddToCart: (part: SuzukiPart) => void;
  onOpenGarageModal: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (partId: string) => void;
  schematics?: ExplodedDiagram[];
}

let globalSchematicsCache: ExplodedDiagram[] | null = null;
let globalSchematicsPromise: Promise<ExplodedDiagram[]> | null = null;

function fetchGlobalSchematics(): Promise<ExplodedDiagram[]> {
  if (globalSchematicsCache) return Promise.resolve(globalSchematicsCache);
  if (!globalSchematicsPromise) {
    globalSchematicsPromise = fetch("/api/schematics")
      .then((r) => r.json())
      .then((res) => {
        globalSchematicsCache = res?.data || [];
        return globalSchematicsCache!;
      })
      .catch(() => []);
  }
  return globalSchematicsPromise;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  part,
  activeMotorcycle,
  onOpenDetail,
  onAddToCart,
  onOpenGarageModal,
  isFavorite = false,
  onToggleFavorite,
  schematics,
}) => {
  const { settings } = useSiteSettings();
  const showPartSchematicOnCard = settings.showPartSchematicOnCard === true;

  const [internalSchematics, setInternalSchematics] = useState<ExplodedDiagram[]>(
    () => schematics || globalSchematicsCache || []
  );

  useEffect(() => {
    if (schematics && schematics.length > 0) {
      setInternalSchematics(schematics);
      globalSchematicsCache = schematics;
    } else if (showPartSchematicOnCard && (!internalSchematics || internalSchematics.length === 0)) {
      fetchGlobalSchematics().then((data) => {
        if (data && data.length > 0) {
          setInternalSchematics(data);
        }
      });
    }
  }, [schematics, showPartSchematicOnCard]);

  const allDiagrams = schematics && schematics.length > 0 ? schematics : internalSchematics;

  // Find schematic info strictly by explicit hotspot match or explicit part.schematicId
  const diagramInfo = useMemo(() => {
    if (!showPartSchematicOnCard) return null;

    // 1. Direct Hotspot Match in schematics array
    const hotspotMatch = allDiagrams.find(
      (d) =>
        d.hotspots &&
        Array.isArray(d.hotspots) &&
        d.hotspots.some((h) => h.partId === part.id)
    );

    if (hotspotMatch) {
      const spot = hotspotMatch.hotspots.find((h) => h.partId === part.id);
      return {
        id: hotspotMatch.id,
        title: hotspotMatch.title,
        section: hotspotMatch.section,
        hotspot: spot ? { itemNumber: spot.itemNumber, x: spot.x, y: spot.y } : null,
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
  }, [part, allDiagrams, showPartSchematicOnCard]);

  // Evaluate compatibility status against active motorcycle
  let isCompatible = false;

  if (activeMotorcycle) {
    const matchRule = part.compatibility.find((c) => {
      if (c.modelId !== activeMotorcycle.modelId) return false;
      if (
        (c.yearStart && activeMotorcycle.year < c.yearStart) ||
        (c.yearEnd && activeMotorcycle.year > c.yearEnd)
      )
        return false;
      if (c.version && c.version !== activeMotorcycle.version) return false;
      return true;
    });

    if (matchRule) {
      isCompatible = true;
    }
  }

  const [copied, setCopied] = useState(false);
  const primaryOem = getPrimaryOem(part);

  const handleCopyOem = () => {
    navigator.clipboard.writeText(primaryOem).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const showProductImages = shouldShowProductImages();

  const availabilityStatus: AvailabilityStatus = getAvailabilityStatus(part);

  const availabilityBadge = (() => {
    if (availabilityStatus === "in_stock") {
      return (
        <div className="bg-emerald-600/95 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-md shadow-sm border border-emerald-400/40 flex items-center gap-1 uppercase tracking-wider">
          <CheckCircle2 className="w-3 h-3 text-emerald-200 shrink-0" />
          <span>Disponible</span>
        </div>
      );
    }
    if (availabilityStatus === "international") {
      return (
        <div className="bg-blue-600/95 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-md shadow-sm border border-blue-400/40 flex items-center gap-1 uppercase tracking-wider">
          <Globe className="w-3 h-3 text-blue-200 shrink-0" />
          <span>Envío Internacional</span>
        </div>
      );
    }
    return (
      <div className="bg-amber-500/95 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-md shadow-sm border border-amber-300/40 flex items-center gap-1 uppercase tracking-wider">
        <Clock className="w-3 h-3 text-amber-100 shrink-0" />
        <span>Bajo Pedido</span>
      </div>
    );
  })();

  const compatibilityBadge = activeMotorcycle ? (
    isCompatible ? (
      <div className="bg-emerald-600/95 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-md shadow-sm border border-emerald-400/40 flex items-center gap-1 uppercase tracking-wider">
        <AiTwotoneSafetyCertificate className="w-3 h-3 text-emerald-200 shrink-0" />
        <span>Compatible</span>
      </div>
    ) : (
      <div className="bg-red-600/95 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-md shadow-sm border border-red-400/40 flex items-center gap-1 uppercase tracking-wider">
        <AlertTriangle className="w-3 h-3 text-red-200 shrink-0" />
        <span>No Compatible</span>
      </div>
    )
  ) : (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpenGarageModal();
      }}
      className="bg-amber-500/95 hover:bg-amber-600/95 text-white font-extrabold text-[10px] px-2 py-1 rounded-lg shadow-xs border border-amber-300/40 flex items-center gap-1 uppercase tracking-wider transition-colors cursor-pointer"
    >
      <HelpCircle className="w-3.5 h-3.5 text-amber-100 shrink-0" />
      <span>Validar Moto</span>
    </button>
  );

  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      setAspectRatio(naturalWidth / naturalHeight);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between group hover:-translate-y-0.5 ${
        activeMotorcycle
          ? isCompatible
            ? "border-emerald-300 shadow-xs hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-950/5"
            : "border-red-200 bg-red-50/10 shadow-xs opacity-95 hover:border-red-300"
          : "border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-lg hover:shadow-slate-950/5"
      }`}
    >
      <div>
        {diagramInfo ? (
          <div
            role="button"
            tabIndex={0}
            aria-label={`Ver detalles técnicos y despiece de ${part.name}`}
            onClick={() => onOpenDetail(part)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenDetail(part);
              }
            }}
            className="relative aspect-4/3 w-full bg-white border-b border-slate-200/80 overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] group/diagram"
          >
            {/* Definite viewport container for exact image bounding */}
            <div className="absolute inset-0 p-3 flex items-center justify-center min-w-0 min-h-0 overflow-hidden">
              <div
                className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-500 ease-out"
                style={{
                  ...(aspectRatio ? { aspectRatio: `${aspectRatio}` } : { maxWidth: "100%", maxHeight: "100%" }),
                  transformOrigin: diagramInfo.hotspot
                    ? `${diagramInfo.hotspot.x}% ${diagramInfo.hotspot.y}%`
                    : "center center",
                  transform: diagramInfo.hotspot
                    ? `scale(${isHovered ? PRODUCT_CARD_SCHEMATIC_CONFIG.hoverZoomScale : PRODUCT_CARD_SCHEMATIC_CONFIG.zoomScale})`
                    : "scale(1)",
                }}
              >
                <img
                  src={diagramInfo.image}
                  alt={`Despiece de ${part.name}`}
                  referrerPolicy="no-referrer"
                  onLoad={handleImageLoad}
                  className="w-full h-full object-contain pointer-events-none select-none block"
                />

                {/* Hotspot pin with configurable scale for zoomed card preview */}
                {diagramInfo.hotspot && (
                  <div
                    className="absolute z-10 pointer-events-none flex items-center justify-center"
                    style={{
                      left: `${diagramInfo.hotspot.x}%`,
                      top: `${diagramInfo.hotspot.y}%`,
                      transform: `translate(-50%, -50%) scale(${PRODUCT_CARD_SCHEMATIC_CONFIG.pinScale})`,
                    }}
                    aria-label={`Pieza #${diagramInfo.hotspot.itemNumber}`}
                  >
                    {/* Outer pulse ring */}
                    <div className="absolute w-5 h-5 rounded-full bg-red-600/35 animate-ping pointer-events-none" />

                    {/* Glowing halo */}
                    <div className="absolute w-4.5 h-4.5 rounded-full bg-[#E60012]/25 border border-[#E60012]/50 shadow-[0_0_6px_rgba(230,0,18,0.8)] pointer-events-none" />

                    {/* Core badge */}
                    <div className="relative w-4 h-4 rounded-full bg-[#E60012] border-[1.5px] border-white shadow-xs flex items-center justify-center font-mono font-black text-[9px] text-white select-none">
                      {diagramInfo.hotspot.itemNumber}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Badges on top */}
            <div className="absolute top-2.5 left-2.5 z-10">
              {compatibilityBadge}
            </div>

            <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
              <div className="bg-white/95 text-slate-800 font-bold text-[10px] uppercase px-2.5 py-1 rounded-md backdrop-blur-md border border-slate-200/80 shadow-xs">
                {part.category}
              </div>
            </div>

            {/* Bottom schematic tag badge */}
            <div className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/90 text-white font-mono text-[9px] font-bold shadow-xs backdrop-blur-xs border border-white/10">
              <Layers className="w-2.5 h-2.5 text-[#E60012]" aria-hidden="true" />
              <span>Despiece #{diagramInfo.hotspot?.itemNumber || "OEM"}</span>
            </div>
          </div>
        ) : showProductImages ? (
          <div
            role="button"
            tabIndex={0}
            aria-label={`Ver detalles de ${part.name}`}
            onClick={() => onOpenDetail(part)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenDetail(part);
              }
            }}
            className="relative aspect-4/3 bg-slate-100/80 overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
          >
            {showProductImages ? (
              <img
                src={part.image}
                alt={part.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            ) : (
              <ProductImageEmptyState className="w-full h-full rounded-none" />
            )}

            <div className="absolute top-2.5 left-2.5 z-10">
              {compatibilityBadge}
            </div>

            <div className="absolute top-2.5 right-2.5 z-10">
              <div className="bg-white/95 text-slate-800 font-bold text-[10px] uppercase px-2.5 py-1 rounded-md backdrop-blur-md border border-slate-200/80 shadow-xs">
                {part.category}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 pt-4 sm:px-5 sm:pt-5 flex items-start justify-between gap-2">
            {compatibilityBadge}
            <span className="bg-slate-100 text-slate-800 font-bold text-[10px] uppercase px-2.5 py-1 rounded-md border border-slate-200/80 shrink-0">
              {part.category}
            </span>
          </div>
        )}

        {/* Info */}
        <div className="p-4 sm:p-5">
          <h3
            role="button"
            tabIndex={0}
            onClick={() => onOpenDetail(part)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenDetail(part);
              }
            }}
            className="font-bold text-slate-900 text-base sm:text-lg leading-snug line-clamp-2 hover:text-[#E60012] cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] rounded"
          >
            {part.name}
          </h3>

          <p className="mt-1 font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <span>OEM:</span>
            <button
              type="button"
              onClick={handleCopyOem}
              aria-label={`Copiar referencia ${primaryOem}`}
              title="Copiar referencia"
              className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-slate-400 hover:text-[#E60012] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] rounded px-1 py-0.5 bg-slate-100 hover:bg-red-50"
            >
              {copied ? (
                <>
                  <Check className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                  <span className="text-emerald-600">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-2.5 h-2.5 shrink-0" />
                  <span>{primaryOem}</span>
                </>
              )}
            </button>
          </p>

          <p className="text-slate-600 text-xs mt-1.5 line-clamp-2 leading-relaxed">
            {part.description}
          </p>

          <div className="mt-2.5 w-fit">{availabilityBadge}</div>
        </div>
      </div>

      {/* Footer Price & Anti-Error Add to Cart */}
      <div className="p-4 sm:p-5 pt-3 border-t border-slate-100 mt-2 space-y-3">
        {/* Row 1: Price and Badges */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Precio
          </span>
          <div className="text-base sm:text-lg font-mono font-black text-slate-900 tracking-tight whitespace-nowrap">
            {formatCurrency(part.price)}
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div>
              {part.taxable !== false ? (
                part.priceIncludesTax ? (
                  <span
                    className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0"
                    title="El precio mostrado ya incluye el 19% IVA"
                  >
                    IVA Inc.
                  </span>
                ) : (
                  <span
                    className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shrink-0"
                    title="El precio no incluye IVA (se liquida al checkout)"
                  >
                    + 19% IVA
                  </span>
                )
              ) : (
                <span
                  className="text-[9px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded shrink-0"
                  title="Repuesto exento de IVA"
                >
                  Exento
                </span>
              )}
            </div>

            {availabilityStatus === "in_stock" && (
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-lg shrink-0 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{getEstimatedDeliveryTime(part, settings)}</span>
                <span className="text-emerald-500 font-normal">({part.stock})</span>
              </span>
            )}
            {availabilityStatus === "international" && (
              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-lg shrink-0 flex items-center gap-1">
                <Globe className="w-3 h-3 text-blue-600" />
                <span>{getEstimatedDeliveryTime(part, settings)}</span>
              </span>
            )}
            {availabilityStatus === "on_order" && (
              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-lg shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>{getEstimatedDeliveryTime(part, settings)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Action Buttons */}
        <div className="flex items-center gap-2">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(part.id);
              }}
              className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
                isFavorite
                  ? "bg-rose-500 text-white border-rose-600 shadow-xs"
                  : "bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-500 border-slate-200"
              }`}
              title={
                isFavorite ? "Quitar de Favoritos" : "Guardar en Favoritos"
              }
              aria-label={
                isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"
              }
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-white" : ""}`} />
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenDetail(part)}
            aria-label={`Ver detalles técnicos de ${part.name}`}
            className="w-11 h-11 flex items-center justify-center text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
            title="Ver Ficha Técnica"
          >
            <Eye className="w-4 h-4" />
          </button>

          <a
            href={getProductWhatsAppUrl(part, activeMotorcycle)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Consultar por WhatsApp sobre ${part.name}`}
            className="w-11 h-11 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-colors shrink-0 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
            title="Consultar por WhatsApp"
          >
            <IoChatbubbleEllipses />
          </a>

          {/* Strict Anti-Error Guard */}
          {!activeMotorcycle ? (
            <button
              type="button"
              onClick={onOpenGarageModal}
              aria-label="Validar motocicleta activa"
              className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
              title="Debes confirmar tu moto antes de añadir"
            >
              <FaMotorcycle className="w-5 h-5 shrink-0" />
            </button>
          ) : !isCompatible ? (
            <button
              type="button"
              onClick={() => onOpenDetail(part)}
              aria-label={`Producto no compatible: ver detalles de ${part.name}`}
              className="flex-1 py-2.5 px-3 bg-red-100 hover:bg-red-200 text-red-900 font-bold text-xs uppercase rounded-xl cursor-pointer flex items-center justify-center gap-1.5 border border-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
              title="Producto no compatible con la motocicleta activa. Haz clic para ver detalles."
            >
              <AlertTriangle className="w-4 h-4 text-[#E60012] shrink-0" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onAddToCart(part)}
              aria-label={`Añadir ${part.name} al carrito`}
              title="Añadir al Carrito"
              className="flex-1 py-2.5 px-3 bg-[#E60012] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
            >
              <FaCartPlus className="w-4 h-4 shrink-0" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
