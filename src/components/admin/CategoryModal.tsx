import React, { useState, useEffect } from 'react';
import { X, FolderTree, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Category, Subcategory } from '../../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Category) => void;
  categoryToEdit: Category | null;
}

const ICON_OPTIONS = [
  'Wrench',
  'ShieldAlert',
  'Repeat',
  'Zap',
  'Shield',
  'Cog',
  'Layers',
  'Package'
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categoryToEdit
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [iconName, setIconName] = useState('Wrench');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(1);
  const [active, setActive] = useState(true);

  // Subcategories manager
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [newSubName, setNewSubName] = useState('');
  const [newSubDesc, setNewSubDesc] = useState('');

  const [error, setError] = useState('');

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setSlug(categoryToEdit.slug);
      setIconName(categoryToEdit.iconName || 'Wrench');
      setDescription(categoryToEdit.description || '');
      setOrder(categoryToEdit.order || 1);
      setActive(categoryToEdit.active !== false);
      setSubcategories(categoryToEdit.subcategories || []);
    } else {
      setName('');
      setSlug('');
      setIconName('Wrench');
      setDescription('');
      setOrder(1);
      setActive(true);
      setSubcategories([]);
    }
    setNewSubName('');
    setNewSubDesc('');
    setError('');
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!categoryToEdit) {
      setSlug(val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  const handleAddSubcategory = () => {
    const trimmed = newSubName.trim();
    if (!trimmed) return;

    const subId = `sub-${Date.now().toString().slice(-6)}`;
    const subSlug = trimmed.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const newSub: Subcategory = {
      id: subId,
      name: trimmed,
      slug: subSlug,
      description: newSubDesc.trim(),
      active: true
    };

    setSubcategories([...subcategories, newSub]);
    setNewSubName('');
    setNewSubDesc('');
  };

  const handleRemoveSubcategory = (id: string) => {
    setSubcategories(subcategories.filter(s => s.id !== id));
  };

  const handleToggleSubcategoryActive = (id: string) => {
    setSubcategories(subcategories.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la categoría es obligatorio.');
      return;
    }

    const catId = categoryToEdit
      ? categoryToEdit.id
      : `cat-${Date.now().toString().slice(-6)}`;

    const newCategory: Category = {
      id: catId,
      name: name.trim(),
      slug: slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'),
      iconName,
      description: description.trim(),
      active,
      order: Number(order) || 1,
      subcategories
    };

    onSave(newCategory);
    onClose();
  };

  return (
    <div id="category-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0A3088] border border-blue-200 flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 font-display">
                {categoryToEdit ? 'Editar Categoría Principal' : 'Nueva Categoría Principal'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {categoryToEdit ? `ID: ${categoryToEdit.id}` : 'Catálogo jerárquico de repuestos'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#dc2626] text-xs flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Category Name & Icon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Nombre de la Categoría *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ej. Motor & Admisión"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Icono Visual
              </label>
              <select
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#E60012]"
              >
                {ICON_OPTIONS.map(ico => (
                  <option key={ico} value={ico}>{ico}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Slug & Order */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                URL Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="motor-admision"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Orden de Despliegue
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono font-bold"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
              Descripción Corta
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción para orientar a mecánicos y compradores..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium resize-none"
            />
          </div>

          {/* Subcategories Builder */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 font-mono uppercase">
                SUBCATEGORÍAS ASOCIADAS ({subcategories.length})
              </span>
            </div>

            {/* Quick Add Subcategory Input */}
            <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubcategory(); } }}
                  placeholder="Nombre de la Subcategoría (ej. Cilindros & Pistones)"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                />
                <button
                  type="button"
                  onClick={handleAddSubcategory}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar
                </button>
              </div>
              <input
                type="text"
                value={newSubDesc}
                onChange={(e) => setNewSubDesc(e.target.value)}
                placeholder="Descripción opcional de la subcategoría..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700"
              />
            </div>

            {/* Subcategories List */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
              {subcategories.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-900 font-display flex items-center gap-2">
                      <span>{sub.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-normal">/{sub.slug}</span>
                    </p>
                    {sub.description && (
                      <p className="text-[10px] text-slate-500 truncate">{sub.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleSubcategoryActive(sub.id)}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        sub.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {sub.active ? 'Activa' : 'Inactiva'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubcategory(sub.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {subcategories.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2 italic font-medium">
                  No hay subcategorías agregadas todavía. Agrega la primera arriba.
                </p>
              )}
            </div>
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-900">Estado de la Categoría</p>
              <p className="text-[11px] text-slate-500 font-sans">Activa o desactiva la visibilidad en el menú del catálogo.</p>
            </div>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                active ? 'bg-[#059669]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  active ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all"
            >
              {categoryToEdit ? 'Guardar Cambios' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
