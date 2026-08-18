import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ArrowRightLeft,
  Globe,
  Clock
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { ActiveMotorcycle, SuzukiPart, AvailabilityStatus, SuzukiModel, Category } from '../types';
import { AVAILABILITY_META } from '../types';
import { getMotorcyclePng } from '../data/motorcycleImages';
import { formatCurrency, formatThousands } from '../utils/formatCurrency';
import motoLoadImg from '../assets/moto-load.webp';

const motoLoadUrl = typeof motoLoadImg === 'string' ? motoLoadImg : (motoLoadImg?.src || '/src/assets/moto-load.webp');

interface CatalogSidebarFilterProps {
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onlyCompatible: boolean;
  setOnlyCompatible: (val: boolean) => void;
  availabilityFilter: Set<AvailabilityStatus>;
  setAvailabilityFilter: (filter: Set<AvailabilityStatus>) => void;
  maxPriceFilter: number;
  setMaxPriceFilter: (price: number) => void;
  minPriceFilter: number;
  setMinPriceFilter: (price: number) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeMotorcycle: ActiveMotorcycle | null;
  onOpenGarageModal: () => void;
  allParts: SuzukiPart[];
  filteredCount: number;
  onResetFilters: () => void;
  models?: SuzukiModel[];
  isLoading?: boolean;
}

