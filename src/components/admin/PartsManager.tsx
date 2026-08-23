import React, { useState } from 'react';
import { Package, Plus, Edit, Trash2, Copy, Tag, Layers, Eye, EyeOff, CheckCircle2, XCircle, Boxes } from 'lucide-react';
import type { SuzukiPart, SuzukiModel, Category } from '../../types';
import { AVAILABILITY_META, getPrimaryOem } from '../../types';
import { AdminSearchInput } from './AdminSearchInput';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

interface PartsManagerProps {
  parts: SuzukiPart[];
  models: SuzukiModel[];
  categories: Category[];
  searchQuery: string;
  onAddPart: () => void;
  onEditPart: (part: SuzukiPart) => void;
  onDuplicatePart: (part: SuzukiPart) => void;
  onToggleAvailability: (id: string) => void;
  onToggleActive?: (part: SuzukiPart) => void;
  onDeletePart: (id: string) => void;
  onViewKardex?: (part: SuzukiPart) => void;
  isLoading?: boolean;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

export const PartsManager: React.FC<PartsManagerProps> = ({
  parts,
  models,
  categories,
  searchQuery,
  onAddPart,
  onEditPart,
  onDuplicatePart,
  onToggleAvailability,
  onToggleActive,
  onDeletePart,
  onViewKardex,
  isLoading = false,
}) => {
  // Local search (independent from the global header search)
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const getCategoryLabel = (slug: string) => {
    for (const cat of categories) {
      if (cat.slug === slug) return cat.name;
      if (cat.subcategories) {
        const sub = cat.subcategories.find(s => s.slug === slug);
        if (sub) return `${cat.name} — ${sub.name}`;
      }
    }
    return slug;
  };

  const activeCount = parts.filter((p) => p.active !== false).length;
  const inactiveCount = parts.filter((p) => p.active === false).length;

  const filteredParts = parts.filter((p) => {
    if (statusFilter === 'active') return p.active !== false;
    if (statusFilter === 'inactive') return p.active === false;
    return true;
  });

  const activeQuery = (searchQuery || localSearch).trim().toLowerCase();

  const columns: DataTableColumn<SuzukiPart>[] = [
    {
      key: 'name',
      label: 'Repuesto',
      minWidth: '280px',
      sortable: true,
      sortSelector: (part) => part.name,
      render: (part) => (
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center overflow-hidden p-1 shrink-0 shadow-xs relative ${
            part.active === false ? 'bg-slate-100 border-slate-300 opacity-60' : 'bg-slate-50 border-slate-200'
          }`}>
            {part.image ? (
              <img
                src={part.image}
                alt={part.name}
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Package className="w-6 h-6 text-slate-400" />
            )}
            {part.active === false && (
              <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px] flex items-center justify-center">
                <EyeOff className="w-4 h-4 text-white drop-shadow-md" />
              </div>
            )}
          </div>
          <div>
            <p className={`font-extrabold transition-colors font-display line-clamp-2 ${
              part.active === false ? 'text-slate-500 line-through' : 'text-slate-900 group-hover:text-[#E60012]'
            }`}>
              {part.name}
            </p>
            {part.active === false && (
              <span className="inline-block mt-0.5 text-[10px] font-mono font-bold text-slate-400 uppercase">
                (Oculto en tienda)
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'sku',
      label: 'SKU',
      minWidth: '140px',
      render: (part) => (
        <span className="font-mono text-xs font-bold text-[#0A3088]">{part.sku || `SKU-${part.id}`}</span>
      ),
    },
    {
      key: 'oem',
      label: 'Ref. OEM Principal',
      minWidth: '160px',
      render: (part) => (
        <div className="font-mono text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg inline-block">
          {getPrimaryOem(part)}
        </div>
      ),
    },
    {
      key: 'active',
      label: 'Estado Tienda',
      minWidth: '140px',
      filterable: true,
      accessor: (part) => (part.active !== false ? 'active' : 'inactive'),
      filterLabel: (value) => (value === 'active' ? 'Activos' : 'Inactivos'),
      render: (part) => {
        const isActive = part.active !== false;
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleActive?.(part)}
              className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
              }`}
              title={isActive ? 'Repuesto visible en catálogo. Clic para deshabilitar.' : 'Repuesto oculto. Clic para activar.'}
            >
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{isActive ? 'Activo' : 'Inactivo'}</span>
            </button>
          </div>
        );
      },
    },
    {
      key: 'category',
      label: 'Categoría',
      minWidth: '160px',
      filterable: true,
      accessor: (part) => part.category,
      filterLabel: (value) => getCategoryLabel(value),
      render: (part) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 font-mono uppercase">
          <Tag className="w-3 h-3 text-[#0A3088]" />
          <span>{getCategoryLabel(part.category)}</span>
        </span>
      ),
    },
    {
      key: 'price',
      label: 'Precio / Costo',
      minWidth: '130px',
      filterable: true,
      ranges: [{ label: 'Precio', value: (part) => part.price }],
      sortable: true,
      sortSelector: (part) => part.price,
      render: (part) => (
        <div className="flex flex-col">
          <span className="font-black font-mono text-xs text-[#E60012]">{formatCurrency(part.price)}</span>
          {part.cost !== undefined && part.cost > 0 && (
            <span className="font-mono text-[10px] text-slate-400 font-semibold" title="Costo Promedio Ponderado">
              Costo: {formatCurrency(part.cost)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      minWidth: '110px',
      filterable: true,
      ranges: [{ label: 'Stock', value: (part) => part.stock }],
      sortable: true,
      sortSelector: (part) => part.stock,
      render: (part) => (
        <div className="flex items-center gap-1.5">
          <span className={`font-mono text-xs font-black ${part.stock > 0 ? 'text-[#059669]' : 'text-[#dc2626]'}`}>
            {part.stock} un.
          </span>
          {onViewKardex && (
            <button
              type="button"
              onClick={() => onViewKardex(part)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Ver movimientos en Kardex"
            >
              <Boxes className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'availability',
      label: 'Disponibilidad',
      minWidth: '140px',
      filterable: true,
      accessor: (part) => part.availability || (part.stock > 0 ? 'in_stock' : 'on_order'),
      filterLabel: (value) => AVAILABILITY_META[value as keyof typeof AVAILABILITY_META]?.label ?? value,
      render: (part) => {
        const statusKey = part.availability || (part.stock > 0 ? 'in_stock' : 'on_order');
        const meta = AVAILABILITY_META[statusKey];
        return (
          <button
            onClick={() => onToggleAvailability(part.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            <span>{meta.shortLabel}</span>
          </button>
        );
      },
    },
    {
      key: 'compatibility',
      label: 'Motos Compatibles',
      minWidth: '140px',
      filterable: true,
      filterOptions: models.map((m) => ({ value: m.id, label: m.name })),
      filterMatcher: (part, value) => part.compatibility.some((c) => c.modelId === value),
      render: (part) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold font-mono">
          <Layers className="w-3.5 h-3.5 text-[#059669]" />
          <span>{part.compatibility?.length || 0} modelos</span>
        </div>
      ),
    },
  ];

  const handleSearchFilter = (part: SuzukiPart, query: string) => {
    const primaryOem = getPrimaryOem(part);
    return (
      part.name.toLowerCase().includes(query) ||
      part.id.toLowerCase().includes(query) ||
      (part.sku?.toLowerCase().includes(query) ?? false) ||
      primaryOem.toLowerCase().includes(query) ||
      part.oemNumbers.some((oem) => oem.toLowerCase().includes(query))
    );
  };

  return (
    <div id="parts-manager" className="space-y-6">
      {/* Action & Search Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <AdminSearchInput
            value={localSearch}
            onChange={setLocalSearch}
            placeholder="Buscar por nombre, ref. OEM o SKU..."
          />

          {/* Quick Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Todos ({parts.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>Activos ({activeCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>Inactivos ({inactiveCount})</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <button
            onClick={onAddPart}
            className="px-3.5 py-2 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Repuesto</span>
          </button>
        </div>
      </div>

      {/* Parts DataTable with per-column dynamic filters */}
      <DataTable
        data={filteredParts}
        columns={columns}
        keyField="id"
        loading={isLoading}
        itemLabel="repuestos"
        searchQuery={activeQuery}
        searchFilter={handleSearchFilter}
        actions={(part) => (
          <>
            {onViewKardex && (
              <button
                onClick={() => onViewKardex(part)}
                className="p-2 rounded-xl text-slate-500 hover:text-[#E60012] hover:bg-red-50 transition-colors cursor-pointer"
                title="Ver movimientos en Kardex"
              >
                <Boxes className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onDuplicatePart(part)}
              className="p-2 rounded-xl text-slate-500 hover:text-[#0A3088] hover:bg-blue-50 transition-colors cursor-pointer"
              title="Duplicar repuesto"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEditPart(part)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Editar repuesto"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeletePart(part.id)}
              className="p-2 rounded-xl text-slate-400 hover:text-[#dc2626] hover:bg-red-50 transition-colors cursor-pointer"
              title="Eliminar repuesto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      />
    </div>
  );
};