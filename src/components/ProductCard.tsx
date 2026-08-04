import React, { useState } from 'react';
import { AlertTriangle, HelpCircle, Eye, ShoppingBag, ShieldCheck, Globe, Clock, CheckCircle2, Copy, Check, GitBranch } from 'lucide-react';
import { AiTwotoneSafetyCertificate } from 'react-icons/ai';
import type { SuzukiPart, ActiveMotorcycle, AvailabilityStatus } from '../types';
import { getAvailabilityStatus, AVAILABILITY_META, getPrimaryOem } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { getProductWhatsAppUrl } from '../utils/whatsapp';
import { EXPLODED_DIAGRAMS } from '../data/suzukiData';
import { DIAGRAM_SVGS } from '../data/svgAssets';

interface ProductCardProps {
  part: SuzukiPart;
  activeMotorcycle: ActiveMotorcycle | null;
  onOpenDetail: (part: SuzukiPart) => void;
  onAddToCart: (part: SuzukiPart) => void;
  onOpenGarageModal: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  part,
  activeMotorcycle,
  onOpenDetail,
  onAddToCart,
  onOpenGarageModal
}) => {

  // Evaluate compatibility status against active motorcycle
  let isCompatible = false;

  if (activeMotorcycle) {
    const matchRule = part.compatibility.find(c => {
      if (c.modelId !== activeMotorcycle.modelId) return false;
      if (activeMotorcycle.year < c.yearStart || activeMotorcycle.year > c.yearEnd) return false;
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

  const showProductImages = import.meta.env.PUBLIC_SHOW_PRODUCT_IMAGES === 'true';

  const availabilityStatus: AvailabilityStatus = getAvailabilityStatus(part);

  // Resolve schematic info (diagram image, hotspot position and item number) for this part
  const schematicInfo = (() => {
    if (!part.schematicId || part.diagramHotspot == null) return null;
    const diagram = EXPLODED_DIAGRAMS.find(d => d.id === part.schematicId);
    if (!diagram) return null;
    const diagramImage = DIAGRAM_SVGS[part.schematicId];
    if (!diagramImage) return null;
    return {
      title: diagram.title,
      itemNumber: part.diagramHotspot.itemNumber,
      x: part.diagramHotspot.x,
      y: part.diagramHotspot.y,
      image: diagramImage,
    };
  })();

  const availabilityBadge = (() => {
    if (availabilityStatus === 'in_stock') {
      return (
        <div className="bg-emerald-600/95 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-md shadow-sm border border-emerald-400/40 flex items-center gap-1 uppercase tracking-wider">
          <CheckCircle2 className="w-3 h-3 text-emerald-200 shrink-0" />
          <span>Disponible</span>
        </div>
      );
    }
    if (availabilityStatus === 'international') {
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
      <div className="bg-red-600/95 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-lg shadow-md border border-red-400/40 flex items-center gap-1.5 uppercase tracking-wider">
        <AlertTriangle className="w-4 h-4 text-red-200 shrink-0" />
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

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between group hover:-translate-y-0.5 ${
      activeMotorcycle 
        ? isCompatible 
          ? 'border-emerald-300 shadow-xs hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-950/5' 
          : 'border-red-200 bg-red-50/10 shadow-xs opacity-95 hover:border-red-300'
        : 'border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-lg hover:shadow-slate-950/5'
    }`}>

      <div>
        {showProductImages ? (
          <div
            role="button"
            tabIndex={0}
            aria-label={`Ver detalles de ${part.name}`}
            onClick={() => onOpenDetail(part)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenDetail(part);
              }
            }}
            className="relative aspect-4/3 bg-slate-100/80 overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
          >
            {schematicInfo ? (
              <>
                {/* Diagram (despiece) image — shows the part's position in the assembly */}
                <img
                  src={schematicInfo.image}
                  alt={`Despiece: ${schematicInfo.title}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain bg-white p-2 group-hover:scale-105 transition-transform duration-500 ease-out"
                />

                {/* Hotspot marker — numbered pin at the exact part position */}
                <div
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: `${schematicInfo.x}%`, top: `${schematicInfo.y}%` }}
                  aria-hidden="true"
                >
                  {/* Pulse ring */}
                  <span className="absolute inset-0 rounded-full bg-[#E60012]/40 animate-ping" style={{ animationDuration: '1.8s' }} />
                  {/* Numbered pin */}
                  <span className="relative inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-full bg-[#E60012] text-white font-mono font-extrabold text-sm shadow-[0_4px_12px_rgba(230,0,18,0.55)] border-2 border-white">
                    {schematicInfo.itemNumber}
                  </span>
                </div>

                {/* "Despiece" label badge — top right corner */}
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 bg-slate-900/85 backdrop-blur-md text-white px-2 py-1 rounded-md border border-white/10 shadow-md">
                  <GitBranch className="w-3 h-3 text-[#E60012] shrink-0" aria-hidden="true" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Despiece</span>
                </div>
              </>
            ) : (
              <img
                src={part.image}
                alt={part.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            )}

            <div className="absolute top-2.5 left-2.5 z-10">{compatibilityBadge}</div>

            {/* Schematic title footer (only when diagram is shown) */}
            {schematicInfo && (
              <div
                className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-slate-900/95 via-slate-900/80 to-transparent text-white px-2.5 py-2 pt-6"
                title={schematicInfo.title}
              >
                <p className="font-mono text-[10px] font-extrabold uppercase tracking-wider leading-tight truncate">
                  {schematicInfo.title}
                </p>
              </div>
            )}
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
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenDetail(part);
              }
            }}
            className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 hover:text-[#E60012] cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] rounded"
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

          <div className="mt-2.5 w-fit">
            {availabilityBadge}
          </div>

        </div>
      </div>

      {/* Footer Price & Anti-Error Add to Cart */}
      <div className="p-4 sm:p-5 pt-3 border-t border-slate-100 mt-2 space-y-3">
        {/* Row 1: Price and Stock status */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Precio</span>
            <span className="text-base sm:text-lg font-mono font-black text-slate-900 tracking-tight block">
              {formatCurrency(part.price)}
            </span>
          </div>
          {availabilityStatus === 'in_stock' && (
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg shrink-0">
              En Stock ({part.stock})
            </span>
          )}
          {availabilityStatus === 'international' && (
            <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              7-15 días
            </span>
          )}
          {availabilityStatus === 'on_order' && (
            <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              15-30 días
            </span>
          )}
        </div>

        {/* Row 2: Action Buttons */}
        <div className="flex items-center gap-2">
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
            <svg className="w-4 h-4 fill-current text-[#25D366]" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414zM12.01 2.003c-5.504 0-9.976 4.471-9.976 9.974 0 1.759.458 3.475 1.33 4.988l-1.416 5.17 5.29-1.388c1.458.796 3.104 1.215 4.772 1.215 5.505 0 9.977-4.472 9.977-9.974 0-2.665-1.037-5.17-2.92-7.054a9.907 9.907 0 0 0-7.057-2.932z"/>
            </svg>
          </a>

          {/* Strict Anti-Error Guard */}
          {!activeMotorcycle ? (
            <button
              type="button"
              onClick={onOpenGarageModal}
              className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
              title="Debes confirmar tu moto antes de añadir"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Validar Moto</span>
            </button>
          ) : !isCompatible ? (
            <button
              type="button"
              onClick={() => onOpenDetail(part)}
              className="flex-1 py-2.5 px-3 bg-red-100 hover:bg-red-200 text-red-900 font-bold text-xs uppercase rounded-xl cursor-pointer flex items-center justify-center gap-1.5 border border-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
              title="Producto no compatible con la motocicleta activa. Haz clic para ver detalles."
            >
              <AlertTriangle className="w-4 h-4 text-[#E60012] shrink-0" />
              <span>Ver Incompatibilidad</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onAddToCart(part)}
              className="flex-1 py-2.5 px-3 bg-[#E60012] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>Añadir</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
