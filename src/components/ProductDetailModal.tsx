import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, ShoppingBag, Wrench, Factory, FileText, Bike, Maximize2, Copy, Check, Info, ChevronDown, ChevronUp, Package, HelpCircle } from 'lucide-react';
import type { SuzukiPart, ActiveMotorcycle } from '../types';
import { getPrimaryOem } from '../types';
import { SUZUKI_MODELS } from '../data/suzukiData';
import { formatCurrency } from '../utils/formatCurrency';
import { getProductWhatsAppUrl } from '../utils/whatsapp';
import { ProductImageGallery } from './ProductImageGallery';

interface ProductDetailModalProps {
  part: SuzukiPart | null;
  activeMotorcycle: ActiveMotorcycle | null;
  allParts?: SuzukiPart[];
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
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [part, onClose]);

  if (!part) return null;

  // Compatibility evaluation
  let isCompatible = false;
  let compatibilityRule = null;

  if (activeMotorcycle) {
    compatibilityRule = part.compatibility.find(c => {
      if (c.modelId !== activeMotorcycle.modelId) return false;
      if (activeMotorcycle.year < c.yearStart || activeMotorcycle.year > c.yearEnd) return false;
      if (c.version && c.version !== activeMotorcycle.version) return false;
      return true;
    });
    isCompatible = !!compatibilityRule;
  }

  // Calculate strictly compatible related parts
  const isPartCompatibleWithMoto = (p: SuzukiPart, moto: ActiveMotorcycle): boolean => {
    return p.compatibility.some(c => {
      if (c.modelId !== moto.modelId) return false;
      if (moto.year < c.yearStart || moto.year > c.yearEnd) return false;
      if (c.version && c.version !== moto.version) return false;
      return true;
    });
  };

  let relatedParts: SuzukiPart[] = [];
  if (activeMotorcycle) {
    // STRICT RULE: ONLY parts compatible with activeMotorcycle
    relatedParts = allParts.filter(
      p => p.id !== part.id && isPartCompatibleWithMoto(p, activeMotorcycle)
    );
  } else {
    // If no active motorcycle, parts sharing compatibility models
    const currentModelIds = new Set(part.compatibility.map(c => c.modelId));
    relatedParts = allParts.filter(
      p => p.id !== part.id && p.compatibility.some(c => currentModelIds.has(c.modelId))
    );
  }

  return (
    <div 
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
              <Maximize2 className="w-3.5 h-3.5 text-[#E60012]" aria-hidden="true" />
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
        <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 border ${
          activeMotorcycle
            ? isCompatible
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          {activeMotorcycle ? (
            isCompatible ? (
              <>
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h4 className="font-extrabold text-sm uppercase text-emerald-900">
                    COMPATIBILIDAD 100% GARANTIZADA
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Esta pieza con código OEM <span className="font-mono font-bold">{part.oemNumbers[0]}</span> es exactamente la especificada de fábrica para tu <span className="font-bold">{activeMotorcycle.brand} {activeMotorcycle.modelName} ({activeMotorcycle.year})</span>.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-6 h-6 text-[#E60012] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h4 className="font-extrabold text-sm uppercase text-[#E60012]">
                    ALERTA DE INCOMPATIBILIDAD TÉCNICA
                  </h4>
                  <p className="text-xs text-red-900 mt-0.5 font-medium">
                    Este repuesto NO es compatible con tu vehículo activo (<span className="font-bold">{activeMotorcycle.modelName} {activeMotorcycle.year}</span>). Evita selecciones erróneas cambiando la moto en tu Garaje.
                  </p>
                </div>
              </>
            )
          ) : (
            <>
              <Wrench className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex items-center justify-between w-full">
                <div>
                  <h4 className="font-extrabold text-sm uppercase text-amber-900">
                    MOTOCICLETA NO SELECCIONADA
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Selecciona tu modelo y año antes de proceder con el pedido para verificar tolerancias exactas.
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
              onViewSchematics={(sId: string, pId: string) => {
                onClose();
                onViewSchematics(sId, pId);
              }}
            />

            {/* OEM References Section — colapsable, light style */}
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Factory className="w-4 h-4 text-slate-500" aria-hidden="true" />
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-600">
                    Referencia OEM
                  </span>
                </div>
                {part.oemNumbers.length > 1 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-500">
                    {showAllOems ? `${part.oemNumbers.length} de ${part.oemNumbers.length}` : `1 de ${part.oemNumbers.length}`}
                  </span>
                )}
              </div>

              <ul className="space-y-1.5">
                {(showAllOems ? part.oemNumbers : part.oemNumbers.slice(0, 1)).map((oem, idx) => {
                  const isPrimary = idx === 0;
                  const isCopied = copiedOem === oem;
                  return (
                    <li
                      key={oem}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-colors ${
                        isPrimary
                          ? 'bg-emerald-50 border-emerald-200/80'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isPrimary && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-700 text-[9px] font-extrabold uppercase tracking-wider rounded shrink-0">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            Principal
                          </span>
                        )}
                        <span
                          className={`font-mono font-bold tracking-wide truncate ${
                            isPrimary ? 'text-slate-900 text-sm' : 'text-slate-700 text-xs'
                          }`}
                          title={oem}
                        >
                          {oem}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyOem(oem)}
                        aria-label={`Copiar referencia ${oem}`}
                        title="Copiar referencia"
                        className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                          isCopied
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copiar
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
                        <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                        Ver {part.oemNumbers.length - 1} {part.oemNumbers.length - 1 === 1 ? 'referencia alternativa' : 'referencias alternativas'}
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
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">{part.category}</span>
              <h2 id="product-detail-modal-title" className="text-xl font-black text-slate-900 mt-0.5">{part.name}</h2>
              <div className="text-xl sm:text-2xl font-mono font-black text-slate-900 mt-2 whitespace-nowrap">{formatCurrency(part.price)}</div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
              {part.description}
            </p>

            {/* Spec Sheet Table */}
            <div>
              <h4 className="text-xs font-extrabold uppercase text-slate-900 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#E60012]" aria-hidden="true" />
                Especificaciones Técnicas
              </h4>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs">
                {part.specs.map((s, idx) => (
                  <div key={idx} className="flex justify-between border-b border-slate-200/60 pb-1 last:border-none">
                    <span className="text-slate-500 font-medium">{s.label}:</span>
                    <span className="font-mono font-bold text-slate-800">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Applicability Range Badges / Table */}
            <div>
              <h4 className="text-xs font-extrabold uppercase text-slate-900 mb-2 flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-[#E60012]" aria-hidden="true" />
                Vehículos Asociados & Compatibilidad
              </h4>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {part.compatibility.map((c, idx) => {
                  const modelObj = SUZUKI_MODELS.find(m => m.id === c.modelId);
                  const isMatch = activeMotorcycle ? activeMotorcycle.modelId === c.modelId : false;
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl text-xs flex justify-between items-center border transition-colors ${
                        isMatch
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 ring-1 ring-emerald-400/20'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
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
                          <div className="text-[10px] text-slate-500 font-medium">{c.version}</div>
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
                <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                Repuestos Relacionados Garantizados
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeMotorcycle ? (
                  <>
                    Mostrando únicamente repuestos 100% compatibles con tu{' '}
                    <span className="font-bold text-slate-800">
                      {activeMotorcycle.modelName} ({activeMotorcycle.year})
                    </span>
                  </>
                ) : (
                  'Selecciona una motocicleta en tu garaje para verificar compatibilidad exacta.'
                )}
              </p>
            </div>
          </div>

          {relatedParts.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500">
              No hay otros repuestos registrados para este modelo en este momento.
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
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Compatible
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 items-center mb-2">
                      <img
                        src={relPart.image}
                        alt={relPart.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 object-cover rounded-lg bg-slate-200 shrink-0"
                      />
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
                      onClick={() => onSelectRelatedPart && onSelectRelatedPart(relPart)}
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
                      <ShoppingBag className="w-3 h-3" aria-hidden="true" />
                      <span>+Carrito</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Action — reorganizado con stock en card lateral */}
        <div className="mt-8 border-t border-slate-200 pt-5 space-y-4">
          {/* Stock & Availability Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Stock indicator card */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200/80">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                <Package className="w-5 h-5 text-emerald-700" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                  Stock Disponible
                </div>
                <div className="text-base font-mono font-black text-emerald-900 leading-tight">
                  {part.stock} {part.stock === 1 ? 'unidad' : 'unidades'} <span className="text-[11px] font-bold text-emerald-700/80">en bodega</span>
                </div>
              </div>
            </div>

            {/* Empty placeholder for grid alignment */}
            <div className="hidden sm:block" />
          </div>

          {/* Action buttons row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
            <a
              href={getProductWhatsAppUrl(part, activeMotorcycle)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 min-h-[44px] bg-[#25D366] hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414zM12.01 2.003c-5.504 0-9.976 4.471-9.976 9.974 0 1.759.458 3.475 1.33 4.988l-1.416 5.17 5.29-1.388c1.458.796 3.104 1.215 4.772 1.215 5.505 0 9.977-4.472 9.977-9.974 0-2.665-1.037-5.17-2.92-7.054a9.907 9.907 0 0 0-7.057-2.932z"/>
              </svg>
              <span>Consultar WhatsApp</span>
            </a>

            {!activeMotorcycle ? (
              <button
                type="button"
                onClick={onOpenGarageModal}
                className="px-6 py-2.5 min-h-[44px] bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs uppercase rounded-xl shadow-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
              >
                Seleccionar Moto para Comprar
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
                  Selecciona tu moto compatible en el Garaje para habilitar la compra.
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
                <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                <span>Añadir al Carrito Garantizado</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
