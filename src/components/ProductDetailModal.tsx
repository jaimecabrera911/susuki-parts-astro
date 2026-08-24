import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Wrench,
  Factory,
  FileText,
  Maximize2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  EyeOff,
  Truck,
  Globe,
  Clock,
  Palette,
  ArrowRightLeft,
  Ruler,
  Sparkles,
  Tag,
} from "lucide-react";
import { FaMotorcycle } from "react-icons/fa";
import { FaCartPlus } from "react-icons/fa6";
import type {
  SuzukiPart,
  ActiveMotorcycle,
  ExplodedDiagram,
  SuzukiModel,
  PartVariant,
} from "../types";
import { getEstimatedDeliveryRange, getEstimatedDeliveryTime, getVariantTypeLabel, formatVariantAttributes } from "../types";
import { formatCurrency } from "../utils/formatCurrency";
import { getProductWhatsAppUrl } from "../utils/whatsapp";
import { shouldShowProductImages } from "../utils/config";
import { useSiteSettings } from "./SiteSettingsProvider";
import { ProductImageEmptyState } from "./ProductImageEmptyState";
import { IoChatbubbleEllipses } from "react-icons/io5";

import { ProductImageGallery } from "./ProductImageGallery";

interface ProductDetailModalProps {
  part: SuzukiPart | null;
  activeMotorcycle: ActiveMotorcycle | null;
  allParts?: SuzukiPart[];
  schematics?: ExplodedDiagram[];
  models?: SuzukiModel[];
  onClose: () => void;
  onAddToCart: (part: SuzukiPart, quantity?: number, selectedVariant?: PartVariant | null) => void;
  onOpenGarageModal: () => void;
  onViewSchematics: (schematicId: string, partId: string) => void;
  onSelectRelatedPart?: (part: SuzukiPart) => void;
  onOpenAsPage?: (part: SuzukiPart) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  part,
  activeMotorcycle,
  allParts = [],
  schematics,
  models = [],
  onClose,
  onAddToCart,
  onOpenGarageModal,
  onViewSchematics,
  onSelectRelatedPart,
  onOpenAsPage,
}) => {
  const [copiedOem, setCopiedOem] = useState<string | null>(null);
  const [showAllOems, setShowAllOems] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedVariant, setSelectedVariant] = useState<PartVariant | null>(null);
  const { settings } = useSiteSettings();

  useEffect(() => {
    setQuantity(1);
    if (part?.variants && part.variants.length > 0) {
      const activeVars = part.variants.filter((v) => v.active !== false);
      const firstInStock = activeVars.find((v) => v.stock > 0) || activeVars[0] || null;
      setSelectedVariant(firstInStock);
    } else {
      setSelectedVariant(null);
    }
  }, [part?.id]);

  const handleCopyOem = (oem: string) => {
    navigator.clipboard.writeText(oem).then(() => {
      setCopiedOem(oem);
      setTimeout(() => setCopiedOem(null), 2000);
    });
  };

  // Handle Escape key and body scroll lock
  React.useEffect(() => {
    if (!part) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [part, onClose]);

  if (!part) return null;

  // Compatibility evaluation
  let isCompatible = false;
  let compatibilityRule = null;

  if (activeMotorcycle) {
    compatibilityRule = part.compatibility.find((c) => {
      if (c.modelId !== activeMotorcycle.modelId) return false;
      if (
        (c.yearStart && activeMotorcycle.year < c.yearStart) ||
        (c.yearEnd && activeMotorcycle.year > c.yearEnd)
      )
        return false;
      if (c.version && c.version !== activeMotorcycle.version) return false;
      return true;
    });
    isCompatible = !!compatibilityRule;
  }

  // Calculate strictly compatible related parts
  const isPartCompatibleWithMoto = (
    p: SuzukiPart,
    moto: ActiveMotorcycle,
  ): boolean => {
    return p.compatibility.some((c) => {
      if (c.modelId !== moto.modelId) return false;
      if (
        (c.yearStart && moto.year < c.yearStart) ||
        (c.yearEnd && moto.year > c.yearEnd)
      )
        return false;
      if (c.version && c.version !== moto.version) return false;
      return true;
    });
  };

  let relatedParts: SuzukiPart[] = [];
  if (activeMotorcycle) {
    // STRICT RULE: ONLY parts compatible with activeMotorcycle
    relatedParts = allParts.filter(
      (p) => p.id !== part.id && isPartCompatibleWithMoto(p, activeMotorcycle),
    );
  } else {
    // If no active motorcycle, parts sharing compatibility models
    const currentModelIds = new Set(part.compatibility.map((c) => c.modelId));
    relatedParts = allParts.filter(
      (p) =>
        p.id !== part.id &&
        p.compatibility.some((c) => currentModelIds.has(c.modelId)),
    );
  }

  // Effective dynamic values considering selected variant
  const effectivePrice = selectedVariant?.price != null ? selectedVariant.price : part.price;
  const effectiveStock = selectedVariant ? selectedVariant.stock : part.stock;
  const effectiveSku = selectedVariant?.sku || part.sku || `SKU-${part.id}`;

  return (
    <div
      id="product-detail-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto"
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 my-auto"
      >
        {/* Header Action Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          {onOpenAsPage && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAsPage(part);
              }}
              aria-label="Abrir en vista dedicada de página completa"
              className="p-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors border border-slate-200/80 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
              title="Abrir en vista dedicada de página completa"
            >
              <Maximize2
                className="w-3.5 h-3.5 text-[#E60012]"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Página Completa</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalles de producto"
            className="w-11 h-11 flex items-center justify-center text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Top Compatibility Seal */}
        <div
          className={`p-4 rounded-xl mb-6 flex items-start gap-3 border ${
            activeMotorcycle
              ? isCompatible
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-red-50 border-red-200 text-red-900"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          {activeMotorcycle ? (
            isCompatible ? (
              <>
                <ShieldCheck
                  className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <h4 className="font-extrabold text-sm uppercase text-emerald-900">
                    COMPATIBILIDAD 100% GARANTIZADA
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Esta pieza con código OEM{" "}
                    <span className="font-mono font-bold">
                      {part.oemNumbers[0]}
                    </span>{" "}
                    está verificada y garantizada para tu{" "}
                    <span className="font-bold">
                      {activeMotorcycle.modelName} ({activeMotorcycle.year})
                    </span>
                    .
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle
                  className="w-6 h-6 text-red-600 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <h4 className="font-extrabold text-sm uppercase text-red-900">
                    NO COMPATIBLE CON TU MOTO ACTIVA
                  </h4>
                  <p className="text-xs text-red-900 mt-0.5 font-medium">
                    Este repuesto NO es compatible con tu vehículo activo (
                    <span className="font-bold">
                      {activeMotorcycle.modelName} {activeMotorcycle.year}
                    </span>
                    ). Evita selecciones erróneas cambiando la moto en tu
                    Garaje.
                  </p>
                </div>
              </>
            )
          ) : (
            <>
              <Wrench
                className="w-6 h-6 text-amber-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="flex items-center justify-between w-full">
                <div>
                  <h4 className="font-extrabold text-sm uppercase text-amber-900">
                    MOTOCICLETA NO SELECCIONADA
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Selecciona tu modelo y año antes de proceder con el pedido
                    para verificar tolerancias exactas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenGarageModal}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase rounded-lg shadow-xs shrink-0 ml-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                >
                  Seleccionar
                </button>
              </div>
            </>
          )}
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Interactive Image Gallery & Schematic link */}
          <div className="space-y-3">
            <ProductImageGallery
              part={part}
              schematics={schematics}
              selectedImageOverride={selectedVariant?.image || null}
              onViewSchematics={(sId: string, pId: string) => {
                onClose();
                onViewSchematics(sId, pId);
              }}
            />

            {/* OEM References Section — colapsable, light style */}
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Factory
                    className="w-4 h-4 text-slate-500"
                    aria-hidden="true"
                  />
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-600">
                    Referencias OEM & Cross-Reference
                  </span>
                </div>
                {part.oemNumbers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowAllOems(!showAllOems)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-md text-[10px] font-bold text-slate-600 transition-colors"
                  >
                    {showAllOems
                      ? "Ver solo principal"
                      : `Ver las ${part.oemNumbers.length} refs (Cross-Ref)`}
                  </button>
                )}
              </div>

              {/* Informative Banner when OEM has supersessions / multiple versions */}
              {part.oemNumbers && part.oemNumbers.length > 1 && (
                <div className="mb-3.5 p-3 rounded-xl bg-blue-50/90 border border-blue-200 text-slate-800 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 text-[#0A3088] flex items-center justify-center shrink-0 mt-0.5">
                      <ArrowRightLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-[#0A3088] uppercase tracking-wider text-[11px]">
                          Actualización Oficial de Referencia OEM
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                          100% Compatible
                        </span>
                      </div>
                      <p className="text-slate-700 text-[11px] leading-relaxed">
                        Esta pieza con referencia vigente{" "}
                        <strong className="font-mono text-slate-900 font-bold">
                          {part.oemNumbers[0]}
                        </strong>{" "}
                        sustituye y reemplaza oficialmente a las versiones anteriores (
                        {part.oemNumbers.slice(1).map((oldOem, i) => (
                          <span key={oldOem}>
                            {i > 0 && ", "}
                            <span className="font-mono font-semibold text-slate-900">{oldOem}</span>
                          </span>
                        ))}
                        ). Es la misma pieza original con calidad y especificaciones garantizadas.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <ul className="space-y-2">
                {(showAllOems
                  ? part.oemNumbers
                  : part.oemNumbers.slice(0, 1)
                ).map((oem, idx) => {
                  const isPrimary = idx === 0;
                  const isCopied = copiedOem === oem;
                  return (
                    <li
                      key={oem}
                      className={`p-2.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                        isPrimary
                          ? "bg-emerald-50/80 border-emerald-200"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-slate-900 text-sm tracking-wider select-all">
                            {oem}
                          </span>
                          {isPrimary ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider rounded-md shrink-0">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Vigente / Actual
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-[#0A3088] text-[10px] font-bold uppercase tracking-wider rounded-md shrink-0"
                              title="Referencia anterior que fue reemplazada por la versión vigente"
                            >
                              <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                              Versión Anterior (Sustituida)
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyOem(oem)}
                        aria-label={`Copiar referencia ${oem}`}
                        title="Copiar referencia al portapapeles"
                        className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          isCopied
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-white" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-500" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {part.oemNumbers.length > 1 && (
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAllOems(!showAllOems)}
                    aria-expanded={showAllOems}
                    aria-controls="oem-references-list"
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {showAllOems ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                        Ocultar referencias alternativas
                      </>
                    ) : (
                      <>
                        <ChevronDown
                          className="w-3.5 h-3.5"
                          aria-hidden="true"
                        />
                        Ver {part.oemNumbers.length - 1}{" "}
                        {part.oemNumbers.length - 1 === 1
                          ? "referencia alternativa"
                          : "referencias alternativas"}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Technical Specs & Description */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#E60012] bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                  {part.category}
                </span>
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                  Código Interno: <strong className="text-slate-900">{effectiveSku}</strong>
                </span>
              </div>
              <h2
                id="product-detail-modal-title"
                className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5 leading-tight tracking-tight"
              >
                {part.name}
              </h2>

              {/* Availability, Stock Indicator & Estimated Delivery Window */}
              {(() => {
                const deliveryRange = getEstimatedDeliveryRange(part, settings);
                return (
                  <div className="mt-2.5 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {effectiveStock > 0 ? (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase tracking-wide border ${
                            effectiveStock <= 5
                              ? "bg-amber-50 text-amber-800 border-amber-200/90"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200/90"
                          }`}
                        >
                          <span className="relative flex h-2 w-2">
                            <span
                              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                effectiveStock <= 5 ? "bg-amber-400" : "bg-emerald-400"
                              }`}
                            />
                            <span
                              className={`relative inline-flex rounded-full h-2 w-2 ${
                                effectiveStock <= 5 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                            />
                          </span>
                          {effectiveStock <= 5
                            ? `¡Últimas ${effectiveStock} unid. en bodega!`
                            : `En Stock (${effectiveStock} unidades)`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase tracking-wide border bg-red-50 text-red-800 border-red-200">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          Agotado Temporalmente
                        </span>
                      )}

                      {/* Lead Time / Sourcing Badge */}
                      {part.availability === 'international' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Globe className="w-3 h-3 text-blue-600" />
                          Importación Suzuki
                        </span>
                      ) : part.availability === 'on_order' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Bajo Pedido
                        </span>
                      ) : null}
                    </div>

                    {/* Prominent Estimated Delivery Window */}
                    {deliveryRange && (
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-700 bg-slate-50 border border-slate-200/90 px-2.5 py-1.5 rounded-xl w-fit">
                        {part.availability === 'international' ? (
                          <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        ) : part.availability === 'on_order' ? (
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        ) : (
                          <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-600">Entrega estimada:</span>
                        <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs font-mono">
                          {deliveryRange.shortAbbrRange}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                          ({deliveryRange.formattedDays})
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Price & Tax */}
              <div className="flex items-baseline gap-2.5 mt-2.5 flex-wrap">
                <div className="text-2xl sm:text-3xl font-mono font-black text-[#E60012] tracking-tight">
                  {formatCurrency(effectivePrice)}
                </div>
                {part.taxable !== false ? (
                  part.priceIncludesTax ? (
                    <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
                      IVA 19% Incluido
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md">
                      + 19% IVA al checkout
                    </span>
                  )
                ) : (
                  <span className="text-[11px] font-mono font-bold text-blue-800 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-md">
                    Exento de IVA
                  </span>
                )}
              </div>
            </div>

            {/* Adaptive Multi-Attribute & Single-Attribute Variant Selector */}
            {part.variants && part.variants.length > 0 && (() => {
              const activeVariants = part.variants.filter((v) => v.active !== false);
              if (activeVariants.length === 0) return null;

              // Check if variants have multi-attribute configuration
              const hasMultiAttrs = activeVariants.some(
                (v) => Array.isArray(v.attributes) && v.attributes.length > 1
              );

              if (hasMultiAttrs) {
                // Extract unique axis names in appearance order
                const axisNames: string[] = [];
                activeVariants.forEach((v) => {
                  if (Array.isArray(v.attributes)) {
                    v.attributes.forEach((a) => {
                      if (!axisNames.includes(a.name)) axisNames.push(a.name);
                    });
                  }
                });

                const currentAttrs = selectedVariant?.attributes || [];

                return (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-mono">
                        <Sparkles className="w-3.5 h-3.5 text-[#0A3088]" />
                        <span>Opciones del Repuesto:</span>
                      </span>
                      {selectedVariant && (
                        <span className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs font-mono">
                          {formatVariantAttributes(selectedVariant)}
                        </span>
                      )}
                    </div>

                    {axisNames.map((axisName) => {
                      const valueOptionsMap = new Map<
                        string,
                        { value: string; code?: string; hex?: string }
                      >();
                      activeVariants.forEach((v) => {
                        const attr = v.attributes?.find((a) => a.name === axisName);
                        if (attr && !valueOptionsMap.has(attr.value)) {
                          valueOptionsMap.set(attr.value, {
                            value: attr.value,
                            code: attr.code || undefined,
                            hex:
                              attr.hex ||
                              (v.colorHex && axisName.toLowerCase().includes("color")
                                ? v.colorHex
                                : undefined),
                          });
                        }
                      });

                      const currentVal = currentAttrs.find(
                        (a) => a.name === axisName
                      )?.value;
                      const isColorAxis =
                        axisName.toLowerCase().includes("color") ||
                        Array.from(valueOptionsMap.values()).some((o) => o.hex);

                      const AxisIcon = isColorAxis
                        ? Palette
                        : axisName.toLowerCase().includes("lado") ||
                          axisName.toLowerCase().includes("posic")
                        ? ArrowRightLeft
                        : axisName.toLowerCase().includes("medida") ||
                          axisName.toLowerCase().includes("calibre")
                        ? Ruler
                        : axisName.toLowerCase().includes("material")
                        ? ShieldCheck
                        : axisName.toLowerCase().includes("acabado")
                        ? Sparkles
                        : Tag;

                      return (
                        <div key={axisName} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 font-mono">
                              <AxisIcon className="w-3 h-3 text-slate-500" />
                              <span>{axisName}:</span>
                            </span>
                            {currentVal && (
                              <span className="text-[10px] font-bold text-[#0A3088] font-mono">
                                {currentVal}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {Array.from(valueOptionsMap.values()).map((opt) => {
                              const isSelected = currentVal === opt.value;

                              const targetAttrs = axisNames.map((name) => {
                                if (name === axisName) return { name, value: opt.value };
                                const current = currentAttrs.find((a) => a.name === name);
                                return { name, value: current?.value || "" };
                              });

                              let candidate = activeVariants.find((v) =>
                                targetAttrs.every((t) =>
                                  v.attributes?.some(
                                    (a) => a.name === t.name && a.value === t.value
                                  )
                                )
                              );

                              if (!candidate) {
                                candidate = activeVariants.find((v) =>
                                  v.attributes?.some(
                                    (a) => a.name === axisName && a.value === opt.value
                                  )
                                );
                              }

                              const isOutOfStock = candidate && candidate.stock <= 0;

                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  disabled={!candidate}
                                  onClick={() => {
                                    if (candidate) setSelectedVariant(candidate);
                                  }}
                                  className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-white border-[#0A3088] ring-2 ring-[#0A3088]/20 shadow-xs text-slate-900"
                                      : "bg-white/80 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-white"
                                  } ${
                                    !candidate
                                      ? "opacity-30 cursor-not-allowed"
                                      : isOutOfStock
                                      ? "opacity-60"
                                      : ""
                                  }`}
                                >
                                  {opt.hex ? (
                                    <div
                                      className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs shrink-0"
                                      style={{ backgroundColor: opt.hex }}
                                    />
                                  ) : null}
                                  <span>
                                    {opt.value}{" "}
                                    {opt.code && !opt.value.includes(opt.code)
                                      ? `(${opt.code})`
                                      : ""}
                                  </span>
                                  {isOutOfStock && (
                                    <span className="text-[9px] font-mono text-amber-700 bg-amber-50 px-1 py-0.2 rounded">
                                      Agotado
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }

              // Single-attribute variants UI
              const vType = activeVariants[0].variantType || "color";
              const typeLabel = getVariantTypeLabel(vType);

              const HeaderIcon =
                vType === "color"
                  ? Palette
                  : vType === "side"
                  ? ArrowRightLeft
                  : vType === "size"
                  ? Ruler
                  : vType === "material"
                  ? ShieldCheck
                  : vType === "finish"
                  ? Sparkles
                  : Tag;

              return (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-mono">
                      <HeaderIcon className="w-3.5 h-3.5 text-[#0A3088]" />
                      <span>{typeLabel} Disponible:</span>
                    </span>
                    {selectedVariant && (
                      <span className="text-[11px] font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs font-mono">
                        {formatVariantAttributes(selectedVariant)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {activeVariants.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const isOutOfStock = variant.stock <= 0;
                      const isColorVariant =
                        variant.variantType === "color" ||
                        (!variant.variantType && !!variant.colorHex);

                      const PillIcon =
                        variant.variantType === "side"
                          ? ArrowRightLeft
                          : variant.variantType === "size"
                          ? Ruler
                          : variant.variantType === "material"
                          ? ShieldCheck
                          : variant.variantType === "finish"
                          ? Sparkles
                          : Tag;

                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => setSelectedVariant(variant)}
                          className={`group relative flex items-center gap-2 p-1.5 pr-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-white border-[#0A3088] ring-2 ring-[#0A3088]/20 shadow-xs"
                              : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white"
                          } ${isOutOfStock ? "opacity-50" : ""}`}
                        >
                          {/* Visual Swatch or Icon */}
                          {isColorVariant ? (
                            <div
                              className="w-5 h-5 rounded-full border border-black/15 shadow-2xs shrink-0"
                              style={{ backgroundColor: variant.colorHex || "#0045A5" }}
                            />
                          ) : (
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                                isSelected
                                  ? "bg-blue-50 border-[#0A3088] text-[#0A3088]"
                                  : "bg-slate-100 border-slate-200 text-slate-600"
                              }`}
                            >
                              <PillIcon className="w-3.5 h-3.5" />
                            </div>
                          )}

                          <div className="text-left">
                            <div className="text-xs font-bold text-slate-900 leading-tight">
                              {variant.name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">
                              {variant.colorCode || variant.sku || ""}
                              {variant.price != null && variant.price !== part.price && (
                                <span className="text-[#E60012] font-bold ml-1">
                                  · {formatCurrency(variant.price)}
                                </span>
                              )}
                              {variant.stock > 0 ? (
                                <span className="text-emerald-700 font-semibold ml-1">
                                  · {variant.stock} disp.
                                </span>
                              ) : (
                                <span className="text-red-600 font-semibold ml-1">
                                  · Agotado
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
              {part.description}
            </p>

            {/* Trust Mini Strip */}
            <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-[10px]">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 p-1.5 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-bold text-slate-800 truncate">100% Genuino</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 p-1.5 rounded-lg">
                <Wrench className="w-3.5 h-3.5 text-[#0A3088] shrink-0" />
                <span className="font-bold text-slate-800 truncate">Ajuste Exacto</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50/70 border border-emerald-200/80 p-1.5 rounded-lg">
                <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-bold text-emerald-900 truncate" title={`Tiempo estimado de despacho: ${getEstimatedDeliveryRange(part, settings).shortAbbrRange}`}>
                  {getEstimatedDeliveryRange(part, settings).shortAbbrRange}
                </span>
              </div>
            </div>

            {/* Spec Sheet Table */}
            <div>
              <h4 className="text-xs font-extrabold uppercase text-slate-900 mb-1.5 flex items-center gap-1.5">
                <FileText
                  className="w-3.5 h-3.5 text-[#E60012]"
                  aria-hidden="true"
                />
                Especificaciones Técnicas
              </h4>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1 text-xs">
                {part.specs.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between border-b border-slate-200/60 pb-1 last:border-none"
                  >
                    <span className="text-slate-500 font-medium">
                      {s.label}:
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Applicability Range Badges / Table */}
            <div>
              <h4 className="text-xs font-extrabold uppercase text-slate-900 mb-1.5 flex items-center gap-1.5">
                <FaMotorcycle
                  className="w-3.5 h-3.5 text-[#E60012]"
                  aria-hidden="true"
                />
                Vehículos Asociados & Compatibilidad
              </h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                {part.compatibility.map((c, idx) => {
                  const modelObj = models.find((m) => m.id === c.modelId);
                  const isMatch = activeMotorcycle
                    ? activeMotorcycle.modelId === c.modelId
                    : false;
                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl text-xs flex justify-between items-center border transition-colors ${
                        isMatch
                          ? "bg-emerald-50 border-emerald-300 text-emerald-950 ring-1 ring-emerald-400/20"
                          : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <div>
                        <div className="font-extrabold flex items-center gap-1.5 text-xs">
                          {modelObj ? modelObj.name : c.modelId.toUpperCase()}
                          {isMatch && (
                            <span className="text-[9px] font-mono font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded uppercase">
                              Tu Moto
                            </span>
                          )}
                        </div>
                        {c.version && (
                          <div className="text-[10px] text-slate-500 font-medium">
                            {c.version}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-[10px] font-bold text-slate-700 bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md">
                          {c.yearStart} - {c.yearEnd}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section (Strictly Compatible with Active Motorcycle) */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <ShieldCheck
                  className="w-4 h-4 text-emerald-600"
                  aria-hidden="true"
                />
                Repuestos Relacionados Garantizados
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {activeMotorcycle ? (
                  <>
                    Mostrando repuestos 100% compatibles con tu{" "}
                    <span className="font-bold text-slate-800">
                      {activeMotorcycle.modelName} ({activeMotorcycle.year})
                    </span>
                  </>
                ) : (
                  "Selecciona una motocicleta en tu garaje para verificar compatibilidad exacta."
                )}
              </p>
            </div>
          </div>

          {relatedParts.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center text-xs text-slate-500">
              No hay otros repuestos registrados para este modelo en este
              momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {relatedParts.slice(0, 3).map((relPart) => (
                <div
                  key={relPart.id}
                  className="bg-slate-50 hover:bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between transition-all hover:shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">
                        {relPart.oemNumbers[0]}
                      </span>
                      {activeMotorcycle && (
                        <span className="text-[9px] font-extrabold text-emerald-600 flex items-center gap-0.5">
                          <CheckCircle2
                            className="w-3 h-3"
                            aria-hidden="true"
                          />{" "}
                          Compatible
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 items-center mb-1.5">
                      {shouldShowProductImages() ? (
                        <img
                          src={relPart.image}
                          alt={relPart.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 object-cover rounded-lg bg-slate-200 shrink-0"
                        />
                      ) : (
                        <ProductImageEmptyState className="w-9 h-9 shrink-0" />
                      )}

                      <h4 className="text-[11px] font-bold text-slate-900 line-clamp-2 leading-tight">
                        {relPart.name}
                      </h4>
                    </div>
                    <div className="text-xs font-mono font-black text-slate-900 mb-2 whitespace-nowrap text-[#E60012]">
                      {formatCurrency(relPart.price)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={() =>
                        onSelectRelatedPart && onSelectRelatedPart(relPart)
                      }
                      className="flex-1 py-1.5 px-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[10px] uppercase rounded-lg transition-colors text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                    >
                      Ver Detalle
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddToCart(relPart)}
                      className="py-1.5 px-2 bg-[#E60012] hover:bg-red-700 text-white font-bold text-[10px] uppercase rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                      title="Añadir al carrito"
                      aria-label={`Añadir ${relPart.name} al carrito`}
                    >
                      <FaCartPlus className="w-3 h-3" aria-hidden="true" />
                      <span>Carrito</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Unified Purchase & Technical Advisory Console */}
        <div className="mt-6 border-t border-slate-200 pt-4 space-y-3">
          {part.active === false ? (
            <div className="flex items-center gap-3 bg-slate-100 border border-slate-300 p-3.5 rounded-2xl">
              <EyeOff className="w-5 h-5 text-slate-500 shrink-0" />
              <div className="text-xs text-slate-700">
                <span className="font-extrabold uppercase block text-slate-900">Repuesto No Disponible</span>
                <span className="text-[11px] text-slate-600">Este repuesto se encuentra temporalmente deshabilitado en el catálogo.</span>
              </div>
            </div>
          ) : !activeMotorcycle ? (
            /* No Motorcycle Selected */
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-amber-50/80 border border-amber-200 p-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs text-amber-900">
                  <span className="font-extrabold uppercase block">Selecciona tu motocicleta</span>
                  <span className="text-[11px] text-amber-800">Verifica la compatibilidad antes de agregar al carrito.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenGarageModal}
                className="px-5 py-2.5 min-h-[44px] bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] shrink-0 active:scale-[0.99]"
              >
                <FaMotorcycle className="w-4 h-4" />
                <span>Seleccionar Moto</span>
              </button>
            </div>
          ) : !isCompatible ? (
            /* Incompatible Vehicle */
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-red-50/80 border border-red-200 p-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#E60012] shrink-0" />
                <div className="text-xs text-red-900">
                  <span className="font-extrabold uppercase block">Compra Bloqueada</span>
                  <span className="text-[11px] text-red-800">Pieza no compatible con {activeMotorcycle.modelName} ({activeMotorcycle.year}).</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenGarageModal}
                className="px-4 py-2 min-h-[40px] bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] shrink-0"
              >
                <FaMotorcycle className="w-4 h-4" />
                <span>Cambiar Moto</span>
              </button>
            </div>
          ) : (
            /* Compatible Vehicle: Primary Purchase Console */
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              {/* Ergonomic Stepper */}
              <div className="flex items-center justify-between sm:justify-center border border-slate-300 rounded-xl bg-slate-50 p-1 shadow-2xs sm:min-w-[130px]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Disminuir cantidad"
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer border border-slate-200/80 shadow-2xs active:scale-95"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex flex-col items-center px-1.5">
                  <input
                    type="number"
                    min={1}
                    max={part.stock > 0 ? part.stock : 99}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1) {
                        setQuantity(part.stock > 0 ? Math.min(part.stock, val) : val);
                      }
                    }}
                    className="w-10 text-center font-mono font-black text-sm bg-transparent border-none focus:outline-none text-slate-900"
                    aria-label="Cantidad"
                  />
                  <span className="text-[8px] font-bold uppercase text-slate-400 -mt-1 select-none">
                    {quantity === 1 ? "Unidad" : "Unidades"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => (part.stock > 0 ? Math.min(part.stock, q + 1) : q + 1))}
                  disabled={part.stock > 0 && quantity >= part.stock}
                  aria-label="Aumentar cantidad"
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer border border-slate-200/80 shadow-2xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Primary Add to Cart CTA */}
              <button
                type="button"
                onClick={() => {
                  onAddToCart(part, quantity, selectedVariant);
                  onClose();
                }}
                disabled={effectiveStock === 0}
                className="flex-1 py-3 px-5 min-h-[46px] bg-[#E60012] hover:bg-[#b5000b] disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] active:scale-[0.99]"
              >
                <FaCartPlus className="w-4 h-4" aria-hidden="true" />
                <div className="flex items-center gap-2">
                  <span>Añadir al Carrito</span>
                  {quantity > 1 && (
                    <span className="font-mono text-[11px] bg-white/20 px-2 py-0.5 rounded-md font-black">
                      {formatCurrency(effectivePrice * quantity)}
                    </span>
                  )}
                </div>
              </button>
            </div>
          )}

          {/* Secondary WhatsApp Technical Advisory Channel */}
          <div className="pt-0.5">
            <a
              href={getProductWhatsAppUrl(part, activeMotorcycle)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 min-h-[40px] bg-emerald-50/70 hover:bg-emerald-100/90 text-emerald-900 border border-emerald-200/90 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-2xs group"
            >
              <IoChatbubbleEllipses className="w-4 h-4 text-[#25D366] shrink-0 group-hover:scale-110 transition-transform" />
              <span>¿Dudas de Compatibilidad? Consultar con un Asesor Técnico</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
