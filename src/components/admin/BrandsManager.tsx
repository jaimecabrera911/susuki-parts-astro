import React, { useState } from 'react';
import { Building2, Plus, Edit, Trash2, Globe, CheckCircle2, XCircle } from 'lucide-react';
import type { Brand } from '../../types';
import { AdminSearchInput } from './AdminSearchInput';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

interface BrandsManagerProps {
  brands: Brand[];
  searchQuery: string;
  onAddBrand: () => void;
  onEditBrand: (brand: Brand) => void;
  onToggleActive: (id: string) => void;
  onDeleteBrand: (id: string) => void;
  isLoading?: boolean;
}

export const BrandsManager: React.FC<BrandsManagerProps> = ({
  brands,
  searchQuery,
  onAddBrand,
  onEditBrand,
  onToggleActive,
  onDeleteBrand,
  isLoading = false,
}) => {
  const [localSearch, setLocalSearch] = useState('');

  const activeQuery = (searchQuery || localSearch).trim().toLowerCase();

  const columns: DataTableColumn<Brand>[] = [
    {
      key: 'brand',
      label: 'Marca',
      minWidth: '220px',
      sortable: true,
      sortSelector: (b) => b.name,
      render: (brand) => (
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden p-1 shrink-0 shadow-xs">
            {brand.logo ? (
              <img
                src={brand.logo}
                alt={brand.name}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Building2 className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <p className="font-extrabold text-slate-900 group-hover:text-[#E60012] transition-colors font-display line-clamp-2">
            {brand.name}
          </p>
        </div>
      ),
    },
    {
      key: 'country',
      label: 'País Origen',
      minWidth: '140px',
      filterable: true,
      accessor: (b) => b.country || 'Japón',
      render: (brand) => (
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-700">{brand.country || 'Japón'}</span>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Descripción',
      minWidth: '200px',
      render: (brand) => (
        <span className="text-xs text-slate-500 max-w-xs truncate font-sans block">
          {brand.description || 'Sin descripción especificada.'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      minWidth: '110px',
      filterable: true,
      accessor: (b) => (b.active ? 'active' : 'inactive'),
      filterOptions: [
        { value: 'active', label: 'Activa' },
        { value: 'inactive', label: 'Inactiva' },
      ],
      render: (brand) => (
        <button
          onClick={() => onToggleActive(brand.id)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
            brand.active
              ? 'bg-emerald-50 text-[#059669] border-emerald-200 hover:bg-emerald-100'
              : 'bg-red-50 text-[#dc2626] border-red-200 hover:bg-red-100'
          }`}
        >
          {brand.active ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
              <span>Activa</span>
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5 text-[#dc2626]" />
              <span>Inactiva</span>
            </>
          )}
        </button>
      ),
    },
  ];

  const handleSearchFilter = (brand: Brand, query: string) =>
    brand.name.toLowerCase().includes(query) ||
    brand.id.toLowerCase().includes(query) ||
    (brand.country?.toLowerCase().includes(query) ?? false) ||
    (brand.description?.toLowerCase().includes(query) ?? false);

  return (
    <div id="brands-manager" className="space-y-6">
      {/* Action & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <AdminSearchInput
            value={localSearch}
            onChange={setLocalSearch}
            placeholder="Buscar por nombre, país o descripción..."
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-mono">
            <strong className="text-slate-900">{brands.length}</strong> marcas
          </span>
          <button
            onClick={onAddBrand}
            className="px-3.5 py-2 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Marca</span>
          </button>
        </div>
      </div>

      {/* Brands DataTable */}
      <DataTable
        data={brands}
        columns={columns}
        keyField="id"
        loading={isLoading}
        itemLabel="marcas"
        emptyMessage="No se encontraron marcas"
        emptySubMessage="Ajusta los términos de búsqueda o filtros."
        searchQuery={activeQuery}
        searchFilter={handleSearchFilter}
        actions={(brand) => (
          <>
            <button
              onClick={() => onEditBrand(brand)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Editar marca"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteBrand(brand.id)}
              className="p-2 rounded-xl text-slate-400 hover:text-[#dc2626] hover:bg-red-50 transition-colors cursor-pointer"
              title="Eliminar marca"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      />
    </div>
  );
};