import React, { useState } from 'react';
import { Layers, Plus, Edit, Trash2, Copy, Tag, Crosshair, Image as ImageIcon, Eye, ListOrdered } from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import type { ExplodedDiagram, SuzukiModel, SuzukiPart } from '../../types';
import { AdminSearchInput } from './AdminSearchInput';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';
import { SchematicSectionsModal } from './SchematicSectionsModal';

interface SchematicsManagerProps {
  schematics: ExplodedDiagram[];
  models: SuzukiModel[];
  parts: SuzukiPart[];
  searchQuery: string;
  onAddSchematic: () => void;
  onEditSchematic: (schematic: ExplodedDiagram) => void;
  onViewSchematic?: (schematic: ExplodedDiagram) => void;
  onDuplicateSchematic: (schematic: ExplodedDiagram) => void;
  onDeleteSchematic: (id: string) => void;
  isLoading?: boolean;
}

const getModelIds = (schematic: ExplodedDiagram): string[] =>
  Array.isArray(schematic.applicableModelIds)
    ? schematic.applicableModelIds
    : typeof schematic.applicableModelIds === 'string'
      ? (JSON.parse(schematic.applicableModelIds || '[]') as string[])
      : [];

export const SchematicsManager: React.FC<SchematicsManagerProps> = ({
  schematics,
  models,
  parts,
  searchQuery,
  onAddSchematic,
  onEditSchematic,
  onViewSchematic,
  onDuplicateSchematic,
  onDeleteSchematic,
  isLoading = false,
}) => {
  // Local search (independent from the global header search)
  const [localSearch, setLocalSearch] = useState('');
  const [isSectionsModalOpen, setIsSectionsModalOpen] = useState(false);

  const getModelTargetText = (schematic: ExplodedDiagram): string => {
    if (schematic.modelTarget && schematic.modelTarget.trim()) {
      return schematic.modelTarget;
    }
    const appIds = getModelIds(schematic);
    if (appIds.length > 0) {
      return appIds
        .map((id: string) => {
          const found = models.find((m) => m.id === id);
          return found ? found.name : id;
        })
        .join(', ');
    }
    return 'Todos los modelos';
  };

  const activeQuery = (searchQuery || localSearch).trim().toLowerCase();

  const columns: DataTableColumn<ExplodedDiagram>[] = [
    {
      key: 'esquema',
      label: 'Esquema / Título',
      minWidth: '250px',
      sortable: true,
      sortSelector: (s) => s.title,
      render: (schematic) => (
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden p-1 shrink-0 shadow-xs">
            {schematic.diagramImage ? (
              <img
                src={schematic.diagramImage}
                alt={schematic.title}
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div>
            <p className="font-extrabold text-slate-900 group-hover:text-[#E60012] transition-colors font-display line-clamp-1">
              {schematic.title}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'section',
      label: 'Sección Técnica',
      minWidth: '160px',
      filterable: true,
      accessor: (s) => s.section || 'General',
      render: (schematic) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 font-mono uppercase">
          <Tag className="w-3 h-3 text-[#0A3088]" />
          <span>{schematic.section || 'General'}</span>
        </span>
      ),
    },
    {
      key: 'model',
      label: 'Modelo Objetivo',
      minWidth: '180px',
      filterable: true,
      filterOptions: models.map((m) => ({ value: m.id, label: m.name })),
      filterMatcher: (s, value) => getModelIds(s).includes(value),
      render: (schematic) => (
        <div className="flex items-center gap-2 font-sans font-bold">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <FaMotorcycle className="w-3.5 h-3.5 text-[#059669]" />
          </div>
          <span className="text-slate-800 font-bold">{getModelTargetText(schematic)}</span>
        </div>
      ),
    },
    {
      key: 'hotspots',
      label: 'Puntos Hotspots',
      minWidth: '140px',
      filterable: true,
      ranges: [{ label: 'Puntos', value: (s) => s.hotspots?.length || 0 }],
      render: (schematic) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 font-mono">
          <Crosshair className="w-3.5 h-3.5 text-[#d97706]" />
          <span>{schematic.hotspots?.length || 0} puntos</span>
        </span>
      ),
    },
  ];

  const handleSearchFilter = (schematic: ExplodedDiagram, query: string) => {
    const targetText = getModelTargetText(schematic).toLowerCase();
    return (
      schematic.title.toLowerCase().includes(query) ||
      schematic.id.toLowerCase().includes(query) ||
      schematic.category.toLowerCase().includes(query) ||
      (schematic.section || '').toLowerCase().includes(query) ||
      targetText.includes(query)
    );
  };

  return (
    <div id="schematics-manager" className="space-y-6">
      {/* Action & Search Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <AdminSearchInput
            value={localSearch}
            onChange={setLocalSearch}
            placeholder="Buscar por título, ID, sección o modelo..."
          />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end flex-wrap">
          <span className="text-xs text-slate-500 font-mono">
            <strong className="text-slate-900">{schematics.length}</strong> despieces
          </span>
          <button
            type="button"
            onClick={() => setIsSectionsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-all cursor-pointer shadow-xs"
            title="Organizar el orden de las secciones de la moto"
          >
            <ListOrdered className="w-4 h-4 text-[#0A3088]" />
            <span>Organizar Secciones</span>
          </button>
          <button
            onClick={onAddSchematic}
            className="px-3.5 py-2 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Despiece</span>
          </button>
        </div>
      </div>

      {/* Modal para organizar y ordenar secciones de la moto */}
      <SchematicSectionsModal
        isOpen={isSectionsModalOpen}
        onClose={() => setIsSectionsModalOpen(false)}
        schematics={schematics}
      />

      {/* Schematics DataTable with per-column dynamic filters */}
      <DataTable
        data={schematics}
        columns={columns}
        keyField="id"
        loading={isLoading}
        itemLabel="despieces"
        emptyMessage="No se encontraron despieces"
        searchQuery={activeQuery}
        searchFilter={handleSearchFilter}
        actions={(schematic) => (
          <>
            {onViewSchematic && (
              <button
                onClick={() => onViewSchematic(schematic)}
                className="p-2 rounded-xl text-slate-500 hover:text-[#059669] hover:bg-emerald-50 transition-colors cursor-pointer"
                title="Ver despiece interactivo"
              >
                <Eye className="w-4 h-4 text-[#059669]" />
              </button>
            )}
            <button
              onClick={() => onDuplicateSchematic(schematic)}
              className="p-2 rounded-xl text-slate-500 hover:text-[#0A3088] hover:bg-blue-50 transition-colors cursor-pointer"
              title="Duplicar despiece"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEditSchematic(schematic)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Editar lienzo de despiece"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteSchematic(schematic.id)}
              className="p-2 rounded-xl text-slate-400 hover:text-[#dc2626] hover:bg-red-50 transition-colors cursor-pointer"
              title="Eliminar despiece"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      />
    </div>
  );
};