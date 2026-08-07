import React, { useState, useMemo, useEffect, useRef } from 'react';
import { EXPLODED_DIAGRAMS, SUZUKI_PARTS, MOTORCYCLE_SECTION_ORDER, SUZUKI_MODELS } from '../data/suzukiData';
import type { ExplodedDiagram, SuzukiPart, ActiveMotorcycle, AvailabilityStatus } from '../types';
import { getPrimaryOem, getAvailabilityStatus, AVAILABILITY_META } from '../types';
import {
  Layers, ArrowLeft, Filter, Search, CheckCircle2, AlertTriangle,
  ShoppingBag, Eye, Info, ChevronRight, X, Bike, ArrowRightLeft
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { getMotorcyclePng } from '../data/motorcycleImages';

interface ExplodedViewProps {
  activeMotorcycle: ActiveMotorcycle | null;
  onAddToCart: (part: SuzukiPart) => void;
  onOpenPartDetail: (part: SuzukiPart) => void;
  onOpenGarageModal: () => void;
  initialSchematicId?: string;
  initialPartId?: string;
}

type ViewMode = 'catalog' | 'detail';

export const ExplodedView: React.FC<ExplodedViewProps> = ({
  activeMotorcycle,
  onAddToCart,
  onOpenPartDetail,
  onOpenGarageModal,
  initialSchematicId,
  initialPartId
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(initialSchematicId ? 'detail' : 'catalog');
  const [selectedDiagramId, setSelectedDiagramId] = useState<string>(
    initialSchematicId || EXPLODED_DIAGRAMS[0].id
  );
  const [selectedPartId, setSelectedPartId] = useState<string | null>(initialPartId ?? null);
  const [activeSection, setActiveSection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Ref to the selected row — used to scroll into view when arriving from a product page
  const selectedRowRef = useRef<HTMLTableRowElement | null>(null);

  // When opening directly with a pre-selected part, scroll its row into view smoothly
  useEffect(() => {
    if (initialPartId && viewMode === 'detail' && selectedRowRef.current) {
      // Defer to next tick so the row is rendered before scrolling
      const t = window.setTimeout(() => {
        selectedRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
      return () => window.clearTimeout(t);
    }
  }, [initialPartId, viewMode]);

  // Build sections that actually have at least one diagram (for the sidebar)
  const availableSections = useMemo(() => {
    const set = new Set<string>();
    EXPLODED_DIAGRAMS.forEach(d => set.add(d.section));
    return MOTORCYCLE_SECTION_ORDER.filter(s => set.has(s));
  }, []);

  // Apply motorcycle filter first, then section filter, then search
  const filteredDiagrams = useMemo(() => {
    return EXPLODED_DIAGRAMS.filter(d => {
      // Motorcycle model filter — only diagrams applicable to the active model
      if (activeMotorcycle && d.applicableModelIds.length > 0 && !d.applicableModelIds.includes(activeMotorcycle.modelId)) {
        return false;
      }
      // Section filter
      if (activeSection !== 'all' && d.section !== activeSection) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = d.title.toLowerCase().includes(q)
          || d.modelTarget.toLowerCase().includes(q)
          || d.category.toLowerCase().includes(q)
          || d.section.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [activeMotorcycle, activeSection, searchQuery]);

  // Group filtered diagrams by section in canonical order
  const groupedBySection = useMemo(() => {
    const groups: { section: string; diagrams: ExplodedDiagram[] }[] = [];
    const seen = new Set<string>();
    const orderedSections = activeSection === 'all' ? availableSections : [activeSection];
    orderedSections.forEach(sec => {
      const diagrams = filteredDiagrams.filter(d => d.section === sec);
      if (diagrams.length > 0) {
        groups.push({ section: sec, diagrams });
        seen.add(sec);
      }
    });
    return groups;
  }, [filteredDiagrams, activeSection, availableSections]);

  const currentDiagram = EXPLODED_DIAGRAMS.find(d => d.id === selectedDiagramId) || EXPLODED_DIAGRAMS[0];

  // Get parts for the current diagram (in order of item number)
  const diagramParts = useMemo(() => {
    return currentDiagram.hotspots
      .map(spot => {
        const part = SUZUKI_PARTS.find(p => p.id === spot.partId);
        return part ? { spot, part } : null;
      })
      .filter((x): x is { spot: typeof currentDiagram.hotspots[0]; part: SuzukiPart } => x !== null)
      .sort((a, b) => a.spot.itemNumber - b.spot.itemNumber);
  }, [currentDiagram]);

  const selectedPart = diagramParts.find(dp => dp.part.id === selectedPartId)?.part;

  // Compatibility helper
  const isPartCompatible = (part: SuzukiPart): boolean | null => {
    if (!activeMotorcycle) return null;
    return part.compatibility.some(c => {
      if (c.modelId !== activeMotorcycle.modelId) return false;
      if (activeMotorcycle.year < c.yearStart || activeMotorcycle.year > c.yearEnd) return false;
      if (c.version && c.version !== activeMotorcycle.version) return false;
      return true;
    });
  };

  // ============ CATALOG MODE ============
  if (viewMode === 'catalog') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#E60012]" aria-hidden="true" />
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Catálogo de Diagramas de Despiece
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Blueprints técnicos exploded-view del fabricante. Cada diagrama identifica la posición exacta de cada repuesto OEM dentro del ensamblaje.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
                {filteredDiagrams.length} / {EXPLODED_DIAGRAMS.length} Diagramas
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Sidebar: Section Filter (secciones de la moto) */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:sticky lg:top-24 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Filter className="w-4 h-4 text-[#E60012]" aria-hidden="true" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Filtros</h3>
              </div>

              {/* Active Garage Card — inside the filter card, below the title */}
              <ActiveGarageCard
                activeMotorcycle={activeMotorcycle}
                onOpenGarageModal={onOpenGarageModal}
              />

              {/* Search */}
              <div>
                <label htmlFor="diagram-search" className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Buscar diagrama
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  <input
                    id="diagram-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Motor, freno, transmisión..."
                    className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012] transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Limpiar búsqueda"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              {/* Section list (secciones de la moto) */}
              <div>
                <span className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Sección de la moto
                </span>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveSection('all')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
                      activeSection === 'all'
                        ? 'bg-[#E60012] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate text-left">Todas las secciones</span>
                    <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                      activeSection === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {EXPLODED_DIAGRAMS.filter(d =>
                        !activeMotorcycle || d.applicableModelIds.length === 0 || d.applicableModelIds.includes(activeMotorcycle.modelId)
                      ).length}
                    </span>
                  </button>
                  {availableSections.map(sec => {
                    const isSelected = activeSection === sec;
                    const count = EXPLODED_DIAGRAMS.filter(d =>
                      d.section === sec &&
                      (!activeMotorcycle || d.applicableModelIds.length === 0 || d.applicableModelIds.includes(activeMotorcycle.modelId))
                    ).length;
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setActiveSection(sec)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
                          isSelected
                            ? 'bg-[#E60012] text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <span className="truncate text-left">{sec}</span>
                        <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Diagrams Grid — grouped by section like the reference catalog */}
          <div className="flex-1 w-full min-w-0">
            {groupedBySection.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <Info className="w-10 h-10 text-slate-400 mx-auto mb-3" aria-hidden="true" />
                <h3 className="text-base font-bold text-slate-800">Sin diagramas</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {activeMotorcycle
                    ? `No hay diagramas de despiece registrados para tu ${activeMotorcycle.modelName} (${activeMotorcycle.year}) en esta sección.`
                    : 'No hay diagramas que coincidan con el filtro actual.'}
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {groupedBySection.map(group => (
                  <section key={group.section} aria-labelledby={`section-${group.section}`}>
                    {/* Section Header */}
                    <div className="flex items-center justify-between gap-3 pb-3 mb-5 border-b-2 border-slate-900">
                      <h3
                        id={`section-${group.section}`}
                        className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
                      >
                        {group.section}
                      </h3>
                      <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md shrink-0">
                        {group.diagrams.length} {group.diagrams.length === 1 ? 'diagrama' : 'diagramas'}
                      </span>
                    </div>

                    {/* Diagrams in this section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {group.diagrams.map(diagram => (
                        <DiagramCard
                          key={diagram.id}
                          diagram={diagram}
                          onClick={() => {
                            setSelectedDiagramId(diagram.id);
                            setSelectedPartId(null);
                            setViewMode('detail');
                          }}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============ DETAIL MODE ============
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb / Back Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => {
              setViewMode('catalog');
              setSelectedPartId(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
          >
            <ArrowLeft className="w-4 h-4 text-[#E60012]" aria-hidden="true" />
            <span>Despieces</span>
          </button>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <span className="font-mono text-xs font-bold text-slate-700 truncate">{currentDiagram.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-md">
            <Layers className="w-3 h-3" aria-hidden="true" />
            {currentDiagram.category}
          </span>
        </div>
      </div>

      {/* Detail Content: Diagram (left) + Parts Table (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Diagram */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} aria-hidden="true" />

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 mb-3 text-white">
              <div className="min-w-0">
                <span className="text-[9px] font-mono uppercase text-slate-400 block">Modelo objetivo</span>
                <span className="text-xs font-extrabold truncate block">{currentDiagram.modelTarget}</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400 shrink-0">{currentDiagram.hotspots.length} puntos</span>
            </div>

            <div className="relative bg-white rounded-lg overflow-hidden p-2">
              <img
                src={currentDiagram.diagramImage}
                alt={currentDiagram.title}
                referrerPolicy="no-referrer"
                className="w-full h-auto object-contain"
              />

              {/* Hotspot pins */}
              {currentDiagram.hotspots.map(spot => {
                const isSelected = selectedPartId === spot.partId;
                return (
                  <button
                    key={spot.itemNumber}
                    type="button"
                    onClick={() => setSelectedPartId(spot.partId)}
                    aria-label={`Punto #${spot.itemNumber} - ${spot.label}`}
                    style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full font-mono font-extrabold text-xs flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                      isSelected
                        ? 'bg-[#E60012] text-white ring-4 ring-red-400/50 z-20'
                        : 'bg-white text-slate-900 ring-2 ring-slate-900 hover:bg-[#E60012] hover:text-white z-10'
                    }`}
                  >
                    {spot.itemNumber}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed mt-3 px-1">
              {currentDiagram.description}
            </p>
          </div>
        </div>

        {/* Right: Parts Table (no images) */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          {/* Table Header */}
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Bike className="w-4 h-4 text-[#E60012]" aria-hidden="true" />
                  Piezas del despiece
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {diagramParts.length} {diagramParts.length === 1 ? 'repuesto registrado' : 'repuestos registrados'}
                  {activeMotorcycle && ' — compatibilidadevaluada con tu moto'}
                </p>
              </div>
            </div>
          </div>

          {/* Selected part detail strip (if any) */}
          {selectedPart && (
            <SelectedPartStrip
              part={selectedPart}
              itemNumber={diagramParts.find(dp => dp.part.id === selectedPart.id)?.spot.itemNumber ?? 0}
              compatible={isPartCompatible(selectedPart)}
              activeMotorcycle={activeMotorcycle}
              onAddToCart={onAddToCart}
              onClose={() => setSelectedPartId(null)}
            />
          )}

          {/* Parts Table */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-3 py-2.5 font-extrabold w-12 text-center">#</th>
                  <th className="px-3 py-2.5 font-extrabold">Repuesto / OEM</th>
                  <th className="px-3 py-2.5 font-extrabold text-right">Precio</th>
                  <th className="px-3 py-2.5 font-extrabold text-center">Estado</th>
                  <th className="px-3 py-2.5 font-extrabold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {diagramParts.map(({ spot, part }) => {
                  const isSelected = selectedPartId === part.id;
                  const compat = isPartCompatible(part);
                  const availability: AvailabilityStatus = getAvailabilityStatus(part);
                  const meta = AVAILABILITY_META[availability];
                  return (
                    <tr
                      key={part.id}
                      ref={isSelected ? selectedRowRef : undefined}
                      onClick={() => setSelectedPartId(part.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-red-50/60 border-l-4 border-l-[#E60012]'
                          : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-mono font-extrabold text-xs ${
                          isSelected ? 'bg-[#E60012] text-white' : 'bg-slate-900 text-white'
                        }`}>
                          {spot.itemNumber}
                        </span>
                      </td>
                      <td className="px-3 py-3 min-w-0">
                        <div className="font-bold text-xs text-slate-900 line-clamp-1">{part.name}</div>
                        <div className="font-mono text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-600">OEM</span>
                          <span>{getPrimaryOem(part)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <div className="font-mono font-extrabold text-sm text-slate-900">
                          {formatCurrency(part.price)}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${meta.bgClass} ${meta.textClass} border ${meta.borderClass}`}>
                            {meta.label}
                          </span>
                          {activeMotorcycle && (
                            compat ? (
                              <span className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-wider">Compatible</span>
                            ) : (
                              <span className="text-[9px] font-extrabold text-red-700 uppercase tracking-wider">Incompatible</span>
                            )
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => onOpenPartDetail(part)}
                            aria-label={`Ver ficha técnica de ${part.name}`}
                            className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                            title="Ver ficha"
                          >
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onAddToCart(part)}
                            disabled={!!activeMotorcycle && compat === false}
                            className="w-8 h-8 flex items-center justify-center bg-[#E60012] hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                            title="Añadir al carrito"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============== Active Garage Card (reused from sidebar) ==============
const ActiveGarageCard: React.FC<{
  activeMotorcycle: ActiveMotorcycle | null;
  onOpenGarageModal: () => void;
}> = ({ activeMotorcycle, onOpenGarageModal }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-[#0a1628] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.55)]">
      {/* Subtle ambient glow */}
      <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-40 rounded-full bg-[#0A3088]/25 blur-3xl" aria-hidden="true" />

      <div className="relative z-20 p-4">
        {activeMotorcycle ? (
          <div className="flex flex-col gap-3">
            {/* Motorcycle image — full-width hero, no frame */}
            <div className="relative w-full h-36" aria-hidden="true">
              <div className="absolute inset-0 rounded-md bg-white" />
              <img
                src={getMotorcyclePng(activeMotorcycle.modelId)}
                alt=""
                className="absolute inset-0 h-full w-full object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              />
              {/* Red corner brackets */}
              <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-l-2 border-t-2 border-[#E60012]" />
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-r-2 border-t-2 border-[#E60012]" />
              <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-l-2 border-b-2 border-[#E60012]" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-r-2 border-b-2 border-[#E60012]" />
            </div>

            {/* Text content — identity block */}
            <div className="flex flex-col gap-1.5">
              <h3 className="font-display text-[1.65rem] font-black leading-[0.95] tracking-tighter text-white">
                {activeMotorcycle.modelName} <span className="text-[#E60012]">{activeMotorcycle.year}</span>
              </h3>

              <span className="text-[10px] font-mono text-slate-300 truncate max-w-full">
                {activeMotorcycle.version}
              </span>
            </div>

            {/* Bottom action: Cambiar moto */}
            <button
              type="button"
              onClick={onOpenGarageModal}
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-3 py-2.5 min-h-[44px] text-[11px] font-extrabold uppercase tracking-wider text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
            >
              <ArrowRightLeft className="w-4 h-4 text-[#E60012]" aria-hidden="true" />
              <span>Cambiar Moto</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 py-1">
            <p className="text-xs leading-relaxed text-slate-400">
              Selecciona tu moto para filtrar los diagramas de despiece con compatibilidad exacta.
            </p>
            <button
              type="button"
              onClick={onOpenGarageModal}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E60012] px-3 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wide text-white shadow-[0_8px_24px_-8px_rgba(230,0,18,0.65)] transition-all hover:bg-red-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              + Configurar Garaje
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============== Diagram Catalog Card ==============
const DiagramCard: React.FC<{ diagram: ExplodedDiagram; onClick: () => void }> = ({ diagram, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group bg-white border border-slate-200 rounded-2xl overflow-hidden text-left transition-all duration-200 hover:border-[#E60012] hover:shadow-lg hover:shadow-red-950/5 hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
    >
      {/* Diagram preview */}
      <div className="relative aspect-4/3 bg-slate-50 overflow-hidden border-b border-slate-200">
        <img
          src={diagram.diagramImage}
          alt={diagram.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Numbered hotspot pins (mini) */}
        {diagram.hotspots.map(spot => (
          <span
            key={spot.itemNumber}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-slate-900 text-slate-900 font-mono font-extrabold text-[9px] flex items-center justify-center pointer-events-none shadow-sm"
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            aria-hidden="true"
          >
            {spot.itemNumber}
          </span>
        ))}

        {/* Category badge */}
        <span className="absolute top-2 left-2 inline-flex items-center px-2 py-0.5 bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-extrabold uppercase tracking-wider rounded-md border border-white/10">
          {diagram.category}
        </span>

        {/* Parts count badge */}
        <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 bg-[#E60012] text-white text-[9px] font-extrabold uppercase tracking-wider rounded-md shadow-md">
          {diagram.hotspots.length} {diagram.hotspots.length === 1 ? 'pieza' : 'piezas'}
        </span>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="font-display text-sm font-black text-slate-900 leading-tight line-clamp-2 group-hover:text-[#E60012] transition-colors">
          {diagram.title}
        </h3>

        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
          <Bike className="w-3 h-3 text-slate-400" aria-hidden="true" />
          <span className="truncate">{diagram.modelTarget}</span>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
          <span className="font-extrabold text-slate-500 uppercase tracking-wider">Ver despiece</span>
          <ChevronRight className="w-4 h-4 text-[#E60012] group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </div>
      </div>
    </button>
  );
};

// ============== Selected Part Strip ==============
const SelectedPartStrip: React.FC<{
  part: SuzukiPart;
  itemNumber: number;
  compatible: boolean | null;
  activeMotorcycle: ActiveMotorcycle | null;
  onAddToCart: (part: SuzukiPart) => void;
  onClose: () => void;
}> = ({ part, itemNumber, compatible, activeMotorcycle, onAddToCart, onClose }) => {
  const availability = getAvailabilityStatus(part);
  const meta = AVAILABILITY_META[availability];
  return (
    <div className="border-b border-slate-200 bg-white px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#E60012] text-white font-mono font-extrabold text-sm shadow-md">
          #{itemNumber}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-black text-sm text-slate-900 leading-snug line-clamp-2">{part.name}</h4>
              <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                OEM <span className="text-slate-800 font-bold">{getPrimaryOem(part)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar detalle"
              className="shrink-0 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
            <span className="font-mono font-extrabold text-base text-slate-900 tracking-tight">
              {formatCurrency(part.price)}
            </span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider ${meta.bgClass} ${meta.textClass} border ${meta.borderClass}`}>
              {meta.label}
            </span>
            {activeMotorcycle && (
              compatible ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                  Compatible {activeMotorcycle.modelName}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 font-extrabold uppercase tracking-wider">
                  <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                  Incompatible
                </span>
              )
            )}
            <button
              type="button"
              onClick={() => onAddToCart(part)}
              disabled={!!activeMotorcycle && compatible === false}
              className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 bg-[#E60012] hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
            >
              <ShoppingBag className="w-3 h-3" aria-hidden="true" />
              Añadir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