export const CatalogSidebarFilter: React.FC<CatalogSidebarFilterProps> = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  onlyCompatible,
  setOnlyCompatible,
  availabilityFilter,
  setAvailabilityFilter,
  maxPriceFilter,
  setMaxPriceFilter,
  minPriceFilter,
  setMinPriceFilter,
  sortBy,
  setSortBy,
  searchQuery,
  setSearchQuery,
  activeMotorcycle,
  onOpenGarageModal,
  allParts,
  filteredCount,
  onResetFilters,
  models,
  isLoading = false
}) => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    vehicle: true,
    category: true,
    price: true,
    availability: true
  });
  const [expandedParentCategories, setExpandedParentCategories] = useState<Set<string>>(new Set());

  const toggleParentCategory = (catId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedParentCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

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

  // Find max/min possible price in database
  const highestPriceInParts = allParts.length > 0 ? Math.max(...allParts.map(p => p.price)) : 5000000;
  const maxDatabasePrice = Math.max(highestPriceInParts, 5000000);
  const minDatabasePrice = 0;

  // Custom dual-range slider state & helpers
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<'min' | 'max' | null>(null);
  const minPriceRef = useRef(minPriceFilter);
  const maxPriceRef = useRef(maxPriceFilter);
  minPriceRef.current = minPriceFilter;
  maxPriceRef.current = maxPriceFilter;
  const range = maxDatabasePrice - minDatabasePrice;
  const minPercent = ((minPriceFilter - minDatabasePrice) / range) * 100;
  const maxPercent = ((maxPriceFilter - minDatabasePrice) / range) * 100;

  const getPriceFromPosition = useCallback(
    (clientX: number): number => {
      const track = trackRef.current;
      if (!track) return minDatabasePrice;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const raw = minDatabasePrice + ratio * range;
      const stepped = Math.round(raw / 10000) * 10000;
      return Math.max(minDatabasePrice, Math.min(maxDatabasePrice, stepped));
    },
    [minDatabasePrice, maxDatabasePrice, range]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, handle: 'min' | 'max') => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = handle;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const price = getPriceFromPosition(e.clientX);
    if (draggingRef.current === 'min') {
      setMinPriceFilter(Math.min(price, maxPriceFilter - 10000));
    } else {
      setMaxPriceFilter(Math.max(price, minPriceFilter + 10000));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) return;
    const price = getPriceFromPosition(e.clientX);
    const distToMin = Math.abs(price - minPriceFilter);
    const distToMax = Math.abs(price - maxPriceFilter);
    if (distToMin <= distToMax) {
      setMinPriceFilter(Math.min(price, maxPriceFilter - 10000));
    } else {
      setMaxPriceFilter(Math.max(price, minPriceFilter + 10000));
    }
  };

  // Global pointer listeners — keeps drag fluid even when cursor leaves the track
  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const price = getPriceFromPosition(e.clientX);
      if (draggingRef.current === 'min') {
        setMinPriceFilter(Math.min(price, maxPriceRef.current - 10000));
      } else {
        setMaxPriceFilter(Math.max(price, minPriceRef.current + 10000));
      }
    };
    const onUp = () => {
      draggingRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [getPriceFromPosition]);

  // Editable min/max price inputs (clamped to the valid range)
  const [minPriceInput, setMinPriceInput] = useState<string>(formatThousands(minPriceFilter));
  const [maxPriceInput, setMaxPriceInput] = useState<string>(formatThousands(maxPriceFilter));

  useEffect(() => {
    setMinPriceInput(formatThousands(minPriceFilter));
  }, [minPriceFilter]);

  useEffect(() => {
    setMaxPriceInput(formatThousands(maxPriceFilter));
  }, [maxPriceFilter]);

  const commitMinPrice = () => {
    const digits = minPriceInput.replace(/\D/g, '');
    if (digits === '') {
      setMinPriceInput(formatThousands(minPriceFilter));
      return;
    }
    const num = Number(digits);
    const clamped = Math.min(Math.max(num, minDatabasePrice), maxPriceFilter - 10000);
    setMinPriceFilter(clamped);
  };

  const commitMaxPrice = () => {
    const digits = maxPriceInput.replace(/\D/g, '');
    if (digits === '') {
      setMaxPriceInput(formatThousands(maxPriceFilter));
      return;
    }
    const num = Number(digits);
    const clamped = Math.max(Math.min(num, maxDatabasePrice), minPriceFilter + 10000);
    setMaxPriceFilter(clamped);
  };

  const getRelevantModelParts = () => {
    return allParts.filter(part => {
      // Filter by active motorcycle in garage if compatibility toggle is active
      if (onlyCompatible && activeMotorcycle) {
        const isCompatible = part.compatibility.some(c => {
          if (c.modelId !== activeMotorcycle.modelId) return false;
          if ((c.yearStart && activeMotorcycle.year < c.yearStart) || (c.yearEnd && activeMotorcycle.year > c.yearEnd)) return false;
          if (c.version && c.version !== activeMotorcycle.version) return false;
          return true;
        });
        if (!isCompatible) return false;
      }

      return true;
    });
  };

  const getCategoryAndSubcategorySlugs = (catId: string): string[] => {
    if (catId === 'all') return [];
    const foundCat = categories.find(c => c.slug === catId);
    if (!foundCat) return [catId];
    const slugs = [foundCat.slug];
    if (foundCat.subcategories) {
      foundCat.subcategories.forEach(sub => {
        slugs.push(sub.slug);
      });
    }
    return slugs;
  };

  const getCategoryCount = (catId: string) => {
    const relevantParts = getRelevantModelParts();
    if (catId === 'all') return relevantParts.length;
    const slugs = getCategoryAndSubcategorySlugs(catId);
    return relevantParts.filter(p => slugs.includes(p.category)).length;
  };

  const getSelectedCategoryName = (): string => {
    if (selectedCategory === 'all') return 'Todos';
    for (const cat of categories) {
      if (cat.slug === selectedCategory) return cat.name;
      if (cat.subcategories) {
        const sub = cat.subcategories.find(s => s.slug === selectedCategory);
        if (sub) return sub.name;
      }
    }
    return selectedCategory;
  };

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (onlyCompatible && activeMotorcycle ? 1 : 0) +
    (availabilityFilter.size < 3 ? 1 : 0) +
    (minPriceFilter > minDatabasePrice || maxPriceFilter < maxDatabasePrice ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const availableModels = models || [];
  const activeModelMeta = activeMotorcycle
    ? availableModels.find((m) =>
        m.id === activeMotorcycle.modelId ||
        m.id.toLowerCase().replace(/[^a-z0-9]/g, '') === activeMotorcycle.modelId.toLowerCase().replace(/[^a-z0-9]/g, '') ||
        m.name.toLowerCase().includes(activeMotorcycle.modelName.toLowerCase()) ||
        activeMotorcycle.modelName.toLowerCase().includes(m.name.toLowerCase())
      )
    : null;
  const activeMotoImage = activeModelMeta?.image || (activeMotorcycle ? getMotorcyclePng(activeMotorcycle.modelId) : '');

  const filterContent = (
    <div className="space-y-6">
      
      {/* 1. Vehicle Context — Active Garage Card */}
      <div className="group relative overflow-hidden rounded-2xl bg-[#0a1628] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.55)]">
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
          <div id="filter-section-category" className="mt-3 space-y-1.5">
            {/* Todos los repuestos */}
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`w-full flex items-center justify-between px-3 py-2 min-h-[36px] rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
                selectedCategory === 'all'
                  ? 'bg-[#E60012] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <Layers className={`w-3.5 h-3.5 shrink-0 ${selectedCategory === 'all' ? 'text-white' : 'text-slate-500'}`} aria-hidden="true" />
                <span className="truncate">Todos los Repuestos</span>
              </span>
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {getCategoryCount('all')}
              </span>
            </button>

            {/* Categorías dinámicas */}
            {categories.map((cat) => {
              const count = getCategoryCount(cat.slug);
              const isSelected = selectedCategory === cat.slug;
              const hasSubcategories = !!(cat.subcategories && cat.subcategories.length > 0);
              const isChildSelected = hasSubcategories && (cat.subcategories?.some(sub => sub.slug === selectedCategory) ?? false);
              const isExpanded = expandedParentCategories.has(cat.id) || isChildSelected;
              const IconComp = (LucideIcons as any)[cat.iconName || 'Wrench'] || LucideIcons.Wrench;

              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`flex-1 flex items-center justify-between px-3 py-2 min-h-[36px] rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
                        isSelected
                          ? 'bg-[#E60012] text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <IconComp className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} aria-hidden="true" />
                        <span className="truncate">{cat.name}</span>
                      </span>
                      <span
                        className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {count}
                      </span>
                    </button>

                    {hasSubcategories && (
                      <button
                        type="button"
                        aria-label={`${isExpanded ? 'Contraer' : 'Expandir'} subcategorías de ${cat.name}`}
                        onClick={(e) => toggleParentCategory(cat.id, e)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer shrink-0 ${
                          isSelected
                            ? 'text-slate-600 hover:bg-slate-100'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Subcategorías anidadas (contraídas por defecto) */}
                  {hasSubcategories && isExpanded && (
                    <div className="pl-6 space-y-1 border-l-2 border-slate-200 ml-4 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      {cat.subcategories?.map((sub) => {
                        const subCount = getCategoryCount(sub.slug);
                        const isSubSelected = selectedCategory === sub.slug;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setSelectedCategory(sub.slug)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 min-h-[28px] rounded-lg text-[11px] font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
                              isSubSelected
                                ? 'bg-red-50 text-[#E60012] font-bold border-l-2 border-[#E60012] rounded-l-none'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            <span className="truncate">{sub.name}</span>
                            <span
                              className={`ml-2 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                                isSubSelected ? 'bg-red-100 text-[#E60012]' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {subCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Price Range — Dual Slider con Histograma y Presets */}
      <div className="border-t border-slate-200 pt-4">
        <button
          type="button"
          aria-expanded={expandedSections.price}
          aria-controls="filter-section-price"
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between py-1 text-xs font-extrabold uppercase tracking-wider text-slate-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] rounded"
        >
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" /> Rango de Precio
          </span>
          {(minPriceFilter > minDatabasePrice || maxPriceFilter < maxDatabasePrice) && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#E60012] text-white text-[10px] font-extrabold">
              {allParts.filter(p => p.price >= minPriceFilter && p.price <= maxPriceFilter).length}
            </span>
          )}
          {expandedSections.price ? <ChevronUp className="w-4 h-4 text-slate-500" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />}
        </button>

        {expandedSections.price && (
          <div id="filter-section-price" className="mt-3 space-y-3.5">
            {/* Current Range — editable inputs */}
            <div className="flex items-stretch justify-between gap-2">
              <div className="flex-1 min-w-0">
                <label htmlFor="sidebar-min-price" className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 text-center">
                  Mínimo
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">$</span>
                  <input
                    id="sidebar-min-price"
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value.replace(/\D/g, ''))}
                    onFocus={(e) => setMinPriceInput(e.target.value.replace(/\D/g, ''))}
                    onBlur={commitMinPrice}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                    aria-label="Precio mínimo"
                    className="w-full bg-white border border-slate-200 rounded-lg pl-6 pr-2 py-2 font-mono text-xs font-black text-slate-900 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 transition-all text-center"
                  />
                </div>
              </div>

              <div className="w-px bg-slate-300 my-5" />

              <div className="flex-1 min-w-0">
                <label htmlFor="sidebar-max-price" className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 text-center">
                  Máximo
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">$</span>
                  <input
                    id="sidebar-max-price"
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value.replace(/\D/g, ''))}
                    onFocus={(e) => setMaxPriceInput(e.target.value.replace(/\D/g, ''))}
                    onBlur={commitMaxPrice}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                    aria-label="Precio máximo"
                    className="w-full bg-white border border-slate-200 rounded-lg pl-6 pr-2 py-2 font-mono text-xs font-black text-[#E60012] focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 transition-all text-center"
                  />
                </div>
              </div>
            </div>

            {/* Dual Range Slider — Custom implementation for fluid dragging */}
            <div
              ref={trackRef}
              onPointerDown={handleTrackPointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative h-10 select-none touch-none cursor-pointer"
            >
              {/* Track base */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 bg-slate-200 rounded-full pointer-events-none" />
              {/* Active range */}
              <div
                className="absolute top-1/2 -translate-y-1/2 h-2 bg-[#E60012] rounded-full pointer-events-none"
                style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
                aria-hidden="true"
              />

              {/* Min thumb */}
              <div
                role="slider"
                tabIndex={0}
                aria-label="Precio mínimo"
                aria-valuemin={minDatabasePrice}
                aria-valuemax={maxPriceFilter - 10000}
                aria-valuenow={minPriceFilter}
                aria-valuetext={formatCurrency(minPriceFilter)}
                onPointerDown={(e) => handlePointerDown(e, 'min')}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white border-[2.5px] border-[#E60012] rounded-full cursor-grab active:cursor-grabbing shadow-[0_2px_10px_rgba(230,0,18,0.4)] hover:scale-110 active:scale-105 transition-transform z-20"
                style={{ left: `${minPercent}%` }}
              />

              {/* Max thumb */}
              <div
                role="slider"
                tabIndex={0}
                aria-label="Precio máximo"
                aria-valuemin={minPriceFilter + 10000}
                aria-valuemax={maxDatabasePrice}
                aria-valuenow={maxPriceFilter}
                aria-valuetext={formatCurrency(maxPriceFilter)}
                onPointerDown={(e) => handlePointerDown(e, 'max')}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white border-[2.5px] border-[#E60012] rounded-full cursor-grab active:cursor-grabbing shadow-[0_2px_10px_rgba(230,0,18,0.4)] hover:scale-110 active:scale-105 transition-transform z-20"
                style={{ left: `${maxPercent}%` }}
              />
            </div>

            {/* Reset Button */}
            {(minPriceFilter > minDatabasePrice || maxPriceFilter < maxDatabasePrice) && (
              <button
                type="button"
                onClick={() => {
                  setMinPriceFilter(minDatabasePrice);
                  setMaxPriceFilter(maxDatabasePrice);
                }}
                className="w-full text-[10px] font-bold text-slate-500 hover:text-[#E60012] transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
              >
                Restablecer rango
              </button>
            )}
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
            <span>Limpiar ({activeFilterCount}) Filtros</span>
          </button>
        </div>
      )}

    </div>
  );

  return (
    <div id="catalog-sidebar-filter">
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
                Cat: {getSelectedCategoryName()}
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
                <button type="button" aria-label="Limpiar filtro de disponibilidad" onClick={() => setAvailabilityFilter(new Set<AvailabilityStatus>(['in_stock', 'international', 'on_order']))} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-amber-100 cursor-pointer">
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

          {filterContent}

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
{filterContent}
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
    </div>
  );
};
