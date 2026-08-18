import React, { useState } from "react";
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
} from "lucide-react";
import { FaMotorcycle } from "react-icons/fa";
import { FaCartPlus } from "react-icons/fa6";
import type {
  SuzukiPart,
  ActiveMotorcycle,
  ExplodedDiagram,
  SuzukiModel,
} from "../types";
import { formatCurrency } from "../utils/formatCurrency";
import { getProductWhatsAppUrl } from "../utils/whatsapp";
import { shouldShowProductImages } from "../utils/config";
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
  onAddToCart: (part: SuzukiPart) => void;
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

  return (
    <div
      id="product-detail-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
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
                    es exactamente la especificada de fábrica para tu{" "}
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
                              Principal Suzuki
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-[#0A3088] text-[10px] font-bold uppercase tracking-wider rounded-md shrink-0"
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
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  {part.category}
                </span>
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                  Código Interno: <strong className="text-slate-900">{part.sku || `SKU-${part.id}`}</strong>
                </span>
              </div>
              <h2
                id="product-detail-modal-title"
                className="text-xl font-black text-slate-900 mt-1"
              >
                {part.name}
              </h2>
              <div className="mt-2">
                {part.stock > 0 ? (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wide border ${
                      part.stock <= 5
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    Stock: {part.stock} {part.stock === 1 ? "unidad" : "unidades"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wide border bg-red-50 text-red-700 border-red-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    Agotado
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <div className="text-xl sm:text-2xl font-mono font-black text-[#E60012] whitespace-nowrap">
                  {formatCurrency(part.price)}
                </div>
                {part.taxable !== false ? (
                  part.priceIncludesTax ? (
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                      IVA 19% Incluido
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                      + 19% IVA al checkout
                    </span>
                  )
                ) : (
                  <span className="text-[10px] font-mono font-bold text-blue-800 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded">
                    Exento de IVA
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
              {part.description}
            </p>

            {/* Spec Sheet Table */}
            <div>
              <h4 className="text-xs font-extrabold uppercase text-slate-900 mb-2 flex items-center gap-1.5">
                <FileText
                  className="w-3.5 h-3.5 text-[#E60012]"
                  aria-hidden="true"
                />
                Especificaciones Técnicas
              </h4>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs">
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
              <h4 className="text-xs font-extrabold uppercase text-slate-900 mb-2 flex items-center gap-1.5">
                <FaMotorcycle
                  className="w-3.5 h-3.5 text-[#E60012]"
                  aria-hidden="true"
                />
                Vehículos Asociados & Compatibilidad
              </h4>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {part.compatibility.map((c, idx) => {
                  const modelObj = models.find((m) => m.id === c.modelId);
                  const isMatch = activeMotorcycle
                    ? activeMotorcycle.modelId === c.modelId
                    : false;
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl text-xs flex justify-between items-center border transition-colors ${
                        isMatch
                          ? "bg-emerald-50 border-emerald-300 text-emerald-950 ring-1 ring-emerald-400/20"
                          : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <div>
                        <div className="font-extrabold flex items-center gap-1.5">
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
                        <span className="font-mono text-[11px] font-bold text-slate-700 bg-white/80 border border-slate-200 px-2 py-1 rounded-md">
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
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <ShieldCheck
                  className="w-4 h-4 text-emerald-600"
                  aria-hidden="true"
                />
                Repuestos Relacionados Garantizados
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeMotorcycle ? (
                  <>
                    Mostrando únicamente repuestos 100% compatibles con tu{" "}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {relatedParts.slice(0, 3).map((relPart) => (
                <div
                  key={relPart.id}
                  className="bg-slate-50 hover:bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between transition-all hover:shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
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
                    <div className="flex gap-2 items-center mb-2">
                      {shouldShowProductImages() ? (
                        <img
                          src={relPart.image}
                          alt={relPart.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 object-cover rounded-lg bg-slate-200 shrink-0"
                        />
                      ) : (
                        <ProductImageEmptyState className="w-10 h-10 shrink-0" />
                      )}

                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">
                        {relPart.name}
                      </h4>
                    </div>
                    <div className="text-xs font-mono font-black text-slate-900 mb-3 whitespace-nowrap">
                      {formatCurrency(relPart.price)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={() =>
                        onSelectRelatedPart && onSelectRelatedPart(relPart)
                      }
                      className="flex-1 py-2 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[10px] uppercase rounded-lg transition-colors text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                    >
                      Ver Detalle
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddToCart(relPart)}
                      className="py-2 px-2.5 bg-[#E60012] hover:bg-red-700 text-white font-bold text-[10px] uppercase rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
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

        {/* Footer Action — reorganizado con stock en card lateral */}
        <div className="mt-8 border-t border-slate-200 pt-5 space-y-4">
          {/* Action buttons row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
            <a
              href={getProductWhatsAppUrl(part, activeMotorcycle)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 min-h-[44px] bg-[#25D366] hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
            >
              <IoChatbubbleEllipses className="w-5 h-5 shrink-0" />
              <span>Consultar WhatsApp</span>
            </a>

            {!activeMotorcycle ? (
              <button
                type="button"
                onClick={onOpenGarageModal}
                className="px-6 py-2.5 min-h-[44px] bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs uppercase rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
              >
                <FaMotorcycle className="w-5 h-5 shrink-0" />
                Seleccionar Moto
              </button>
            ) : !isCompatible ? (
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="px-6 py-2.5 min-h-[44px] bg-red-100 text-red-900 border border-red-300 font-black text-xs uppercase rounded-xl cursor-not-allowed shadow-none"
                >
                  Compra Bloqueada (Incompatible)
                </button>
                <span className="text-[10px] text-red-700 font-medium">
                  Selecciona tu moto compatible en el Garaje para habilitar la
                  compra.
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onAddToCart(part);
                  onClose();
                }}
                className="px-6 py-2.5 min-h-[44px] bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
              >
                <FaCartPlus className="w-4 h-4" aria-hidden="true" />
                <span>Añadir al Carrito</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
