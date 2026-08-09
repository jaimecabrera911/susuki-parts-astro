import React from 'react';
import { X, Calendar, Tag, Layers, Edit, ExternalLink, FileText, Eye } from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import type { Brand, SuzukiModel, ExplodedDiagram } from '../../types';

interface ModelViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: SuzukiModel | null;
  brands: Brand[];
  schematics: ExplodedDiagram[];
  onEditModel?: (model: SuzukiModel) => void;
  onViewSchematic?: (schematic: ExplodedDiagram) => void;
}

export const ModelViewModal: React.FC<ModelViewModalProps> = ({
  isOpen,
  onClose,
  model,
  brands,
  schematics,
  onEditModel,
  onViewSchematic
}) => {
  if (!isOpen || !model) return null;

  const brandObj = brands.find(b => b.id === (model.brandId || 'suzuki'));
  const yrs = model.years || [2020];
  const minYear = Math.min(...yrs);
  const maxYear = Math.max(...yrs);
  const isActive = model.active !== false;

  // Filter schematics linked to this model
  const linkedSchematics = schematics.filter(s => {
    if (!s.applicableModelIds) return false;
    const appIds = Array.isArray(s.applicableModelIds)
      ? s.applicableModelIds
      : (typeof s.applicableModelIds === 'string'
          ? JSON.parse(s.applicableModelIds || '[]')
          : []);
    return appIds.includes(model.id);
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-[95vw] md:max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#059669] border border-emerald-200 flex items-center justify-center shadow-xs shrink-0">
              <FaMotorcycle className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg md:text-xl font-black text-slate-900 font-display truncate">
                  {model.name}
                </h2>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                  isActive
                    ? 'bg-emerald-50 text-[#059669] border-emerald-200'
                    : 'bg-red-50 text-[#dc2626] border-red-200'
                }`}>
                  {isActive ? 'Activo en Catálogo' : 'Inactivo'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {brandObj?.name || 'SUZUKI'} • {model.category || 'Motocicleta'} • Producción {minYear}-{maxYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/catalogo?model=${model.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-all text-xs font-bold flex items-center gap-1.5"
              title="Ver en vista pública"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver en Catálogo</span>
            </a>

            {onEditModel && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditModel(model);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#0A3088] text-white hover:bg-blue-900 transition-all text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Column: Image & Specifications */}
            <div className="md:col-span-5 space-y-4">
              <div className="w-full h-56 rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-center overflow-hidden shadow-xs relative group">
                {model.image ? (
                  <img
                    src={model.image}
                    alt={model.name}
                    className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <FaMotorcycle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold">Sin Imagen Registrada</p>
                  </div>
                )}
              </div>

              {/* Quick Info Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block mb-1">
                    Años de Producción
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-[#0A3088]" />
                    <span>{minYear} - {maxYear}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    {yrs.length} {yrs.length === 1 ? 'año' : 'años'} homologados
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block mb-1">
                    Categoría
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs truncate">
                    <Tag className="w-3.5 h-3.5 text-[#059669]" />
                    <span className="truncate">{model.category || 'Estándar'}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5 truncate">
                    Marca: {brandObj?.name || 'Suzuki'}
                  </span>
                </div>
              </div>

              {/* Versions List */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                  Versiones Registradas ({model.versions?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {model.versions && model.versions.length > 0 ? (
                    model.versions.map(v => (
                      <span key={v} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs">
                        {v}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 font-mono">Versión estándar</span>
                  )}
                </div>
              </div>

              {/* Technical Notes */}
              {model.notes && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider font-mono flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    Notas Técnicas de Compatibilidad
                  </span>
                  <p className="text-xs text-slate-700 font-sans leading-relaxed">
                    {model.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Linked Schematics & Despieces */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase text-slate-900 font-mono flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#d97706]" />
                  Despieces & Diagramas Técnicos ({linkedSchematics.length})
                </h3>
              </div>

              {linkedSchematics.length > 0 ? (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {linkedSchematics.map((sch) => (
                    <div
                      key={sch.id}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-2xs group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden p-1 shrink-0">
                          {sch.diagramImage ? (
                            <img src={sch.diagramImage} alt={sch.title} className="w-full h-full object-contain rounded-lg" />
                          ) : (
                            <Layers className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 text-xs group-hover:text-[#E60012] transition-colors truncate">
                            {sch.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200 uppercase">
                              {sch.section || 'General'}
                            </span>
                            <span className="text-[10px] font-mono text-amber-700 font-bold">
                              {sch.hotspots?.length || 0} piezas
                            </span>
                          </div>
                        </div>
                      </div>

                      {onViewSchematic && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onViewSchematic(sch);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#E60012] text-slate-700 hover:text-white border border-slate-200 hover:border-[#E60012] transition-all text-xs font-bold flex items-center gap-1.5 shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Despiece</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500">
                  <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-slate-800 text-xs">Sin despieces asociados a este modelo</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Puedes vincular o crear despieces en el editor de esquemas.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
