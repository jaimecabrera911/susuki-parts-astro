import React, { useState, useMemo } from 'react';
import { Layers, Plus, Edit, Trash2, Copy, Tag, Crosshair, Image as ImageIcon, Eye } from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import type { ExplodedDiagram, SuzukiModel, SuzukiPart } from '../../types';

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
}

export const SchematicsManager: React.FC<SchematicsManagerProps> = ({
  schematics,
  models,
  parts,
  searchQuery,
  onAddSchematic,
  onEditSchematic,
  onViewSchematic,
  onDuplicateSchematic,
  onDeleteSchematic
}) => {
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('all');

  const availableSections = useMemo(() => {
    const defaults = [
      'Motor',
      'Frenos',
      'Admisión y Combustible',
      'Transmisión y Kit de Arrastre',
      'Sistema de Refrigeración',
      'Chasis y Eléctrico',
      'Sistema de Escape',
      'Controles y Pedales',
      'Tablero e Instrumentos'
    ];
    const fromSchematics = schematics.map(s => s.section).filter(Boolean);
    return Array.from(new Set([...defaults, ...fromSchematics]));
  }, [schematics]);

  const getModelTargetText = (schematic: ExplodedDiagram): string => {
    if (schematic.modelTarget && schematic.modelTarget.trim()) {
      return schematic.modelTarget;
    }
    const appIds = Array.isArray(schematic.applicableModelIds)
      ? schematic.applicableModelIds
      : (typeof schematic.applicableModelIds === 'string'
          ? JSON.parse(schematic.applicableModelIds || '[]')
          : []);

    if (appIds.length > 0) {
      const names = appIds.map((id: string) => {
        const found = models.find(m => m.id === id);
        return found ? found.name : id;
      });
      return names.join(', ');
    }

    return 'Todos los modelos';
  };

  const filteredSchematics = schematics.filter(s => {
    const targetText = getModelTargetText(s).toLowerCase();
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      targetText.includes(searchQuery.toLowerCase());

    const matchesSection = selectedSectionFilter === 'all' || s.section === selectedSectionFilter;
    const appIds = Array.isArray(s.applicableModelIds)
      ? s.applicableModelIds
      : (typeof s.applicableModelIds === 'string' ? JSON.parse(s.applicableModelIds || '[]') : []);
    const matchesModel = selectedModelFilter === 'all' || appIds.includes(selectedModelFilter);

    return matchesSearch && matchesSection && matchesModel;
  });

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Section Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Sección:</span>
            <select
              value={selectedSectionFilter}
              onChange={(e) => setSelectedSectionFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#E60012] font-semibold"
            >
              <option value="all">Todas las Secciones</option>
              {availableSections.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Model Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Modelo Objetivo:</span>
            <select
              value={selectedModelFilter}
              onChange={(e) => setSelectedModelFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#E60012] font-semibold"
            >
              <option value="all">Todos los Modelos</option>
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <span className="text-xs text-slate-500 font-mono">
            Mostrando <strong className="text-slate-900">{filteredSchematics.length}</strong> de <strong className="text-slate-900">{schematics.length}</strong> despieces
          </span>
          <button
            onClick={onAddSchematic}
            className="px-3.5 py-2 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Despiece</span>
          </button>
        </div>
      </div>

      {/* Schematics Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                <th className="py-3.5 px-5">Esquema / Título</th>
                <th className="py-3.5 px-4">Sección Técnica</th>
                <th className="py-3.5 px-4">Modelo Objetivo</th>
                <th className="py-3.5 px-4">Puntos Hotspots</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredSchematics.map((schematic) => (
                <tr
                  key={schematic.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Schematic Title & Thumbnail */}
                  <td className="py-4 px-5">
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
                        <p className="text-[11px] font-mono text-slate-400 font-bold">ID: {schematic.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* Section Tag */}
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 font-mono uppercase">
                      <Tag className="w-3 h-3 text-[#0A3088]" />
                      <span>{schematic.section || 'General'}</span>
                    </span>
                  </td>

                  {/* Model Target */}
                  <td className="py-4 px-4 font-medium text-slate-700 text-xs">
                    <div className="flex items-center gap-2 font-sans font-bold">
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                        <FaMotorcycle className="w-3.5 h-3.5 text-[#059669]" />
                      </div>
                      <span className="text-slate-800 font-bold">{getModelTargetText(schematic)}</span>
                    </div>
                  </td>

                  {/* Hotspots Count */}
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 font-mono">
                      <Crosshair className="w-3.5 h-3.5 text-[#d97706]" />
                      <span>{schematic.hotspots?.length || 0} puntos</span>
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onViewSchematic && (
                        <button
                          onClick={() => onViewSchematic(schematic)}
                          className="p-2 rounded-xl text-slate-500 hover:text-[#059669] hover:bg-emerald-50 transition-colors"
                          title="Ver despiece interactivo"
                        >
                          <Eye className="w-4 h-4 text-[#059669]" />
                        </button>
                      )}
                      <button
                        onClick={() => onDuplicateSchematic(schematic)}
                        className="p-2 rounded-xl text-slate-500 hover:text-[#0A3088] hover:bg-blue-50 transition-colors"
                        title="Duplicar despiece"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditSchematic(schematic)}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Editar lienzo de despiece"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteSchematic(schematic.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-[#dc2626] hover:bg-red-50 transition-colors"
                        title="Eliminar despiece"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSchematics.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-800">No se encontraron despieces</p>
                    <p className="text-xs text-slate-400 mt-0.5">Intenta modificando los términos de búsqueda o filtros.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
