import React, { useState } from 'react';
import {
  Filter,
  Search,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Tag,
  DollarSign,
  Box,
  Layers,
  X,
  Sparkles,
  ArrowUpDown,
  ArrowUpRight,
  Globe,
  Clock
} from 'lucide-react';
import type { ActiveMotorcycle, SuzukiPart, AvailabilityStatus } from '../types';
import { AVAILABILITY_META } from '../types';
import { SUZUKI_MODELS } from '../data/suzukiData';
import { getMotorcyclePng } from '../data/motorcycleImages';
import { formatCurrency } from '../utils/formatCurrency';

interface CatalogSidebarFilterProps {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onlyCompatible: boolean;
  setOnlyCompatible: (val: boolean) => void;
  availabilityFilter: Set<AvailabilityStatus>;
  setAvailabilityFilter: (filter: Set<AvailabilityStatus>) => void;
  maxPriceFilter: number;
  setMaxPriceFilter: (price: number) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeMotorcycle: ActiveMotorcycle | null;
  onOpenGarageModal: () => void;
  allParts: SuzukiPart[];
  filteredCount: number;
  onResetFilters: () => void;
}

export const CatalogSidebarFilter: React.FC<CatalogSidebarFilterProps> = ({
  selectedCategory,
  setSelectedCategory,
  onlyCompatible,
  setOnlyCompatible,
  availabilityFilter,
  setAvailabilityFilter,
  maxPriceFilter,
  setMaxPriceFilter,
  sortBy,
  setSortBy,
  searchQuery,
  setSearchQuery,
  activeMotorcycle,
  onOpenGarageModal,
  allParts,
  filteredCount,
  onResetFilters
}) => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    vehicle: true,
    category: true,
    price: true,
    availability: true
  });

  // Handle Escape key and body scroll lock for mobile drawer
  React.useEffect(() => {
    if (!mobileFiltersOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileFiltersOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileFiltersOpen]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Find max possible price in database
  const maxDatabasePrice = Math.max(...allParts.map(p => p.price), 1000000);

  // Category counts
  const categories = [
    { id: 'all', label: 'Todos los Repuestos', icon: Layers },
    { id: 'filtros', label: 'Filtros & Mantenimiento', icon: Tag },
    { id: 'motor', label: 'Motor & Inyección', icon: Box },
    { id: 'frenos', label: 'Frenos & ABS', icon: ShieldCheck },
    { id: 'transmision', label: 'Transmisión & Arrastre', icon: SlidersHorizontal },
    { id: 'electrico', label: 'Sistema Eléctrico', icon: Sparkles }
  ];

  const getRelevantModelParts = () => {
    return allParts.filter(part => {
      // Filter by active motorcycle in garage if compatibility toggle is active
      if (onlyCompatible && activeMotorcycle) {
        const isCompatible = part.compatibility.some(c => {
          if (c.modelId !== activeMotorcycle.modelId) return false;
          if (activeMotorcycle.year < c.yearStart || activeMotorcycle.year > c.yearEnd) return false;
          if (c.version && c.version !== activeMotorcycle.version) return false;
          return true;
        });
        if (!isCompatible) return false;
      }

      return true;
    });
  };

  const getCategoryCount = (catId: string) => {
    const relevantParts = getRelevantModelParts();
    if (catId === 'all') return relevantParts.length;
    return relevantParts.filter(p => p.category === catId).length;
  };

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (onlyCompatible && activeMotorcycle ? 1 : 0) +
    (availabilityFilter.size < 3 ? 1 : 0) +
    (maxPriceFilter < maxDatabasePrice ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const activeModelMeta = activeMotorcycle
    ? SUZUKI_MODELS.find((m) => m.id === activeMotorcycle.modelId)
    : null;

  const FilterContent = () => (
    <div className="space-y-6">
      
      {/* 1. Vehicle Context — Active Garage Card */}
      <div className="group relative overflow-hidden rounded-2xl bg-[#0a1628] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.55)]">
        {/* Technical grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          aria-hidden="true"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Subtle ambient glow */}
        <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-40 rounded-full bg-[#0A3088]/25 blur-3xl" aria-hidden="true" />

        <div className="relative z-20 p-4">
          {/* Header: Status + Action */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[11px] font-extrabold tracking-[0.18em] text-white uppercase">
                Garaje Activo
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenGarageModal}
              className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#E60012] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_4px_12px_-4px_rgba(230,0,18,0.6)] transition-all hover:bg-red-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Cambiar
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>

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
                {activeModelMeta && (
                  <span className="inline-flex w-fit items-center rounded-full bg-[#0A3088] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white">
                    {activeModelMeta.category}
                  </span>
                )}

                <h3 className="font-display text-[1.85rem] font-black leading-[0.9] tracking-tighter text-white">
                  {activeMotorcycle.modelName}
                </h3>

                <div className="mt-0.5 flex items-stretch gap-2">
                  <span className="inline-flex items-center justify-center rounded-lg bg-[#0A3088] px-2.5 py-1 font-mono text-sm font-black text-white min-w-[52px]">
                    {activeMotorcycle.year}
                  </span>
                  <div className="flex flex-col justify-center leading-tight min-w-0">
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-white">MY</span>
                    <span className="text-[10px] font-mono text-slate-300 truncate max-w-[170px]">
                      SPEC {activeMotorcycle.version}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-1">
              <p className="text-xs leading-relaxed text-slate-400">
                Selecciona tu moto para filtrar repuestos con compatibilidad exacta.
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

      {/* 2. Search Input */}
      <div>
        <label htmlFor="sidebar-search-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" /> Búsqueda Rápida
        </label>
        <div className="relative">
          <input
            id="sidebar-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ej: Filtro, Bujía, Ref..."
            className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 p-1"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Category Filter List */}
      <div className="border-t border-slate-200 pt-4">
        <button
          type="button"
          aria-expanded={expandedSections.category}
          aria-controls="filter-section-category"
          onClick={() => toggleSection('category')}
          className="w-full flex items-center justify-between py-1 text-xs font-extrabold uppercase tracking-wider text-slate-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] rounded"
        >
          <div className="text-left">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#E60012]" aria-hidden="true" /> Categorías
            </span>
            <span className="text-[10px] text-slate-500 font-normal lowercase block">
              {(onlyCompatible && activeMotorcycle)
                ? `Filtrado por ${activeMotorcycle.modelName}`
                : 'Conteo total (todos los modelos)'}
            </span>
          </div>
          {expandedSections.category ? <ChevronUp className="w-4 h-4 text-slate-500" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />}
        </button>

        {expandedSections.category && (
          <div id="filter-section-category" className="mt-3 space-y-1">
            {categories.map((cat) => {
              const count = getCategoryCount(cat.id);
              const isSelected = selectedCategory === cat.id;
              const IconComp = cat.icon;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[40px] rounded-xl text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
                    isSelected
                      ? 'bg-[#E60012] text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <IconComp className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} aria-hidden="true" />
                    <span className="truncate">{cat.label}</span>
                  </span>
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Price Range Slider */}
      <div className="border-t border-slate-200 pt-4">
        <button
          type="button"
          aria-expanded={expandedSections.price}
          aria-controls="filter-section-price"
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between py-1 text-xs font-extrabold uppercase tracking-wider text-slate-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] rounded"
        >
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" /> Precio Máximo
          </span>
          {expandedSections.price ? <ChevronUp className="w-4 h-4 text-slate-500" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />}
        </button>

        {expandedSections.price && (
          <div id="filter-section-price" className="mt-3 space-y-3 px-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="text-slate-500">$0 COP</span>
              <span className="text-[#E60012] font-mono text-xs">{formatCurrency(maxPriceFilter)}</span>
            </div>
            <label htmlFor="price-range-slider" className="sr-only">Seleccionar precio máximo</label>
            <input
              id="price-range-slider"
              type="range"
              min={20000}
              max={maxDatabasePrice}
              step={10000}
              value={maxPriceFilter}
              onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#E60012]"
            />
            <div className="flex justify-between text-[10px] text-slate-600 font-mono">
              <span>Mín: $20.000 COP</span>
              <span>Máx: {formatCurrency(maxDatabasePrice)}</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Availability Filter (multi-select) */}
      <div className="border-t border-slate-200 pt-4">
        <button
          type="button"
          aria-expanded={expandedSections.availability}
          aria-controls="filter-section-availability"
          onClick={() => toggleSection('availability')}
          className="w-full flex items-center justify-between py-1 text-xs font-extrabold uppercase tracking-wider text-slate-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] rounded"
        >
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" /> Disponibilidad
          </span>
          {expandedSections.availability ? <ChevronUp className="w-4 h-4 text-slate-500" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />}
        </button>

        {expandedSections.availability && (
          <div id="filter-section-availability" className="mt-3 space-y-1.5">
            {(['in_stock', 'international', 'on_order'] as const).map((status) => {
              const isChecked = availabilityFilter.has(status);
              const Icon =
                status === 'in_stock' ? CheckCircle2 :
                status === 'international' ? Globe : Clock;
              const tone =
                status === 'in_stock' ? 'text-emerald-600' :
                status === 'international' ? 'text-blue-600' :
                'text-amber-600';
              return (
                <label
                  key={status}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      const next = new Set(availabilityFilter);
                      if (isChecked) {
                        if (next.size > 1) next.delete(status);
                      } else {
                        next.add(status);
                      }
                      setAvailabilityFilter(next);
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-[#E60012] focus:ring-[#E60012] cursor-pointer accent-[#E60012]"
                    aria-label={`Mostrar ${AVAILABILITY_META[status].label}`}
                  />
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${tone}`} aria-hidden="true" />
                  <span className="text-xs font-semibold text-slate-700 flex-1">
                    {AVAILABILITY_META[status].label}
                  </span>
                </label>
              );
            })}
            {availabilityFilter.size < 3 && (
              <button
                type="button"
                onClick={() => setAvailabilityFilter(new Set<AvailabilityStatus>(['in_stock', 'international', 'on_order']))}
                className="mt-1 ml-1 text-[10px] font-bold text-[#E60012] hover:underline cursor-pointer"
              >
                Mostrar todas
              </button>
            )}
          </div>
        )}
      </div>

      {/* Reset Filters Action */}
      {activeFilterCount > 0 && (
        <div className="border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onResetFilters}
            className="w-full py-2.5 px-3 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Restablecer ({activeFilterCount}) Filtros</span>
          </button>
        </div>
      )}

    </div>
  );

  return (
    <>
      {/* Mobile Top Header & Filter Trigger */}
      <div className="lg:hidden mb-6 space-y-3">
        <div className="flex items-center gap-3">
          {/* Search Box on Mobile */}
          <div className="relative flex-1">
            <label htmlFor="mobile-catalog-search" className="sr-only">Buscar por nombre o referencia</label>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
            <input
              id="mobile-catalog-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o ref..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
            />
          </div>

          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="px-4 py-2.5 min-h-[44px] bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-2 shrink-0 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#E60012]" aria-hidden="true" />
            <span>Filtros</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#E60012] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-600 shrink-0">Activos:</span>
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 text-red-800 font-bold text-[11px] rounded-lg shrink-0">
                Cat: {categories.find(c => c.id === selectedCategory)?.label}
                <button type="button" aria-label="Remover filtro de categoría" onClick={() => setSelectedCategory('all')} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-100 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {onlyCompatible && activeMotorcycle && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-[11px] rounded-lg shrink-0">
                Compatible: {activeMotorcycle.modelName}
                <button type="button" aria-label="Remover filtro de compatibilidad" onClick={() => setOnlyCompatible(false)} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-emerald-100 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {availabilityFilter.size < 3 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 font-bold text-[11px] rounded-lg shrink-0">
                Disponibilidad filtrada
                <button type="button" aria-label="Restablecer filtro de disponibilidad" onClick={() => setAvailabilityFilter(new Set<AvailabilityStatus>(['in_stock', 'international', 'on_order']))} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-amber-100 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[11px] font-bold text-[#E60012] underline shrink-0 ml-1 cursor-pointer"
            >
              Limpiar todo
            </button>
          </div>
        )}
      </div>

      {/* Desktop Sticky Sidebar Layout */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs sticky top-24">
          
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#E60012]" aria-hidden="true" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                Filtros
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 font-mono">
                {filteredCount} {filteredCount === 1 ? 'part' : 'parts'}
              </span>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="text-[11px] font-bold text-[#E60012] hover:underline cursor-pointer"
                  title="Limpiar todos los filtros"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <FilterContent />

        </div>
      </aside>

      {/* Mobile Drawer Slide-Over */}
      {mobileFiltersOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-filter-title"
          className="fixed inset-0 z-50 lg:hidden flex"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 max-w-full flex z-10">
            <div className="w-screen max-w-xs bg-white shadow-2xl flex flex-col">
              
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#E60012]" aria-hidden="true" />
                  <h2 id="mobile-filter-title" className="text-sm font-bold uppercase tracking-wider">Filtros de Catálogo</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Cerrar filtros de catálogo"
                  className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-white rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <div className="p-5 flex-1 overflow-y-auto">
                <FilterContent />
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full py-3 min-h-[44px] bg-[#E60012] text-white font-bold text-xs rounded-xl shadow-sm uppercase tracking-wider cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                >
                  Ver ({filteredCount}) Resultados
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};
