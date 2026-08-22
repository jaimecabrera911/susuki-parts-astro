import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MOTORCYCLE_SECTION_ORDER } from '../data/suzukiData';
import type { ExplodedDiagram, SuzukiPart, SuzukiModel, ActiveMotorcycle, AvailabilityStatus } from '../types';
import { getPrimaryOem, getAvailabilityStatus, AVAILABILITY_META } from '../types';
import {
  Layers, ArrowLeft, Filter, Search, CheckCircle2, AlertTriangle,
  Eye, Info, ChevronRight, X, ArrowRightLeft,
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2
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
  const [pinSize, setPinSize] = useState<'large' | 'normal' | 'compact'>('compact');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [fullscreenZoom, setFullscreenZoom] = useState<number>(1);

  // Drag to pan state for schematic viewport
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Escape key to close fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX,
      y: touch.clientY,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.x;
    const dy = touch.clientY - dragStart.y;
    containerRef.current.scrollLeft = dragStart.scrollLeft - dx;
    containerRef.current.scrollTop = dragStart.scrollTop - dy;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Fullscreen Pan handlers
  const [isFullscreenDragging, setIsFullscreenDragging] = useState(false);
  const [fullscreenDragStart, setFullscreenDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const handleFullscreenMouseDown = (e: React.MouseEvent) => {
    if (!fullscreenContainerRef.current) return;
    setIsFullscreenDragging(true);
    setFullscreenDragStart({
      x: e.clientX,
      y: e.clientY,
      scrollLeft: fullscreenContainerRef.current.scrollLeft,
      scrollTop: fullscreenContainerRef.current.scrollTop
    });
  };

  const handleFullscreenMouseMove = (e: React.MouseEvent) => {
    if (!isFullscreenDragging || !fullscreenContainerRef.current) return;
    e.preventDefault();
    const dx = e.clientX - fullscreenDragStart.x;
    const dy = e.clientY - fullscreenDragStart.y;
    fullscreenContainerRef.current.scrollLeft = fullscreenDragStart.scrollLeft - dx;
    fullscreenContainerRef.current.scrollTop = fullscreenDragStart.scrollTop - dy;
  };

  const handleFullscreenMouseUp = () => {
    setIsFullscreenDragging(false);
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

  const getDiagramSection = (d: ExplodedDiagram) => d.section?.trim() || d.category?.trim() || 'Motor';

  // Build sections that actually have at least one diagram (for the sidebar)
  const availableSections = useMemo(() => {
    const set = new Set<string>();
    allDiagrams.forEach(d => set.add(getDiagramSection(d)));
    const canonical = MOTORCYCLE_SECTION_ORDER.filter(s => set.has(s));
    const extra = Array.from(set).filter(s => !canonical.includes(s));
    return [...canonical, ...extra];
  }, [allDiagrams]);

  // Apply motorcycle filter first, then section filter, then search
  const filteredDiagrams = useMemo(() => {
    return allDiagrams.filter(d => {
      const sec = getDiagramSection(d);
      // Motorcycle model filter — only diagrams applicable to the active model
      if (activeMotorcycle && d.applicableModelIds && d.applicableModelIds.length > 0 && !d.applicableModelIds.includes(activeMotorcycle.modelId)) {
        return false;
      }
      // Section filter
      if (activeSection !== 'all' && sec !== activeSection) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = d.title.toLowerCase().includes(q)
          || (d.modelTarget && d.modelTarget.toLowerCase().includes(q))
          || d.category.toLowerCase().includes(q)
          || sec.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [allDiagrams, activeMotorcycle, activeSection, searchQuery]);

  // Group filtered diagrams by section in canonical order
  const groupedBySection = useMemo(() => {
    const groups: { section: string; diagrams: ExplodedDiagram[] }[] = [];
    const orderedSections = activeSection === 'all' ? availableSections : [activeSection];
    orderedSections.forEach(sec => {
      const diagrams = filteredDiagrams.filter(d => getDiagramSection(d) === sec);
      if (diagrams.length > 0) {
        groups.push({ section: sec, diagrams });
      }
    });

    // Fallback: If there are filtered diagrams not matched in orderedSections, add them under their section
    const groupedIds = new Set(groups.flatMap(g => g.diagrams.map(d => d.id)));
    const remaining = filteredDiagrams.filter(d => !groupedIds.has(d.id));
    if (remaining.length > 0) {
      groups.push({ section: 'General', diagrams: remaining });
    }

    return groups;
  }, [filteredDiagrams, activeSection, availableSections]);

  const currentDiagram = allDiagrams.find(d => d.id === selectedDiagramId) || allDiagrams[0] || null;

  // Track previous zoom and part to distinguish zoom changes vs hotspot selections
  const prevZoomRef = useRef(zoomLevel);
  const prevFullscreenZoomRef = useRef(fullscreenZoom);

  // Helper to center the viewport either on the selected hotspot or in the middle of the diagram
  const centerViewport = (
    container: HTMLDivElement | null,
    zoom: number,
    targetPartId: string | null,
    diagram: ExplodedDiagram | null,
    smooth = false
  ) => {
    if (!container || zoom <= 1 || !diagram) return;
    requestAnimationFrame(() => {
      if (!container) return;
      const { scrollWidth, scrollHeight, clientWidth, clientHeight } = container;
      if (scrollWidth <= clientWidth && scrollHeight <= clientHeight) return;

      const selectedSpot = targetPartId
        ? diagram.hotspots.find(s => s.partId === targetPartId)
        : null;

      let targetLeft: number;
      let targetTop: number;

      if (selectedSpot) {
        // Center directly on the hotspot coordinates
        targetLeft = (selectedSpot.x / 100) * scrollWidth - clientWidth / 2;
        targetTop = (selectedSpot.y / 100) * scrollHeight - clientHeight / 2;
      } else {
        // Center on the middle of the diagram
        targetLeft = (scrollWidth - clientWidth) / 2;
        targetTop = (scrollHeight - clientHeight) / 2;
      }

      container.scrollTo({
        left: Math.max(0, targetLeft),
        top: Math.max(0, targetTop),
        behavior: smooth ? 'smooth' : 'auto'
      });
    });
  };

  // Center on zoom change or when selecting a hotspot in detail view
  useEffect(() => {
    if (viewMode === 'detail' && zoomLevel > 1) {
      const zoomChanged = prevZoomRef.current !== zoomLevel;
      // Instant anchor when zooming (+/-) to eliminate jump/wobble; smooth glide only when clicking another part
      centerViewport(containerRef.current, zoomLevel, selectedPartId, currentDiagram, !zoomChanged);
    }
    prevZoomRef.current = zoomLevel;
  }, [zoomLevel, selectedPartId, viewMode, currentDiagram]);

  // Center on zoom change or when selecting a hotspot in fullscreen view
  useEffect(() => {
    if (isFullscreen && fullscreenZoom > 1) {
      const zoomChanged = prevFullscreenZoomRef.current !== fullscreenZoom;
      centerViewport(fullscreenContainerRef.current, fullscreenZoom, selectedPartId, currentDiagram, !zoomChanged);
    }
    prevFullscreenZoomRef.current = fullscreenZoom;
  }, [fullscreenZoom, selectedPartId, isFullscreen, currentDiagram]);

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

  const activeModelMeta = activeMotorcycle
    ? allModels.find(m =>
        m.id === activeMotorcycle.modelId ||
        m.id.toLowerCase().replace(/[^a-z0-9]/g, '') === activeMotorcycle.modelId.toLowerCase().replace(/[^a-z0-9]/g, '') ||
        m.name.toLowerCase().includes(activeMotorcycle.modelName.toLowerCase()) ||
        activeMotorcycle.modelName.toLowerCase().includes(m.name.toLowerCase())
      )
    : null;

  const targetModelMeta = !activeMotorcycle && currentDiagram
    ? allModels.find(m =>
        (currentDiagram.applicableModelIds && currentDiagram.applicableModelIds.includes(m.id)) ||
        (currentDiagram.modelTarget && (m.name.toLowerCase().includes(currentDiagram.modelTarget.toLowerCase()) || currentDiagram.modelTarget.toLowerCase().includes(m.name.toLowerCase())))
      )
    : null;

  const detailMotoImage = activeModelMeta?.image ||
    (activeMotorcycle ? getMotorcyclePng(activeMotorcycle.modelId) : null) ||
    targetModelMeta?.image ||
    (targetModelMeta ? getMotorcyclePng(targetModelMeta.id) : null) ||
    (currentDiagram?.applicableModelIds?.[0] ? getMotorcyclePng(currentDiagram.applicableModelIds[0]) : '') ||
    '';

  // ============ CATALOG MODE ============
  if (viewMode === 'catalog') {
    return (
      <div id="exploded-view" className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                      getDiagramSection(d) === sec &&
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
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
      <div id="exploded-view" className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-xs text-center">
          <Info className="w-10 h-10 text-slate-300 mx-auto mb-3" aria-hidden="true" />
          <h2 className="text-lg font-black text-slate-900">Sin diagramas disponibles</h2>
          <p className="text-sm text-slate-500 mt-1">No hay despieces cargados en el catálogo todavía.</p>
        </div>
      </div>
    );
  }

  return (
    <div id="exploded-view" className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb / Back Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
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

      {/* Motorcycle Identity Card in Detail Mode (Visible in mobile and desktop) */}
      <div className="group relative overflow-hidden rounded-2xl bg-[#0a1628] border border-slate-800 shadow-md p-3.5 sm:p-4 mb-6 text-white">
        <div className="pointer-events-none absolute -right-6 -bottom-6 h-28 w-32 rounded-full bg-[#0A3088]/25 blur-2xl" aria-hidden="true" />
        <div className="relative z-10 flex items-center justify-between gap-3">
          {/* Text Info */}
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              <FaMotorcycle className="w-3 h-3 text-emerald-400" aria-hidden="true" />
              <span>{activeMotorcycle ? 'Moto Seleccionada' : 'Modelo del Despiece'}</span>
            </div>
            <h3 className="font-display text-base sm:text-lg font-black leading-tight tracking-tight text-white truncate">
              {activeMotorcycle ? (
                <>
                  {activeMotorcycle.modelName} <span className="text-[#E60012]">{activeMotorcycle.year}</span>
                </>
              ) : (
                currentDiagram.modelTarget || 'Modelos Suzuki'
              )}
            </h3>
            <p className="text-[10px] font-mono text-slate-300 truncate mt-0.5">
              {activeMotorcycle ? activeMotorcycle.version : `Sección: ${getDiagramSection(currentDiagram)}`}
            </p>
            <button
              type="button"
              onClick={onOpenGarageModal}
              className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-3 h-3 text-[#E60012]" aria-hidden="true" />
              <span>{activeMotorcycle ? 'Cambiar Moto' : 'Configurar Garaje'}</span>
            </button>
          </div>

          {/* Motorcycle Image */}
          <div className="relative w-28 h-20 shrink-0 rounded-xl bg-white overflow-hidden p-1.5 flex items-center justify-center shadow-inner" aria-hidden="true">
            {isLoading || !detailMotoImage ? (
              <img
                src={motoLoadUrl}
                alt="Cargando..."
                className="h-full w-full object-contain opacity-40 animate-pulse pointer-events-none"
              />
            ) : (
              <img
                src={detailMotoImage}
                alt={activeMotorcycle ? activeMotorcycle.modelName : (currentDiagram.modelTarget || 'Suzuki')}
                className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = motoLoadUrl;
                }}
              />
            )}
            {/* Red corner brackets */}
            <div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 border-l-2 border-t-2 border-[#E60012] z-20" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 border-r-2 border-t-2 border-[#E60012] z-20" />
            <div className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 border-l-2 border-b-2 border-[#E60012] z-20" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-r-2 border-b-2 border-[#E60012] z-20" />
          </div>
        </div>
      </div>

      {/* Detail Content: Diagram (left) + Parts Table (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Diagram */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-4 relative overflow-hidden flex flex-col">
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} aria-hidden="true" />

          <div className="relative z-10 flex-1 flex flex-col">
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

                <span className="px-1.5 font-mono text-[11px] font-bold text-slate-200 min-w-[42px] text-center select-none">
                  {zoomLevel === 1 ? 'Ajustar' : `${Math.round(zoomLevel * 100)}%`}
                </span>

                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(Number((prev + 0.25).toFixed(2)), 3))}
                  disabled={zoomLevel >= 3}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-all cursor-pointer"
                  title="Acercar zoom (hasta 300%)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                {zoomLevel > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setZoomLevel(1);
                      if (containerRef.current) {
                        containerRef.current.scrollTop = 0;
                        containerRef.current.scrollLeft = 0;
                      }
                    }}
                    className="p-1.5 rounded-lg text-[#E60012] hover:bg-red-950/40 transition-all text-[10px] font-mono font-bold flex items-center gap-1"
                    title="Restablecer vista completa (Ajustar)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ajustar</span>
                  </button>
                )}

                <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />

                <button
                  type="button"
                  onClick={() => {
                    if (pinSize === 'compact') setPinSize('normal');
                    else if (pinSize === 'normal') setPinSize('large');
                    else setPinSize('compact');
                  }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Cambiar tamaño de puntos de piezas"
                >
                  Puntos: {pinSize === 'large' ? 'GRANDE' : pinSize === 'normal' ? 'NORMAL' : 'COMPACTO'}
                </button>

                <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />

                <button
                  type="button"
                  onClick={() => {
                    setFullscreenZoom(1);
                    setIsFullscreen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                  title="Ver en pantalla completa"
                  aria-label="Ver en pantalla completa"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Viewport with Zoom Overflow Scroll & Drag-to-Pan */}
            <div className="relative bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex-1 min-h-[500px] flex flex-col justify-center">
              <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`p-3 h-[520px] sm:h-[580px] lg:h-[620px] overflow-auto custom-scrollbar flex select-none ${
                  zoomLevel > 1
                    ? (isDragging ? 'items-start justify-start cursor-grabbing' : 'items-start justify-start cursor-grab')
                    : 'items-center justify-center cursor-default'
                }`}
              >
                <div
                  className="relative"
                  style={
                    zoomLevel > 1
                      ? {
                          width: `${zoomLevel * 100}%`,
                          minWidth: `${zoomLevel * 100}%`
                        }
                      : {
                          maxWidth: '100%',
                          maxHeight: '100%',
                          display: 'inline-block'
                        }
                  }
                >
                  <img
                    src={currentDiagram.diagramImage}
                    alt={currentDiagram.title}
                    referrerPolicy="no-referrer"
                    className={`${
                      zoomLevel > 1
                        ? 'w-full h-auto'
                        : 'max-h-[480px] sm:max-h-[540px] lg:max-h-[580px] max-w-full w-auto h-auto'
                    } object-contain block select-none pointer-events-none mx-auto`}
                  />

                  {/* Hotspot pins with radar pulse effect */}
                  {currentDiagram.hotspots.map(spot => {
                    const isSelected = selectedPartId === spot.partId;

                    // Dynamic pin sizes for small parts
                    const pinClasses =
                      pinSize === 'large' ? 'w-10 h-10 font-mono text-sm font-black border-2' :
                      pinSize === 'normal' ? 'w-8 h-8 font-mono text-xs font-black border-2' :
                      'w-6 h-6 font-mono text-[11px] font-black border';

                    const zoomScale = zoomLevel > 1 ? 1 + (zoomLevel - 1) * 0.35 : 1;

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
                          transform: `translate(-50%, -50%) scale(${zoomScale})`
                        }}
                        className={`absolute rounded-full flex items-center justify-center transition-transform duration-150 cursor-pointer focus-visible:outline-none shadow-md ${pinClasses} ${
                          isSelected
                            ? 'bg-[#E60012] text-white border-white ring-4 ring-[#E60012]/40 z-30 scale-110 shadow-lg animate-pulse'
                            : 'bg-white text-slate-900 border-slate-900 hover:bg-[#E60012] hover:text-white hover:border-white z-10'
                        }`}
                      >
                        <span className="relative z-10 leading-none">{spot.itemNumber}</span>
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
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col max-h-[750px]">
          {/* Table Header */}
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <FaMotorcycle className="w-4 h-4 text-[#E60012]" aria-hidden="true" />
                  Piezas del despiece
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {diagramParts.length} {diagramParts.length === 1 ? 'repuesto registrado' : 'repuestos registrados'}
                  {activeMotorcycle && ' — compatibilidad evaluada con tu moto'}
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
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-600 z-10">
                <tr>
                  <th className="px-3 py-2.5 font-extrabold w-12 text-center bg-slate-50">#</th>
                  <th className="px-3 py-2.5 font-extrabold bg-slate-50">Repuesto / OEM</th>
                  <th className="px-3 py-2.5 font-extrabold text-right bg-slate-50">Precio</th>
                  <th className="px-3 py-2.5 font-extrabold text-center bg-slate-50">Estado</th>
                  <th className="px-3 py-2.5 font-extrabold text-right bg-slate-50">Acción</th>
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

      {/* Fullscreen Interactive Lightbox Modal */}
      {isFullscreen && (
        <div
          id="exploded-view-fullscreen"
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col text-white animate-in fade-in duration-200"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-red-950/60 border border-red-800/40 text-[#E60012] flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black truncate">{currentDiagram.title}</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {currentDiagram.category} • {currentDiagram.modelTarget || 'Modelos Suzuki'}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFullscreenZoom(prev => Math.max(Number((prev - 0.25).toFixed(2)), 1))}
                  disabled={fullscreenZoom <= 1}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 transition-all cursor-pointer"
                  title="Alejar zoom"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <span className="px-2 font-mono text-xs font-bold text-slate-200 min-w-[45px] text-center select-none">
                  {fullscreenZoom === 1 ? 'Ajustar' : `${Math.round(fullscreenZoom * 100)}%`}
                </span>

                <button
                  type="button"
                  onClick={() => setFullscreenZoom(prev => Math.min(Number((prev + 0.25).toFixed(2)), 3.5))}
                  disabled={fullscreenZoom >= 3.5}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 transition-all cursor-pointer"
                  title="Acercar zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                {fullscreenZoom > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFullscreenZoom(1);
                      if (fullscreenContainerRef.current) {
                        fullscreenContainerRef.current.scrollTop = 0;
                        fullscreenContainerRef.current.scrollLeft = 0;
                      }
                    }}
                    className="p-1.5 rounded-lg text-[#E60012] hover:bg-red-950/40 transition-all text-xs font-mono font-bold flex items-center gap-1"
                    title="Restablecer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ajustar</span>
                  </button>
                )}

                <div className="h-4 w-[1px] bg-slate-600 mx-1" />

                <button
                  type="button"
                  onClick={() => {
                    if (pinSize === 'compact') setPinSize('normal');
                    else if (pinSize === 'normal') setPinSize('large');
                    else setPinSize('compact');
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                >
                  Puntos: {pinSize === 'large' ? 'GRANDE' : pinSize === 'normal' ? 'NORMAL' : 'COMPACTO'}
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Cerrar pantalla completa (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Body */}
          <div className="flex-1 overflow-hidden relative flex flex-col lg:flex-row">
            {/* Diagram Viewport */}
            <div
              ref={fullscreenContainerRef}
              onMouseDown={handleFullscreenMouseDown}
              onMouseMove={handleFullscreenMouseMove}
              onMouseUp={handleFullscreenMouseUp}
              onMouseLeave={handleFullscreenMouseUp}
              className={`flex-1 p-6 overflow-auto custom-scrollbar flex select-none ${
                fullscreenZoom > 1
                  ? (isFullscreenDragging ? 'items-start justify-start cursor-grabbing' : 'items-start justify-start cursor-grab')
                  : 'items-center justify-center'
              }`}
            >
              <div
                className="relative bg-white rounded-2xl p-4 shadow-2xl"
                style={
                  fullscreenZoom > 1
                    ? {
                        width: `${fullscreenZoom * 100}%`,
                        minWidth: `${fullscreenZoom * 100}%`
                      }
                    : {
                        maxWidth: '92%',
                        maxHeight: '92%',
                        display: 'inline-block'
                      }
                }
              >
                <img
                  src={currentDiagram.diagramImage}
                  alt={currentDiagram.title}
                  referrerPolicy="no-referrer"
                  className={`${
                    fullscreenZoom > 1
                      ? 'w-full h-auto'
                      : 'max-h-[calc(100vh-180px)] max-w-full w-auto h-auto'
                  } object-contain block select-none pointer-events-none mx-auto`}
                />

                {/* Hotspot pins */}
                {currentDiagram.hotspots.map(spot => {
                  const isSelected = selectedPartId === spot.partId;
                  const pinClasses =
                    pinSize === 'large' ? 'w-10 h-10 font-mono text-sm font-black border-2' :
                    pinSize === 'normal' ? 'w-8 h-8 font-mono text-xs font-black border-2' :
                    'w-6 h-6 font-mono text-[11px] font-black border';

                  const fullscreenScale = fullscreenZoom > 1 ? 1 + (fullscreenZoom - 1) * 0.35 : 1;

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
                        transform: `translate(-50%, -50%) scale(${fullscreenScale})`
                      }}
                      className={`absolute rounded-full flex items-center justify-center transition-transform duration-150 cursor-pointer focus-visible:outline-none shadow-md ${pinClasses} ${
                        isSelected
                          ? 'bg-[#E60012] text-white border-white ring-4 ring-[#E60012]/40 z-30 scale-110 shadow-xl animate-pulse'
                          : 'bg-white text-slate-900 border-slate-900 hover:bg-[#E60012] hover:text-white hover:border-white z-10'
                      }`}
                    >
                      <span className="relative z-10 leading-none">{spot.itemNumber}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Part Drawer in Fullscreen (if any) */}
            {selectedPart && (
              <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-6 flex flex-col justify-between shrink-0 overflow-y-auto max-h-[40vh] lg:max-h-full">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#E60012] text-white font-mono font-extrabold text-base shadow-md">
                      #{diagramParts.find(dp => dp.part.id === selectedPart.id)?.spot.itemNumber ?? 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPartId(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="text-lg font-black text-white leading-snug mb-1">{selectedPart.name}</h4>
                  <div className="font-mono text-xs text-slate-400 mb-4">
                    OEM: <span className="text-white font-bold">{getPrimaryOem(selectedPart)}</span>
                  </div>

                  <div className="text-2xl font-mono font-black text-white mb-4">
                    {formatCurrency(selectedPart.price)}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      onAddToCart(selectedPart);
                    }}
                    className="w-full py-3 bg-[#E60012] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <FaCartPlus className="w-4 h-4" />
                    <span>Añadir al Carrito</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFullscreen(false);
                      onOpenPartDetail(selectedPart);
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Ver Ficha Técnica</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
  const activeModelObj = activeMotorcycle
    ? availableModels.find(m =>
        m.id === activeMotorcycle.modelId ||
        m.id.toLowerCase().replace(/[^a-z0-9]/g, '') === activeMotorcycle.modelId.toLowerCase().replace(/[^a-z0-9]/g, '') ||
        m.name.toLowerCase().includes(activeMotorcycle.modelName.toLowerCase()) ||
        activeMotorcycle.modelName.toLowerCase().includes(m.name.toLowerCase())
      )
    : null;
  const activeMotoImage = activeModelObj?.image || (activeMotorcycle ? getMotorcyclePng(activeMotorcycle.modelId) : '');

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-[#0a1628] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.55)] border border-slate-800">
      {/* Subtle ambient glow */}
      <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-40 rounded-full bg-[#0A3088]/25 blur-3xl" aria-hidden="true" />

      <div className="relative z-20 p-4">
        {activeMotorcycle ? (
          <div className="flex flex-col gap-3">
            {/* Motorcycle image — full-width hero with moto-load.webp skeleton */}
            <div className="relative w-full h-36 rounded-md overflow-hidden bg-white" aria-hidden="true">
              {isLoading || !activeMotoImage ? (
                <img
                  src={motoLoadUrl}
                  alt="Cargando..."
                  className="absolute inset-0 h-full w-full object-contain p-3 opacity-40 animate-pulse pointer-events-none"
                />
              ) : (
                <img
                  src={activeMotoImage}
                  alt={activeMotorcycle.modelName}
                  className="absolute inset-0 h-full w-full object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = motoLoadUrl;
                  }}
                />
              )}
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
