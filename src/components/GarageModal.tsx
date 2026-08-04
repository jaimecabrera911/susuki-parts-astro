import React, { useState } from 'react';
import { X, Wrench, CheckCircle2, Plus, ShieldCheck, Trash2, ArrowRight } from 'lucide-react';
import { SUZUKI_MODELS } from '../data/suzukiData';
import type { ActiveMotorcycle } from '../types';
import { SearchableModelSelect } from './SearchableModelSelect';

interface GarageModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMotorcycle: ActiveMotorcycle | null;
  onSelectMotorcycle: (moto: ActiveMotorcycle) => void;
  savedGarages: ActiveMotorcycle[];
  onRemoveFromGarage: (moto: ActiveMotorcycle) => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  isOpen,
  onClose,
  activeMotorcycle,
  onSelectMotorcycle,
  savedGarages,
  onRemoveFromGarage
}) => {
  const [selectedModelId, setSelectedModelId] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [selectedVersion, setSelectedVersion] = useState('');

  // Handle Escape key and body scroll lock
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentModelObj = SUZUKI_MODELS.find(m => m.id === selectedModelId);

  const handleAddNew = () => {
    if (!currentModelObj || !selectedYear || !selectedVersion) return;
    onSelectMotorcycle({
      brand: 'SUZUKI',
      modelId: currentModelObj.id,
      modelName: currentModelObj.name,
      year: Number(selectedYear),
      version: selectedVersion
    });
    setSelectedModelId('');
    setSelectedYear('');
    setSelectedVersion('');
    onClose();
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="garage-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 my-auto"
      >
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal de garaje"
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-slate-500 hover:text-slate-700 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">
            <Wrench className="w-5 h-5 text-red-400" aria-hidden="true" />
          </div>
          <div>
            <h3 id="garage-modal-title" className="text-xl font-black text-slate-900">Mi Garaje Suzuki</h3>
            <p className="text-xs text-slate-500">Gestiona tus motocicletas para filtrado y garantía de repuestos</p>
          </div>
        </div>

        {/* List of Saved Motorcycles */}
        {savedGarages.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-extrabold uppercase text-slate-500 mb-3 tracking-wider">
              MOTOCICLETAS GUARDADAS ({savedGarages.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {savedGarages.map((moto, idx) => {
                const isActive = activeMotorcycle?.modelId === moto.modelId && activeMotorcycle?.year === moto.year && activeMotorcycle?.version === moto.version;
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isActive ? 'bg-emerald-400 ring-2 ring-emerald-300/60' : 'bg-slate-300'}`} />
                      <div>
                        <div className="font-extrabold text-sm flex items-center gap-2">
                          <span>{moto.brand} {moto.modelName} ({moto.year})</span>
                          {isActive && (
                            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider uppercase">
                              ACTIVO EN NAVEGACIÓN
                            </span>
                          )}
                        </div>
                        <div className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                          Versión: {moto.version}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectMotorcycle(moto);
                            onClose();
                          }}
                          className="px-3.5 py-2 min-h-[44px] bg-[#E60012] hover:bg-red-700 text-white font-bold text-xs uppercase rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                        >
                          Activar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onRemoveFromGarage(moto)}
                        aria-label={`Eliminar ${moto.modelName} del garaje`}
                        className={`w-11 h-11 flex items-center justify-center rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${isActive ? 'text-slate-400 hover:text-red-400' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'}`}
                        title="Eliminar del garaje"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add New Bike Form */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
          <h4 className="text-xs font-extrabold uppercase text-slate-900 mb-3 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-[#E60012]" aria-hidden="true" />
            Añadir Nueva Motocicleta al Garaje
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <SearchableModelSelect
                models={SUZUKI_MODELS}
                selectedModelId={selectedModelId}
                onSelectModel={(id) => {
                  setSelectedModelId(id);
                  setSelectedYear('');
                  setSelectedVersion('');
                }}
                placeholder="Buscar modelo..."
                label="Modelo"
              />
            </div>

            <div>
              <label htmlFor="garage-year-select" className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Año</label>
              <select
                id="garage-year-select"
                value={selectedYear}
                disabled={!currentModelObj}
                onChange={(e) => {
                  setSelectedYear(Number(e.target.value));
                  setSelectedVersion('');
                }}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
              >
                <option value="">-- Año --</option>
                {currentModelObj?.years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="garage-version-select" className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Versión</label>
              <select
                id="garage-version-select"
                value={selectedVersion}
                disabled={!selectedYear || !currentModelObj}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
              >
                <option value="">-- Versión --</option>
                {currentModelObj?.versions.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddNew}
            disabled={!selectedModelId || !selectedYear || !selectedVersion}
            className="w-full mt-4 py-3 min-h-[44px] bg-[#E60012] hover:bg-red-700 disabled:bg-slate-300 text-white font-extrabold text-xs uppercase rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
          >
            <span>Guardar y Activar Garaje</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

      </div>
    </div>
  );
};
