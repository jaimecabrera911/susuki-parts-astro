import React, { useState } from 'react';
import { 
  FolderTree, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Tag, 
  CheckCircle2, 
  XCircle, 
  Package, 
  Wrench, 
  ShieldAlert, 
  Repeat, 
  Zap, 
  Shield 
} from 'lucide-react';
import type { Category, Subcategory, SuzukiPart } from '../../types';

interface CategoriesManagerProps {
  categories: Category[];
  parts: SuzukiPart[];
  searchQuery: string;
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onToggleCategoryActive: (id: string) => void;
  onDeleteCategory: (id: string) => void;
  onSaveCategory: (category: Category) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Wrench,
  ShieldAlert,
  Repeat,
  Zap,
  Shield
};

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  categories,
  parts,
  searchQuery,
  onAddCategory,
  onEditCategory,
  onToggleCategoryActive,
  onDeleteCategory,
  onSaveCategory
}) => {
  const [expandedCatIds, setExpandedCatIds] = useState<string[]>(categories.map(c => c.id));
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const toggleExpand = (id: string) => {
    if (expandedCatIds.includes(id)) {
      setExpandedCatIds(expandedCatIds.filter(item => item !== id));
    } else {
      setExpandedCatIds([...expandedCatIds, id]);
    }
  };

  const filteredCategories = categories.filter(cat => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      cat.name.toLowerCase().includes(q) ||
      cat.slug.toLowerCase().includes(q) ||
      cat.subcategories.some(sub => sub.name.toLowerCase().includes(q) || sub.slug.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && cat.active) ||
      (statusFilter === 'inactive' && !cat.active);

    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Action & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#E60012] font-semibold"
            >
              <option value="all">Todas las Categorías</option>
              <option value="active">Solo Activas</option>
              <option value="inactive">Solo Inactivas</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setExpandedCatIds(categories.map(c => c.id))}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-mono transition-colors"
          >
            Expandir Todas
          </button>
          <button
            type="button"
            onClick={() => setExpandedCatIds([])}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-mono transition-colors"
          >
            Colapsar Todas
          </button>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <span className="text-xs text-slate-500 font-mono">
            Mostrando <strong className="text-slate-900">{filteredCategories.length}</strong> categorías principales
          </span>
          <button
            onClick={onAddCategory}
            className="px-3.5 py-2 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Categoría</span>
          </button>
        </div>
      </div>

      {/* Accordion / Tree View of Categories & Subcategories */}
      <div className="space-y-4">
        {filteredCategories.map((category) => {
          const isExpanded = expandedCatIds.includes(category.id);
          const IconComp = ICON_MAP[category.iconName || 'Wrench'] || Wrench;

          // Calculate total parts linked to this category name
          const categoryPartsCount = parts.filter(p => p.category?.toLowerCase() === category.name.toLowerCase() || p.category?.toLowerCase().includes(category.name.toLowerCase().split(' ')[0])).length;

          return (
            <div
              key={category.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 transition-all"
            >
              {/* Category Header Bar */}
              <div className="p-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 border-b border-slate-200">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleExpand(category.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>

                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A3088] border border-blue-200 flex items-center justify-center shrink-0">
                    <IconComp className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-sm font-display tracking-tight">
                        {category.name}
                      </h3>
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                        /{category.slug}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-md">{category.description || 'Sin descripción'}</p>
                  </div>
                </div>

                {/* Right Badges & Controls */}
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200">
                    <Tag className="w-3 h-3 text-[#0A3088]" />
                    <span>{category.subcategories.length} subcategorías</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => onToggleCategoryActive(category.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all ${
                      category.active
                        ? 'bg-emerald-50 text-[#059669] border-emerald-200'
                        : 'bg-red-50 text-[#dc2626] border-red-200'
                    }`}
                  >
                    {category.active ? (
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

                  <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                    <button
                      type="button"
                      onClick={() => onEditCategory(category)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Editar categoría"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCategory(category.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-[#dc2626] hover:bg-red-50 transition-colors"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Subcategories Expanded Section */}
              {isExpanded && (
                <div className="p-4 bg-white space-y-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {category.subcategories.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2 hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-slate-900 text-xs font-display">{sub.name}</p>
                            <p className="text-[10px] font-mono text-slate-500 font-bold">slug: /{sub.slug}</p>
                          </div>
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                              sub.active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {sub.active ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>

                        {sub.description && (
                          <p className="text-[11px] text-slate-600 line-clamp-2">{sub.description}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {category.subcategories.length === 0 && (
                    <p className="text-xs text-slate-400 font-medium py-3 text-center italic">
                      No hay subcategorías agregadas en esta categoría principal. Haz clic en Editar para añadir la primera.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredCategories.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-xs">
            <FolderTree className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-extrabold text-slate-800 text-base font-display">No se encontraron categorías</p>
            <p className="text-xs text-slate-400 mt-1">Intenta buscar con otros términos o crea una nueva categoría.</p>
          </div>
        )}
      </div>
    </div>
  );
};
