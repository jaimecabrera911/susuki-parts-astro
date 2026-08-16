import React, { useState } from 'react';
import { Package, Plus, Edit, Trash2, Copy, Tag, CheckCircle2, AlertTriangle, Globe, Wrench, Layers } from 'lucide-react';
import type { SuzukiPart, SuzukiModel, AvailabilityStatus } from '../../types';
import { AVAILABILITY_META, getPrimaryOem } from '../../types';

interface PartsManagerProps {
  parts: SuzukiPart[];
  models: SuzukiModel[];
  searchQuery: string;
  onAddPart: () => void;
  onEditPart: (part: SuzukiPart) => void;
  onDuplicatePart: (part: SuzukiPart) => void;
  onToggleAvailability: (id: string) => void;
  onDeletePart: (id: string) => void;
}

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'Todas las Categorías' },
  { id: 'filtros', label: 'Filtros' },
  { id: 'frenos', label: 'Frenos' },
  { id: 'motor', label: 'Motor' },
  { id: 'electrico', label: 'Eléctrico' },
  { id: 'transmision', label: 'Transmisión' },
  { id: 'carroceria', label: 'Carrocería' }
];

export const PartsManager: React.FC<PartsManagerProps> = ({
  parts,
  models,
  searchQuery,
  onAddPart,
  onEditPart,
  onDuplicatePart,
  onToggleAvailability,
  onDeletePart
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedAvailabilityFilter, setSelectedAvailabilityFilter] = useState<string>('all');
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('all');

  const filteredParts = parts.filter(p => {
    const primaryOem = getPrimaryOem(p);
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      primaryOem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.oemNumbers.some(oem => oem.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategoryFilter === 'all' || p.category === selectedCategoryFilter;
    const matchesAvailability = selectedAvailabilityFilter === 'all' || (p.availability || 'in_stock') === selectedAvailabilityFilter;
    const matchesModel = selectedModelFilter === 'all' || p.compatibility.some(c => c.modelId === selectedModelFilter);

    return matchesSearch && matchesCategory && matchesAvailability && matchesModel;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div id="parts-manager" className="space-y-6">
      {/* Action & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Categoría:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#E60012] font-semibold"
            >
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Disponibilidad:</span>
            <select
              value={selectedAvailabilityFilter}
              onChange={(e) => setSelectedAvailabilityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#E60012] font-semibold"
            >
              <option value="all">Todos los estados</option>
              <option value="in_stock">En Stock</option>
              <option value="international">Internacional</option>
              <option value="on_order">Bajo Pedido</option>
            </select>
          </div>

          {/* Model Compatibility Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Modelo Compatible:</span>
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
            Mostrando <strong className="text-slate-900">{filteredParts.length}</strong> de <strong className="text-slate-900">{parts.length}</strong> repuestos
          </span>
          <button
            onClick={onAddPart}
            className="px-3.5 py-2 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Repuesto</span>
          </button>
        </div>
      </div>

      {/* Parts Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                <th className="py-3.5 px-5">Repuesto OEM / Nombre</th>
                <th className="py-3.5 px-4">Ref. OEM Principal</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4">Precio & Stock</th>
                <th className="py-3.5 px-4">Disponibilidad</th>
                <th className="py-3.5 px-4">Motos Compatibles</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredParts.map((part) => {
                const primaryOem = getPrimaryOem(part);
                const statusKey = part.availability || (part.stock > 0 ? 'in_stock' : 'on_order');
                const meta = AVAILABILITY_META[statusKey];

                return (
                  <tr
                    key={part.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Part Name & Thumbnail */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden p-1 shrink-0 shadow-xs">
                          {part.image ? (
                            <img
                              src={part.image}
                              alt={part.name}
                              className="w-full h-full object-contain rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Package className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 group-hover:text-[#E60012] transition-colors font-display line-clamp-1">
                            {part.name}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500 font-bold">
                            SKU: <span className="text-[#0A3088]">{part.sku || `SKU-${part.id}`}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* OEM Number (Mono Lock Rule) */}
                    <td className="py-4 px-4">
                      <div className="font-mono text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg inline-block">
                        {primaryOem}
                      </div>
                    </td>

                    {/* Category Tag */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 font-mono uppercase">
                        <Tag className="w-3 h-3 text-[#0A3088]" />
                        <span>{part.category}</span>
                      </span>
                    </td>

                    {/* Price & Stock (Mono Lock Rule) */}
                    <td className="py-4 px-4 font-mono">
                      <p className="font-black text-slate-900 text-xs">{formatCurrency(part.price)}</p>
                      <p className="text-[11px] text-slate-500 font-bold">
                        Stock: <span className={part.stock > 0 ? 'text-[#059669]' : 'text-[#dc2626]'}>{part.stock} un.</span>
                      </p>
                    </td>

                    {/* Availability Traffic Light Badge */}
                    <td className="py-4 px-4">
                      <button
                        onClick={() => onToggleAvailability(part.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span>{meta.shortLabel}</span>
                      </button>
                    </td>

                    {/* Compatibility Count */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold font-mono">
                        <Layers className="w-3.5 h-3.5 text-[#059669]" />
                        <span>{part.compatibility?.length || 0} modelos</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onDuplicatePart(part)}
                          className="p-2 rounded-xl text-slate-500 hover:text-[#0A3088] hover:bg-blue-50 transition-colors"
                          title="Duplicar repuesto"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditPart(part)}
                          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Editar repuesto"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeletePart(part.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-[#dc2626] hover:bg-red-50 transition-colors"
                          title="Eliminar repuesto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredParts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-800">No se encontraron repuestos</p>
                    <p className="text-xs text-slate-400 mt-0.5">Intenta cambiando los términos de búsqueda o filtros.</p>
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
