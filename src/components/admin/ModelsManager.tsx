import React, { useState } from 'react';
import { Plus, Edit, Trash2, Copy, CheckCircle2, XCircle, Tag, Calendar, Layers, Eye } from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import type { Brand, SuzukiModel, ExplodedDiagram } from '../../types';
import { AdminSearchInput } from './AdminSearchInput';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

interface ModelsManagerProps {
  models: SuzukiModel[];
  brands: Brand[];
  schematics: ExplodedDiagram[];
  searchQuery: string;
  onAddModel: () => void;
  onEditModel: (model: SuzukiModel) => void;
  onViewModel?: (model: SuzukiModel) => void;
  onManageSchematics: (model: SuzukiModel) => void;
  onDuplicateModel: (model: SuzukiModel) => void;
  onToggleActive: (id: string) => void;
  onDeleteModel: (id: string) => void;
  isLoading?: boolean;
}

export const ModelsManager: React.FC<ModelsManagerProps> = ({
  models,
  brands,
  schematics,
  searchQuery,
  onAddModel,
  onEditModel,
  onViewModel,
  onManageSchematics,
  onDuplicateModel,
  onToggleActive,
  onDeleteModel,
  isLoading = false,
}) => {
  const [localSearch, setLocalSearch] = useState('');

  const activeQuery = (searchQuery || localSearch).trim().toLowerCase();

  const getBrandName = (model: SuzukiModel): string =>
    brands.find((b) => b.id === (model.brandId || 'suzuki'))?.name || 'Suzuki';

  const getLinkedCount = (model: SuzukiModel): number =>
    schematics.filter((s) => s.applicableModelIds?.includes(model.id)).length;

  const columns: DataTableColumn<SuzukiModel>[] = [
    {
      key: 'model',
      label: 'Modelo',
      minWidth: '250px',
      sortable: true,
      sortSelector: (m) => m.name,
      render: (model) => (
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden p-1 shrink-0 shadow-xs">
            {model.image ? (
              <img
                src={model.image}
                alt={model.name}
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <FaMotorcycle className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <p className="font-extrabold text-slate-900 group-hover:text-[#E60012] transition-colors font-display line-clamp-2">
            {model.name}
          </p>
        </div>
      ),
    },
    {
      key: 'brand',
      label: 'Marca',
      minWidth: '120px',
      filterable: true,
      filterOptions: brands.map((b) => ({ value: b.id, label: b.name })),
      render: (model) => {
        const brandName = getBrandName(model);
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-bold uppercase font-mono">
            {brandName}
          </span>
        );
      },
    },
    {
      key: 'category',
      label: 'Categoría',
      minWidth: '140px',
      filterable: true,
      accessor: (m) => m.category,
      render: (model) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 font-mono uppercase">
          <Tag className="w-3 h-3 text-[#0A3088]" />
          <span>{model.category}</span>
        </span>
      ),
    },
    {
      key: 'years',
      label: 'Años Compatibles',
      minWidth: '140px',
      sortable: true,
      sortSelector: (m) => Math.min(...(m.years || [2020])),
      render: (model) => {
        const minYear = Math.min(...(model.years || [2020]));
        const maxYear = Math.max(...(model.years || [2024]));
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-900 font-bold">
            <Calendar className="w-3.5 h-3.5 text-[#059669]" />
            <span>{minYear} - {maxYear}</span>
            <span className="text-[10px] text-slate-400 font-normal">
              ({model.years?.length || 0} años)
            </span>
          </div>
        );
      },
    },
    {
      key: 'versions',
      label: 'Versiones',
      minWidth: '160px',
      render: (model) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {model.versions?.slice(0, 2).map((v) => (
            <span
              key={v}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700 font-medium truncate"
            >
              {v}
            </span>
          ))}
          {(model.versions?.length || 0) > 2 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono font-bold">
              +{(model.versions?.length || 0) - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'schematics',
      label: 'Despieces',
      minWidth: '120px',
      sortable: true,
      sortSelector: (m) => getLinkedCount(m),
      render: (model) => {
        const count = getLinkedCount(model);
        return (
          <button
            onClick={() => onManageSchematics(model)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
            title="Gestionar despieces de este modelo"
          >
            <Layers className="w-3.5 h-3.5 text-[#d97706]" />
            <span>{count} {count === 1 ? 'despiece' : 'despieces'}</span>
          </button>
        );
      },
    },
    {
      key: 'status',
      label: 'Estado',
      minWidth: '140px',
      filterable: true,
      accessor: (m) => (m.active !== false ? 'active' : 'inactive'),
      filterOptions: [
        { value: 'active', label: 'Activo' },
        { value: 'inactive', label: 'Inactivo' },
      ],
      render: (model) => {
        const isActive = model.active !== false;
        return (
          <button
            onClick={() => onToggleActive(model.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              isActive
                ? 'bg-emerald-50 text-[#059669] border-emerald-200 hover:bg-emerald-100'
                : 'bg-red-50 text-[#dc2626] border-red-200 hover:bg-red-100'
            }`}
          >
            {isActive ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                <span>Activo</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-[#dc2626]" />
                <span>Inactivo</span>
              </>
            )}
          </button>
        );
      },
    },
  ];

  const handleSearchFilter = (model: SuzukiModel, query: string) => {
    const brandName = getBrandName(model).toLowerCase();
    return (
      model.name.toLowerCase().includes(query) ||
      model.id.toLowerCase().includes(query) ||
      brandName.includes(query) ||
      model.category.toLowerCase().includes(query)
    );
  };

  return (
    <div id="models-manager" className="space-y-6">
      {/* Action & Search Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <AdminSearchInput
            value={localSearch}
            onChange={setLocalSearch}
            placeholder="Buscar por nombre, marca o categoría..."
          />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <span className="text-xs text-slate-500 font-mono">
            <strong className="text-slate-900">{models.length}</strong> modelos
          </span>
          <button
            onClick={onAddModel}
            className="px-3.5 py-2 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Modelo</span>
          </button>
        </div>
      </div>

      {/* Models DataTable */}
      <DataTable
        data={models}
        columns={columns}
        keyField="id"
        loading={isLoading}
        itemLabel="modelos"
        emptyMessage="No se encontraron modelos"
        emptySubMessage="Filtra por marca o categoría."
        searchQuery={activeQuery}
        searchFilter={handleSearchFilter}
        actionsMinWidth="200px"
        actions={(model) => (
          <>
            {onViewModel && (
              <button
                onClick={() => onViewModel(model)}
                className="p-2 rounded-xl text-slate-500 hover:text-[#059669] hover:bg-emerald-50 transition-colors cursor-pointer"
                title="Ver detalle del modelo"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onManageSchematics(model)}
              className="p-2 rounded-xl text-slate-500 hover:text-[#d97706] hover:bg-amber-50 transition-colors cursor-pointer"
              title="Gestionar despieces"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDuplicateModel(model)}
              className="p-2 rounded-xl text-slate-500 hover:text-[#0A3088] hover:bg-blue-50 transition-colors cursor-pointer"
              title="Duplicar modelo"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEditModel(model)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Editar modelo"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteModel(model.id)}
              className="p-2 rounded-xl text-slate-400 hover:text-[#dc2626] hover:bg-red-50 transition-colors cursor-pointer"
              title="Eliminar modelo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      />
    </div>
  );
};