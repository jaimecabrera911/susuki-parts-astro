import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Plus,
  Edit2,
  Trash2,
  Check,
  RotateCcw,
  Save,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Tag
} from 'lucide-react';
import type { SchematicSection, ExplodedDiagram } from '../../types';
import {
  fetchSchematicSections,
  saveSchematicSectionsOrder,
  upsertSchematicSectionApi,
  deleteSchematicSectionApi
} from '../../services/api';

interface SchematicSectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schematics: ExplodedDiagram[];
  onSectionsUpdated?: (sections: SchematicSection[]) => void;
}

export const SchematicSectionsModal: React.FC<SchematicSectionsModalProps> = ({
  isOpen,
  onClose,
  schematics,
  onSectionsUpdated
}) => {
  const [sections, setSections] = useState<SchematicSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New section inline form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  // Editing inline state
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionName, setEditSectionName] = useState('');

  // Drag-and-drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const loadSections = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSchematicSections();
      setSections(data);
    } catch (err: any) {
      setError(err?.message || 'Error cargando las secciones técnicas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSections();
      setError(null);
      setSuccessMsg(null);
      setIsAddingNew(false);
      setEditingSectionId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const countDiagramsForSection = (sectionName: string) => {
    return schematics.filter(
      (s) => (s.section || '').trim().toLowerCase() === sectionName.trim().toLowerCase()
    ).length;
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setSections((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy.map((sec, i) => ({ ...sec, order: i + 1 }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= sections.length - 1) return;
    setSections((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy.map((sec, i) => ({ ...sec, order: i + 1 }));
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setSections((prev) => {
      const copy = [...prev];
      const draggedItem = copy[draggedIndex];
      copy.splice(draggedIndex, 1);
      copy.splice(index, 0, draggedItem);
      return copy.map((sec, i) => ({ ...sec, order: i + 1 }));
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await saveSchematicSectionsOrder(
        sections.map((s, idx) => ({ ...s, order: idx + 1 }))
      );
      setSections(updated);
      if (onSectionsUpdated) {
        onSectionsUpdated(updated);
      }
      setSuccessMsg('¡Orden de secciones de la moto guardado exitosamente!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err?.message || 'Error guardando el nuevo orden');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      const created = await upsertSchematicSectionApi({
        name: newSectionName.trim(),
        order: sections.length + 1,
        active: true
      });
      setNewSectionName('');
      setIsAddingNew(false);
      await loadSections();
      setSuccessMsg(`Sección "${created.name}" creada con éxito`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Error creando la sección');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async (section: SchematicSection) => {
    if (!editSectionName.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      await upsertSchematicSectionApi({
        ...section,
        name: editSectionName.trim()
      });
      setEditingSectionId(null);
      await loadSections();
      setSuccessMsg('Nombre de sección actualizado');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Error actualizando la sección');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (section: SchematicSection) => {
    try {
      await upsertSchematicSectionApi({
        ...section,
        active: !section.active
      });
      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, active: !s.active } : s))
      );
    } catch (err: any) {
      setError(err?.message || 'Error actualizando el estado');
    }
  };

  const handleDeleteSection = async (section: SchematicSection) => {
    const count = countDiagramsForSection(section.name);
    if (count > 0) {
      setError(`No puedes eliminar "${section.name}" porque tiene ${count} despiece(s) asignado(s).`);
      return;
    }
    if (!confirm(`¿Eliminar la sección "${section.name}"?`)) return;

    try {
      await deleteSchematicSectionApi(section.id);
      await loadSections();
      setSuccessMsg(`Sección "${section.name}" eliminada`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Error eliminando sección');
    }
  };

  return (
    <div
      id="schematic-sections-modal"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 md:px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#0A3088]/10 text-[#0A3088] border border-[#0A3088]/20 flex items-center justify-center shrink-0 shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-black text-slate-900 font-display truncate">
                Organizar Secciones de la Moto
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Define el orden personalizado en que se muestran las secciones en el catálogo de despieces.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">
              Lista de Secciones ({sections.length}) • Arrastra o usa las flechas para ordenar
            </span>
            {!isAddingNew && (
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(true);
                  setNewSectionName('');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A3088] text-white text-xs font-bold hover:bg-blue-900 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Sección</span>
              </button>
            )}
          </div>

          {/* New Section Inline Form */}
          {isAddingNew && (
            <form
              onSubmit={handleCreateSection}
              className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-center gap-2.5 animate-in fade-in duration-150"
            >
              <Tag className="w-4 h-4 text-[#0A3088] shrink-0" />
              <input
                type="text"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="Nombre de la nueva sección (Ej: Sistema de Dirección)"
                autoFocus
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#0A3088]/20"
              />
              <button
                type="submit"
                disabled={isSaving || !newSectionName.trim()}
                className="px-3.5 py-2 bg-[#0A3088] text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors disabled:opacity-50"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold"
              >
                Cancelar
              </button>
            </form>
          )}

          {/* Sections List */}
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              Cargando secciones técnicas...
            </div>
          ) : sections.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              No hay secciones registradas.
            </div>
          ) : (
            <div className="space-y-2">
              {sections.map((sec, idx) => {
                const isEditing = editingSectionId === sec.id;
                const diagramCount = countDiagramsForSection(sec.name);

                return (
                  <div
                    key={sec.id || idx}
                    draggable={!isEditing}
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      draggedIndex === idx
                        ? 'bg-blue-50 border-blue-400 opacity-60'
                        : sec.active
                        ? 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    {/* Left: Drag handle, order badge, and name */}
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                      <div
                        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1"
                        title="Arrastra para reordenar"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>

                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editSectionName}
                            onChange={(e) => setEditSectionName(e.target.value)}
                            autoFocus
                            className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(sec)}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs"
                            title="Guardar cambio de nombre"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSectionId(null)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 text-xs"
                            title="Cancelar"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="min-w-0 flex items-center gap-2 flex-wrap">
                          <p className="font-extrabold text-slate-900 text-xs font-display">
                            {sec.name}
                          </p>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {diagramCount} {diagramCount === 1 ? 'despiece' : 'despieces'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Controls (Move up, Move down, Edit, Toggle, Delete) */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-20 disabled:hover:bg-transparent"
                        title="Subir posición"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === sections.length - 1}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-20 disabled:hover:bg-transparent"
                        title="Bajar posición"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSectionId(sec.id);
                          setEditSectionName(sec.name);
                        }}
                        className="p-1.5 text-slate-500 hover:text-[#0A3088] hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar nombre"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(sec)}
                        className={`p-1.5 text-[10px] font-bold font-mono rounded-lg transition-colors ${
                          sec.active
                            ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                        }`}
                        title={sec.active ? 'Sección Activa (clic para ocultar)' : 'Sección Inactiva (clic para activar)'}
                      >
                        {sec.active ? 'Activa' : 'Oculta'}
                      </button>
                      {diagramCount === 0 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(sec)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Eliminar sección vacía"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 md:px-8 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={loadSections}
            disabled={isLoading || isSaving}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recargar</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleSaveOrder}
              disabled={isSaving || sections.length === 0}
              className="px-5 py-2.5 rounded-xl bg-[#E60012] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Orden de Secciones'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
