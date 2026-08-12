import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MOTORCYCLE_SECTION_ORDER } from '../data/suzukiData';
import type { ExplodedDiagram, SuzukiPart, SuzukiModel, ActiveMotorcycle, AvailabilityStatus } from '../types';
import { getPrimaryOem, getAvailabilityStatus, AVAILABILITY_META } from '../types';
import {
  Layers, ArrowLeft, Filter, Search, CheckCircle2, AlertTriangle,
  Eye, Info, ChevronRight, X, ArrowRightLeft,
  ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { FaCartPlus } from 'react-icons/fa6';
import { formatCurrency } from '../utils/formatCurrency';
import { getMotorcyclePng } from '../data/motorcycleImages';
import { DiagramCatalogSkeletonGrid } from './SkeletonLoaders';
import motoLoadImg from '../assets/moto-load.webp';

const motoLoadUrl = typeof motoLoadImg === 'string' ? motoLoadImg : (motoLoadImg?.src || '/src/assets/moto-load.webp');

interface ExplodedViewProps {
  activeMotorcycle: ActiveMotorcycle | null;
  onAddToCart: (part: SuzukiPart) => void;
  onOpenPartDetail: (part: SuzukiPart) => void;
  onOpenGarageModal: () => void;
  initialSchematicId?: string;
  initialPartId?: string;
  schematicsList?: ExplodedDiagram[];
  partsList?: SuzukiPart[];
  modelsList?: SuzukiModel[];
  isLoading?: boolean;
}

type ViewMode = 'catalog' | 'detail';

export const ExplodedView: React.FC<ExplodedViewProps> = ({
  activeMotorcycle,
  onAddToCart,
  onOpenPartDetail,
  onOpenGarageModal,
  initialSchematicId,
  initialPartId,
  schematicsList,
  partsList,
  modelsList,
  isLoading = false
}) => {
  const [dbSchematics, setDbSchematics] = useState<ExplodedDiagram[]>(schematicsList || []);
  const [dbParts, setDbParts] = useState<SuzukiPart[]>(partsList || []);
  const [dbModels, setDbModels] = useState<SuzukiModel[]>(modelsList || []);

  useEffect(() => {
    async function loadDbData() {
      try {
        const [schRes, partRes, modRes] = await Promise.all([
          fetch('/api/schematics').then(r => r.json()).catch(() => ({ data: [] })),
          fetch('/api/parts').then(r => r.json()).catch(() => ({ data: [] })),
          fetch('/api/models').then(r => r.json()).catch(() => ({ data: [] }))
        ]);
        if (schRes?.data?.length > 0) setDbSchematics(schRes.data);
        if (partRes?.data?.length > 0) setDbParts(partRes.data);
        if (modRes?.data?.length > 0) setDbModels(modRes.data);
      } catch (e) {
        console.error('Error fetching schematics/parts/models from Neon DB:', e);
      }
    }
    loadDbData();
  }, []);

  useEffect(() => {
    if (schematicsList && schematicsList.length > 0) setDbSchematics(schematicsList);
    if (partsList && partsList.length > 0) setDbParts(partsList);
    if (modelsList && modelsList.length > 0) setDbModels(modelsList);
  }, [schematicsList, partsList, modelsList]);

  const allModels = dbModels;

  const allDiagrams = dbSchematics;
  const allParts = dbParts;

  const [viewMode, setViewMode] = useState<ViewMode>(initialSchematicId ? 'detail' : 'catalog');
  const [selectedDiagramId, setSelectedDiagramId] = useState<string>(
    initialSchematicId || (allDiagrams[0]?.id || '')
  );
  const [selectedPartId, setSelectedPartId] = useState<string | null>(initialPartId ?? null);
  const [activeSection, setActiveSection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pinSize, setPinSize] = useState<'normal' | 'compact' | 'micro'>('compact');

  // Drag to pan state for schematic viewport
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1 || !containerRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop
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

  // Ref to the selected row — used to scroll into view when arriving from a product page
  const selectedRowRef = useRef<HTMLTableRowElement | null>(null);

  // Sync viewMode and selected diagram with initialSchematicId prop from URL route
  useEffect(() => {
    if (initialSchematicId) {
      setSelectedDiagramId(initialSchematicId);
      setViewMode('detail');
    } else {
      setViewMode('catalog');
    }
  }, [initialSchematicId]);

  // When opening directly with a pre-selected part, scroll its row into view smoothly
  useEffect(() => {
    if (initialPartId && viewMode === 'detail' && selectedRowRef.current) {
      const t = window.setTimeout(() => {
        selectedRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
      return () => window.clearTimeout(t);
    }
  }, [initialPartId, viewMode]);

  // Build sections that actually have at least one diagram (for the sidebar)
  const availableSections = useMemo(() => {
    const set = new Set<string>();
    allDiagrams.forEach(d => set.add(d.section));
    return MOTORCYCLE_SECTION_ORDER.filter(s => set.has(s));
  }, [allDiagrams]);

  // Apply motorcycle filter first, then section filter, then search
  const filteredDiagrams = useMemo(() => {
    return allDiagrams.filter(d => {
      // Motorcycle model filter — only diagrams applicable to the active model
      if (activeMotorcycle && d.applicableModelIds && d.applicableModelIds.length > 0 && !d.applicableModelIds.includes(activeMotorcycle.modelId)) {
        return false;
      }
      // Section filter
      if (activeSection !== 'all' && d.section !== activeSection) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = d.title.toLowerCase().includes(q)
          || (d.modelTarget && d.modelTarget.toLowerCase().includes(q))
          || d.category.toLowerCase().includes(q)
          || d.section.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [allDiagrams, activeMotorcycle, activeSection, searchQuery]);

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

  const currentDiagram = allDiagrams.find(d => d.id === selectedDiagramId) || allDiagrams[0] || null;

  // Get parts for the current diagram (in order of item number)
  const diagramParts = useMemo(() => {
    if (!currentDiagram || !currentDiagram.hotspots) return [];
    return currentDiagram.hotspots
      .map(spot => {
        const part = allParts.find(p => p.id === spot.partId);
        return part ? { spot, part } : null;
      })
      .filter((x): x is { spot: typeof currentDiagram.hotspots[0]; part: SuzukiPart } => x !== null)
      .sort((a, b) => a.spot.itemNumber - b.spot.itemNumber);
  }, [currentDiagram, allParts]);

  const selectedPart = diagramParts.find(dp => dp.part.id === selectedPartId)?.part;

  // Compatibility helper
  const isPartCompatible = (part: SuzukiPart): boolean | null => {
    if (!activeMotorcycle) return null;
    return part.compatibility.some(c => {
      if (c.modelId !== activeMotorcycle.modelId) return false;
      if ((c.yearStart && activeMotorcycle.year < c.yearStart) || (c.yearEnd && activeMotorcycle.year > c.yearEnd)) return false;
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
                {filteredDiagrams.length} / {allDiagrams.length} Diagramas
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
                models={allModels}
                isLoading={isLoading}
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
                      {allDiagrams.filter(d =>
                        !activeMotorcycle || d.applicableModelIds.length === 0 || d.applicableModelIds.includes(activeMotorcycle.modelId)
                      ).length}
                    </span>
                  </button>
                  {availableSections.map(sec => {
                    const isSelected = activeSection === sec;
                    const count = allDiagrams.filter(d =>
                      d.section === sec &&
                      (!activeMotorcycle || !d.applicableModelIds || d.applicableModelIds.length === 0 || d.applicableModelIds.includes(activeMotorcycle.modelId))
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
            {isLoading ? (
              <DiagramCatalogSkeletonGrid count={6} />
            ) : groupedBySection.length === 0 ? (
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
                            if (window.location.pathname !== `/despieces/${diagram.id}`) {
                              window.history.pushState(null, '', `/despieces/${diagram.id}`);
                              window.dispatchEvent(new Event('popstate'));
                            }
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
  if (!currentDiagram) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-xs text-center">
          <Info className="w-10 h-10 text-slate-300 mx-auto mb-3" aria-hidden="true" />
          <h2 className="text-lg font-black text-slate-900">Sin diagramas disponibles</h2>
          <p className="text-sm text-slate-500 mt-1">No hay despieces cargados en el catálogo todavía.</p>
        </div>
      </div>
    );
  }

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
              if (window.location.pathname !== '/despieces' && window.location.pathname !== '/despieces/catalogo') {
                window.history.pushState(null, '', '/despieces');
                window.dispatchEvent(new Event('popstate'));
              }
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
            {/* Header Toolbar: Zoom Controls & Pin Size Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-white">
              <div className="min-w-0">
                <span className="text-[9px] font-mono uppercase text-slate-400 block">Modelo objetivo</span>
                <span className="text-xs font-extrabold truncate block">{currentDiagram.modelTarget || 'Aplica a modelos Suzuki'}</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-inner">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(Number((prev - 0.25).toFixed(2)), 1))}
                  disabled={zoomLevel <= 1}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-all cursor-pointer"
                  title="Alejar zoom (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <span className="px-2 font-mono text-[11px] font-bold text-slate-200 min-w-[45px] text-center select-none">
                  {Math.round(zoomLevel * 100)}%
                </span>

                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(Number((prev + 0.25).toFixed(2)), 2.5))}
                  disabled={zoomLevel >= 2.5}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-all cursor-pointer"
                  title="Acercar zoom (hasta 250%)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                {zoomLevel > 1 && (
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 rounded-lg text-[#E60012] hover:bg-red-950/40 transition-all text-[10px] font-mono font-bold flex items-center gap-1"
                    title="Restablecer zoom (100%)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>100%</span>
                  </button>
                )}

                <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />

                <button
                  type="button"
                  onClick={() => {
                    if (pinSize === 'normal') setPinSize('compact');
                    else if (pinSize === 'compact') setPinSize('micro');
                    else setPinSize('normal');
                  }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Cambiar tamaño de puntos de piezas"
                >
                  Puntos: {pinSize.toUpperCase()}
                </button>
              </div>
            </div>

            {/* Viewport with Zoom Overflow Scroll & Drag-to-Pan */}
            <div className="relative bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`p-3 max-h-[520px] overflow-auto custom-scrollbar flex select-none ${
                  zoomLevel > 1
                    ? (isDragging ? 'items-start justify-start cursor-grabbing' : 'items-start justify-start cursor-grab')
                    : 'items-center justify-center'
                }`}
              >
                <div
                  className="relative transition-all duration-200"
                  style={{
                    width: zoomLevel > 1 ? `${zoomLevel * 100}%` : '100%',
                    minWidth: zoomLevel > 1 ? `${zoomLevel * 100}%` : '100%'
                  }}
                >
                  <img
                    src={currentDiagram.diagramImage}
                    alt={currentDiagram.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-contain pointer-events-none select-none"
                  />

                  {/* Hotspot pins with radar pulse effect */}
                  {currentDiagram.hotspots.map(spot => {
                    const isSelected = selectedPartId === spot.partId;

                    // Dynamic pin sizes for small parts
                    const pinClasses =
                      pinSize === 'normal' ? 'w-8 h-8 font-mono text-xs font-black' :
                      pinSize === 'compact' ? 'w-5.5 h-5.5 font-mono text-[10px] font-black' :
                      'w-3.5 h-3.5 text-[0px] ring-2 ring-white shadow-lg';

                    return (
                      <button
                        key={spot.itemNumber}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPartId(spot.partId);
                        }}
                        aria-label={`Punto #${spot.itemNumber} - ${spot.label}`}
                        style={{
                          left: `${spot.x}%`,
                          top: `${spot.y}%`,
                          transform: `translate(-50%, -50%) scale(${1 / Math.sqrt(zoomLevel)})`
                        }}
                        className={`absolute rounded-full flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none ${pinClasses} ${
                          isSelected
                            ? 'bg-[#E60012] text-white ring-4 ring-red-400/50 z-20 scale-110 shadow-xl'
                            : 'bg-white text-slate-900 ring-2 ring-slate-900 hover:bg-[#E60012] hover:text-white z-10'
                        }`}
                      >
                        {/* Radar pulse effect */}
                        <span
                          className={`absolute inset-0 rounded-full pointer-events-none ${
                            isSelected
                              ? '-m-2.5 bg-[#E60012]/40 animate-ping'
                              : '-m-1 bg-red-500/25 animate-pulse'
                          }`}
                          aria-hidden="true"
                        />

                        <span className="relative z-10">{pinSize !== 'micro' && spot.itemNumber}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
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
                  <FaMotorcycle className="w-4 h-4 text-[#E60012]" aria-hidden="true" />
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
                            <FaCartPlus className="w-3.5 h-3.5" aria-hidden="true" />
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
  models?: SuzukiModel[];
  isLoading?: boolean;
}> = ({ activeMotorcycle, onOpenGarageModal, models, isLoading = false }) => {
  const availableModels = models || [];
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-[#0a1628] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.55)]">
      {/* Subtle ambient glow */}
      <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-40 rounded-full bg-[#0A3088]/25 blur-3xl" aria-hidden="true" />

      <div className="relative z-20 p-4">
        {activeMotorcycle ? (
          <div className="flex flex-col gap-3">
            {/* Motorcycle image — full-width hero with moto-load.webp skeleton */}
            <div className="relative w-full h-36 rounded-md overflow-hidden bg-white" aria-hidden="true">
              {(() => {
                const activeModelObj = availableModels.find(m =>
                  m.id === activeMotorcycle.modelId ||
                  m.id.toLowerCase().replace(/[^a-z0-9]/g, '') === activeMotorcycle.modelId.toLowerCase().replace(/[^a-z0-9]/g, '') ||
                  m.name.toLowerCase().includes(activeMotorcycle.modelName.toLowerCase()) ||
                  activeMotorcycle.modelName.toLowerCase().includes(m.name.toLowerCase())
                );
                const activeMotoImage = activeModelObj?.image || getMotorcyclePng(activeMotorcycle.modelId);
                
                if (isLoading || !activeMotoImage) {
                  return (
                    <img
                      src={motoLoadUrl}
                      alt="Cargando..."
                      className="absolute inset-0 h-full w-full object-contain p-3 opacity-40 animate-pulse pointer-events-none"
                    />
                  );
                }
                return (
                  <img
                    src={activeMotoImage}
                    alt={activeMotorcycle.modelName}
                    className="absolute inset-0 h-full w-full object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = motoLoadUrl;
                    }}
                  />
                );
              })()}
              {/* Red corner brackets */}
              <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-l-2 border-t-2 border-[#E60012] z-20" />
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-r-2 border-t-2 border-[#E60012] z-20" />
              <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-l-2 border-b-2 border-[#E60012] z-20" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-r-2 border-b-2 border-[#E60012] z-20" />
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
          <FaMotorcycle className="w-3 h-3 text-slate-400" aria-hidden="true" />
          <span className="truncate">{diagram.modelTarget || 'Aplica a modelos Suzuki'}</span>
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
              <FaCartPlus className="w-3 h-3" aria-hidden="true" />
              Añadir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
