import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Copy, CheckCircle2, XCircle, Tag, Calendar, Layers, Eye } from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import type { Brand, SuzukiModel, ExplodedDiagram } from '../../types';
import { AdminPagination } from './AdminPagination';
import { AdminFilterBar, FilterResetButton } from './AdminFilterBar';
import { AdminSearchInput } from './AdminSearchInput';

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
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Local search (independent from the global header search)
  const [localSearch, setLocalSearch] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to first page whenever filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, localSearch, selectedBrandFilter, selectedCategoryFilter, selectedStatusFilter]);

  const categories = Array.from(new Set(models.map(m => m.category))).filter(Boolean);

  const activeQuery = (searchQuery || localSearch).trim().toLowerCase();

  const filteredModels = models.filter(m => {
    const brandName = brands.find(b => b.id === m.brandId)?.name || 'Suzuki';
    const matchesSearch =
      m.name.toLowerCase().includes(activeQuery) ||
      m.id.toLowerCase().includes(activeQuery) ||
      brandName.toLowerCase().includes(activeQuery) ||
      m.category.toLowerCase().includes(activeQuery);

    const matchesBrand = selectedBrandFilter === 'all' || (m.brandId || 'suzuki') === selectedBrandFilter;
    const matchesCategory = selectedCategoryFilter === 'all' || m.category === selectedCategoryFilter;
    const matchesStatus =
      selectedStatusFilter === 'all' ||
      (selectedStatusFilter === 'active' && m.active !== false) ||
      (selectedStatusFilter === 'inactive' && m.active === false);

    return matchesSearch && matchesBrand && matchesCategory && matchesStatus;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredModels.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredModels.length);
  const paginatedModels = filteredModels.slice(startIndex, endIndex);

  // Dynamic filter options (derived from live data)
  const brandOptions = [
    { value: 'all', label: 'Todas las Marcas' },
    ...brands.map(b => ({ value: b.id, label: b.name })),
  ];

  const categoryOptions = [
    { value: 'all', label: 'Todas las Categorías' },
    ...categories.map(c => ({ value: c, label: c })),
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'active', label: 'Solo Activos' },
    { value: 'inactive', label: 'Solo Inactivos' },
  ];

  const handleResetFilters = () => {
    setSelectedBrandFilter('all');
    setSelectedCategoryFilter('all');
    setSelectedStatusFilter('all');
    setLocalSearch('');
  };

  return (
    <div id="models-manager" className="space-y-6">
      {/* Action & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <AdminFilterBar
            filters={[
              { key: 'brand', label: 'Marca', options: brandOptions, value: selectedBrandFilter, onChange: setSelectedBrandFilter },
              { key: 'category', label: 'Categoría', options: categoryOptions, value: selectedCategoryFilter, onChange: setSelectedCategoryFilter },
              { key: 'status', label: 'Estado', options: statusOptions, value: selectedStatusFilter, onChange: (v) => setSelectedStatusFilter(v as any) },
            ]}
          />
          <FilterResetButton onClick={handleResetFilters} />
          <AdminSearchInput
            value={localSearch}
            onChange={setLocalSearch}
            placeholder="Buscar por nombre, marca o categoría..."
          />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <span className="text-xs text-slate-500 font-mono">
            {filteredModels.length} de <strong className="text-slate-900">{models.length}</strong> modelos
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

      {/* Models Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                <th className="py-3.5 px-5">Modelo / Marca</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4">Años Compatibles</th>
                <th className="py-3.5 px-4">Versiones</th>
                <th className="py-3.5 px-4">Despieces</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {paginatedModels.map((model) => {
                const brand = brands.find(b => b.id === (model.brandId || 'suzuki'));
                const minYear = Math.min(...(model.years || [2020]));
                const maxYear = Math.max(...(model.years || [2024]));
                const isActive = model.active !== false;

                // Count linked schematics
                const linkedCount = schematics.filter(s => s.applicableModelIds && s.applicableModelIds.includes(model.id)).length;

                return (
                  <tr
                    key={model.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Model Name & Image */}
                    <td className="py-4 px-5">
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
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-extrabold text-slate-900 group-hover:text-[#E60012] transition-colors font-display">
                              {model.name}
                            </p>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-bold uppercase font-mono">
                              {brand?.name || 'Suzuki'}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-slate-400 font-bold">REF: {model.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category Tag */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 font-mono uppercase">
                        <Tag className="w-3 h-3 text-[#0A3088]" />
                        <span>{model.category}</span>
                      </span>
                    </td>

                    {/* Years Range (Geist Mono) */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-slate-900 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-[#059669]" />
                        <span>{minYear} - {maxYear}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({model.years?.length || 0} años)
                        </span>
                      </div>
                    </td>

                    {/* Versions tags */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {model.versions?.slice(0, 2).map(v => (
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
                    </td>

                    {/* Schematics Column & Action */}
                    <td className="py-4 px-4">
                      <button
                        onClick={() => onManageSchematics(model)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                        title="Gestionar despieces de este modelo"
                      >
                        <Layers className="w-3.5 h-3.5 text-[#d97706]" />
                        <span>{linkedCount} {linkedCount === 1 ? 'despiece' : 'despieces'}</span>
                      </button>
                    </td>

                    {/* Traffic Light Status Badge */}
                    <td className="py-4 px-4">
                      <button
                        onClick={() => onToggleActive(model.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all ${
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
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onViewModel && (
                          <button
                            onClick={() => onViewModel(model)}
                            className="p-2 rounded-xl text-slate-500 hover:text-[#059669] hover:bg-emerald-50 transition-colors"
                            title="Ver detalle del modelo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onManageSchematics(model)}
                          className="p-2 rounded-xl text-slate-500 hover:text-[#d97706] hover:bg-amber-50 transition-colors"
                          title="Gestionar despieces de esta moto"
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDuplicateModel(model)}
                          className="p-2 rounded-xl text-slate-500 hover:text-[#0A3088] hover:bg-blue-50 transition-colors"
                          title="Duplicar modelo"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditModel(model)}
                          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Editar modelo"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteModel(model.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-[#dc2626] hover:bg-red-50 transition-colors"
                          title="Eliminar modelo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-8 h-8 border-3 border-[#E60012] border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-mono font-bold text-slate-600 animate-pulse">Cargando modelos...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredModels.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FaMotorcycle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-800">No se encontraron modelos</p>
                    <p className="text-xs text-slate-400 mt-0.5">Filtra por marca o categoría.</p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredModels.length}
          itemLabel="modelos"
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
};
