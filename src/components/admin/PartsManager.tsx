import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Copy, Tag, Layers } from 'lucide-react';
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
  onDeletePart: (id: string) => void;
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
  onDeletePart,
  isLoading = false,
}) => {
  // Local search (independent from the global header search)
  const [localSearch, setLocalSearch] = useState('');

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
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden p-1 shrink-0 shadow-xs">
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
          </div>
          <p className="font-extrabold text-slate-900 group-hover:text-[#E60012] transition-colors font-display line-clamp-2">
            {part.name}
          </p>
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
      label: 'Precio',
      minWidth: '120px',
      filterable: true,
      ranges: [{ label: 'Precio', value: (part) => part.price }],
      sortable: true,
      sortSelector: (part) => part.price,
      render: (part) => (
        <span className="font-black font-mono text-xs text-[#E60012]">{formatCurrency(part.price)}</span>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      minWidth: '100px',
      filterable: true,
      ranges: [{ label: 'Stock', value: (part) => part.stock }],
      sortable: true,
      sortSelector: (part) => part.stock,
      render: (part) => (
        <span className={`font-mono text-xs font-black ${part.stock > 0 ? 'text-[#059669]' : 'text-[#dc2626]'}`}>
          {part.stock} un.
        </span>
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
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <span className="text-xs text-slate-500 font-mono">
            <strong className="text-slate-900">{parts.length}</strong> repuestos en catálogo
          </span>
          <button
            onClick={onAddPart}
            className="px-3.5 py-2 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Repuesto</span>
          </button>
        </div>
      </div>

      {/* Parts DataTable with per-column dynamic filters */}
      <DataTable
        data={parts}
        columns={columns}
        keyField="id"
        loading={isLoading}
        itemLabel="repuestos"
        searchQuery={activeQuery}
        searchFilter={handleSearchFilter}
        actions={(part) => (
          <>
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