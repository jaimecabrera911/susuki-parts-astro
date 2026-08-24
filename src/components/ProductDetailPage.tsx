import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Wrench,
  Factory,
  FileText,
  CheckCircle2,
  Share2,
  Check,
  Copy,
  Info,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Plus,
  Minus,
  Palette,
  ArrowRightLeft,
  Ruler,
  Tag,
  Sparkles,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { FaMotorcycle } from "react-icons/fa";
import { FaCartPlus } from "react-icons/fa6";
import type {
  SuzukiPart,
  ActiveMotorcycle,
  ExplodedDiagram,
  SuzukiModel,
  PartVariant,
} from "../types";
import { getPrimaryOem, getVariantTypeLabel, formatVariantAttributes } from "../types";
import { formatCurrency } from "../utils/formatCurrency";
import { getProductWhatsAppUrl } from "../utils/whatsapp";
import { shouldShowProductImages } from "../utils/config";
import { ProductImageEmptyState } from "./ProductImageEmptyState";

import { ProductImageGallery } from "./ProductImageGallery";
import { TbAlertHexagonFilled } from "react-icons/tb";
import { IoChatbubbleEllipses } from "react-icons/io5";

interface ProductDetailPageProps {
  part: SuzukiPart;
  activeMotorcycle: ActiveMotorcycle | null;
  allParts: SuzukiPart[];
  schematics?: ExplodedDiagram[];
  models?: SuzukiModel[];
  onBack: () => void;
  onAddToCart: (part: SuzukiPart, quantity?: number, selectedVariant?: PartVariant | null) => void;
  onOpenGarageModal: () => void;
  onViewSchematics: (schematicId: string, partId: string) => void;
  onSelectRelatedPart: (part: SuzukiPart) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  part,
  activeMotorcycle,
  allParts,
  schematics,
  models = [],
  onBack,
  onAddToCart,
  onOpenGarageModal,
  onViewSchematics,
  onSelectRelatedPart,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedOem, setCopiedOem] = useState<string | null>(null);
  const [showAllOems, setShowAllOems] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedVariant, setSelectedVariant] = useState<PartVariant | null>(null);

  useEffect(() => {
    setQuantity(1);
    if (part?.variants && part.variants.length > 0) {
      const activeVars = part.variants.filter((v) => v.active !== false);
      const firstInStock = activeVars.find((v) => v.stock > 0) || activeVars[0] || null;
      setSelectedVariant(firstInStock);
    } else {
      setSelectedVariant(null);
    }
  }, [part.id]);

  const handleCopyOem = (oem: string) => {
    navigator.clipboard.writeText(oem).then(() => {
      setCopiedOem(oem);
      setTimeout(() => setCopiedOem(null), 2000);
    });
  };

  // Scroll to top when page loads/changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [part.id]);

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
      if (c.yearStart && moto.year < c.yearStart) return false;
      if (c.yearEnd && moto.year > c.yearEnd) return false;
      if (c.version && c.version !== moto.version) return false;
      return true;
    });
  };

  let relatedParts: SuzukiPart[] = [];
  if (activeMotorcycle) {
    relatedParts = allParts.filter(
      (p) => p.id !== part.id && isPartCompatibleWithMoto(p, activeMotorcycle),
    );
  } else {
    const currentModelIds = new Set(part.compatibility.map((c) => c.modelId));
    relatedParts = allParts.filter(
      (p) =>
        p.id !== part.id &&
        p.compatibility.some((c) => currentModelIds.has(c.modelId)),
    );
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#producto=${getPrimaryOem(part)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Effective values considering selected variant
  const effectivePrice = selectedVariant?.price != null ? selectedVariant.price : part.price;
  const effectiveStock = selectedVariant ? selectedVariant.stock : part.stock;
  const effectiveSku = selectedVariant?.sku || part.sku || `SKU-${part.id}`;

  return (
    <div id="product-detail-page" className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Breadcrumbs & Back Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors flex items-center gap-2 font-bold text-xs uppercase cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#E60012]" />
            <span>Volver al Catálogo</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Catálogo</span>
            <span>/</span>
            <span className="capitalize">{part.category}</span>
            <span>/</span>
            <span className="font-bold text-slate-900 truncate max-w-xs">
              {part.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
            title="Copiar enlace permanente del producto"
            aria-live="polite"
          >
            {copied ? (
              <>
                <Check
                  className="w-4 h-4 text-emerald-600"
                  aria-hidden="true"
                />
                <span className="text-emerald-700 font-bold">
                  ¡Enlace Copiado!
                </span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span>Compartir Producto</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Page Layout */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
        {/* Top Compatibility Banner */}
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border ${
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
                    COMPATIBILIDAD 100% GARANTIZADA DE FÁBRICA
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Esta pieza con código OEM{" "}
                    <span className="font-mono font-bold">
                      {part.oemNumbers[0]}
                    </span>{" "}
                    es exactamente la especificada para tu{" "}
                    <span className="font-bold">
                      {activeMotorcycle.brand} {activeMotorcycle.modelName} (
                      {activeMotorcycle.year})
                    </span>
                    .
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle
                  className="w-6 h-6 text-[#E60012] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <h4 className="font-extrabold text-sm uppercase text-[#E60012]">
                    ALERTA DE INCOMPATIBILIDAD TÉCNICA
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
                    Selecciona tu modelo y año antes de proceder para verificar
                    encaje exacto.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenGarageModal}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase rounded-lg shadow-xs shrink-0 ml-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                >
                  Seleccionar Moto
                </button>
              </div>
            </>
          )}
        </div>

        {/* 2-Column Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Interactive Product Gallery & OEM Info */}
          <div className="space-y-4">
            <ProductImageGallery
              part={part}
              schematics={schematics}
              selectedImageOverride={selectedVariant?.image || null}
              onViewSchematics={onViewSchematics}
            />

            {/* OEM References Section — colapsable, light style */}
            <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Factory
                    className="w-5 h-5 text-slate-500"
                    aria-hidden="true"
                  />
                  <span className="text-[11px] uppercase font-extrabold tracking-wider text-slate-600">
                    Referencias OEM & Cross-Reference
                  </span>
                </div>
                {part.oemNumbers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowAllOems(!showAllOems)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-md text-[11px] font-bold text-slate-600 transition-colors"
                  >
                    {showAllOems
                      ? "Ver solo principal"
                      : `Ver las ${part.oemNumbers.length} refs (Cross-Ref)`}
                  </button>
                )}
              </div>

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
                      className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                        isPrimary
                          ? "bg-emerald-50/80 border-emerald-200"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-slate-900 text-base tracking-wider select-all">
                            {oem}
                          </span>
                          {isPrimary ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider rounded-md shrink-0">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Principal Suzuki
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-[#0A3088] text-[10px] font-bold uppercase tracking-wider rounded-md shrink-0"
                              title="Referencia equivalente o número de parte descontinuado que fue reemplazado por la referencia principal"
                            >
                              Cross-Ref (Reemplazada)
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyOem(oem)}
                        aria-label={`Copiar referencia ${oem}`}
                        title="Copiar referencia al portapapeles"
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          isCopied
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {part.oemNumbers.length > 1 && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowAllOems(!showAllOems)}
                    aria-expanded={showAllOems}
                    aria-controls="oem-references-list"
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {showAllOems ? (
                      <>
                        <ChevronUp className="w-4 h-4" aria-hidden="true" />
                        Ocultar referencias alternativas
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" aria-hidden="true" />
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

          {/* Right Column: Title, Price, Description, Specs & Vehicles */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#E60012] bg-red-50 px-2.5 py-1 rounded-md border border-red-100 inline-block">
                    {part.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                    Código Interno: <strong className="text-slate-900">{effectiveSku}</strong>
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 leading-tight">
                  {part.name}
                </h1>
                <div className="mt-2.5">
                  {effectiveStock > 0 ? (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-black uppercase tracking-wide border ${
                        effectiveStock <= 5
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      Stock: {effectiveStock} {effectiveStock === 1 ? "unidad" : "unidades"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-black uppercase tracking-wide border bg-red-50 text-red-700 border-red-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      Agotado
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="text-2xl sm:text-3xl font-mono font-black text-[#E60012]">
                    {formatCurrency(effectivePrice)}
                  </div>
                  {part.taxable !== false ? (
                    part.priceIncludesTax ? (
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg">
                        IVA 19% Incluido
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg">
                        + 19% IVA al checkout
                      </span>
                    )
                  ) : (
                    <span className="text-xs font-mono font-bold text-blue-800 bg-blue-100 border border-blue-300 px-2.5 py-1 rounded-lg">
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
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-mono">
                          <Sparkles className="w-4 h-4 text-[#0A3088]" />
                          <span>Opciones del Repuesto:</span>
                        </span>
                        {selectedVariant && (
                          <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg shadow-2xs font-mono">
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
                              <span className="text-xs font-bold text-slate-700 flex items-center gap-1 font-mono">
                                <AxisIcon className="w-3.5 h-3.5 text-slate-500" />
                                <span>{axisName}:</span>
                              </span>
                              {currentVal && (
                                <span className="text-xs font-bold text-[#0A3088] font-mono">
                                  {currentVal}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
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
                                    className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
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
                                        className="w-4 h-4 rounded-full border border-black/15 shadow-2xs shrink-0"
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
                                      <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
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
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-mono">
                        <HeaderIcon className="w-3.5 h-3.5 text-[#0A3088]" />
                        <span>{typeLabel} Disponible:</span>
                      </span>
                      {selectedVariant && (
                        <span className="text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg shadow-2xs font-mono">
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
                            className={`group relative flex items-center gap-2.5 p-2 pr-3.5 rounded-xl border transition-all cursor-pointer ${
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

              <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                {part.description}
              </p>

              {/* Technical Specifications */}
              <div>
                <h3 className="text-xs font-extrabold uppercase text-slate-900 mb-2 flex items-center gap-1.5">
                  <FileText
                    className="w-4 h-4 text-[#E60012]"
                    aria-hidden="true"
                  />
                  Especificaciones Técnicas
                </h3>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                  {part.specs.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between border-b border-slate-200/60 pb-1.5 last:border-none"
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

              {/* Associated Vehicles & Compatibilities */}
              <div>
                <h3 className="text-xs font-extrabold uppercase text-slate-900 mb-2 flex items-center gap-1.5">
                  <FaMotorcycle
                    className="w-4 h-4 text-[#E60012]"
                    aria-hidden="true"
                  />
                  Vehículos Asociados & Compatibilidad Exacta
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {part.compatibility.map((c, idx) => {
                    const modelObj = models.find((m) => m.id === c.modelId);
                    const isMatch = activeMotorcycle
                      ? activeMotorcycle.modelId === c.modelId
                      : false;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl text-xs flex justify-between items-center border transition-colors ${
                          isMatch
                            ? "bg-emerald-50 border-emerald-300 text-emerald-950 ring-1 ring-emerald-400/20"
                            : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      >
                        <div>
                          <div className="font-extrabold flex items-center gap-1.5 text-sm">
                            {modelObj ? modelObj.name : c.modelId.toUpperCase()}
                            {isMatch && (
                              <span className="text-[9px] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded uppercase">
                                Tu Moto
                              </span>
                            )}
                          </div>
                          {c.version && (
                            <div className="text-[11px] text-slate-500 font-medium">
                              {c.version}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
                            Años: {c.yearStart} - {c.yearEnd}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              {activeMotorcycle && isCompatible && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cantidad</span>
                    <span className="text-xs font-black text-slate-900 font-mono">
                      Subtotal: {formatCurrency(part.price * quantity)}
                    </span>
                  </div>
                  <div className="flex items-center border border-slate-300 rounded-xl bg-white p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      aria-label="Disminuir cantidad"
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={part.stock > 0 ? part.stock : 99}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1) setQuantity(val);
                      }}
                      className="w-12 text-center font-mono font-black text-sm bg-transparent border-none focus:outline-none text-slate-900"
                      aria-label="Cantidad de repuestos"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      aria-label="Aumentar cantidad"
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={getProductWhatsAppUrl(part, activeMotorcycle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 min-h-[44px] bg-[#25D366] hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                >
                  <IoChatbubbleEllipses className="w-5 h-5 shrink-0" />
                  <span>Consultar WhatsApp</span>
                </a>

                {part.active === false ? (
                  <div className="flex flex-col items-center sm:items-end gap-1">
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="w-full py-3 px-4 min-h-[44px] bg-slate-200 text-slate-500 border border-slate-300 font-black text-xs uppercase rounded-xl cursor-not-allowed shadow-none"
                    >
                      Repuesto No Disponible
                    </button>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Este producto está temporalmente deshabilitado.
                    </span>
                  </div>
                ) : !activeMotorcycle ? (
                  <button
                    type="button"
                    onClick={onOpenGarageModal}
                    className="w-full py-3 px-4 min-h-[44px] bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs uppercase rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                  >
                    <TbAlertHexagonFilled />
                    Seleccionar Moto
                  </button>
                ) : !isCompatible ? (
                  <div className="flex flex-col items-center sm:items-end gap-1">
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="w-full py-3 px-4 min-h-[44px] bg-red-100 text-red-900 border border-red-300 font-black text-xs uppercase rounded-xl cursor-not-allowed shadow-none"
                    >
                      Compra Bloqueada (Incompatible)
                    </button>
                    <span className="text-[10px] text-red-700 font-medium">
                      Selecciona tu moto en el Garaje.
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={effectiveStock <= 0}
                    onClick={() => onAddToCart(part, quantity, selectedVariant)}
                    className="w-full py-3 px-4 min-h-[44px] bg-[#E60012] hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                  >
                    <FaCartPlus className="w-4 h-4" aria-hidden="true" />
                    <span>Añadir al Carrito {quantity > 1 ? `(${quantity})` : ''}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        <div className="pt-8 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <ShieldCheck
                  className="w-5 h-5 text-emerald-600"
                  aria-hidden="true"
                />
                Repuestos Relacionados Garantizados
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeMotorcycle ? (
                  <>
                    Mostrando únicamente repuestos compatibles con tu{" "}
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
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500">
              No hay otros repuestos registrados para este modelo en este
              momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedParts.slice(0, 4).map((relPart) => (
                <div
                  key={relPart.id}
                  className="bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                        {relPart.oemNumbers[0]}
                      </span>
                      {activeMotorcycle && (
                        <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-0.5">
                          <CheckCircle2
                            className="w-3.5 h-3.5"
                            aria-hidden="true"
                          />{" "}
                          Compatible
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 items-center mb-3">
                      {shouldShowProductImages() ? (
                        <img
                          src={relPart.image}
                          alt={relPart.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 object-cover rounded-xl bg-slate-200 shrink-0 border border-slate-200"
                        />
                      ) : (
                        <ProductImageEmptyState className="w-14 h-14 shrink-0" />
                      )}

                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                        {relPart.name}
                      </h4>
                    </div>
                    <div className="text-sm font-mono font-black text-slate-900 mb-4 text-[#E60012]">
                      {formatCurrency(relPart.price)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => onSelectRelatedPart(relPart)}
                      className="flex-1 py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs uppercase rounded-xl transition-colors text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                    >
                      Ver Detalle
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddToCart(relPart)}
                      className="py-2 px-3 bg-[#E60012] hover:bg-red-700 text-white font-bold text-xs uppercase rounded-xl transition-colors flex items-center gap-1 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                      title="Añadir al carrito"
                      aria-label={`Añadir ${relPart.name} al carrito`}
                    >
                      <FaCartPlus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>+Carrito</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
