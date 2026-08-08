import React, { useState } from 'react';
import { Building2, Plus, Edit, Trash2, Globe, CheckCircle2, XCircle } from 'lucide-react';
import type { Brand } from '../../types';

interface BrandsManagerProps {
  brands: Brand[];
  searchQuery: string;
  onAddBrand: () => void;
  onEditBrand: (brand: Brand) => void;
  onToggleActive: (id: string) => void;
  onDeleteBrand: (id: string) => void;
}

export const BrandsManager: React.FC<BrandsManagerProps> = ({
  brands,
  searchQuery,
  onAddBrand,
  onEditBrand,
  onToggleActive,
  onDeleteBrand
}) => {
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const countries = Array.from(new Set(brands.map(b => b.country || 'Japón'))).filter(Boolean);

  const filteredBrands = brands.filter(b => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.country && b.country.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCountry = filterCountry === 'all' || b.country === filterCountry;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && b.active) ||
      (filterStatus === 'inactive' && !b.active);

    return matchesSearch && matchesCountry && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Country Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">País:</span>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#E60012] font-semibold"
            >
              <option value="all">Todos los países</option>
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Estado:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#E60012] font-semibold"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Solo Activas</option>
              <option value="inactive">Solo Inactivas</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-mono">
            Mostrando <strong className="text-slate-900">{filteredBrands.length}</strong> de <strong className="text-slate-900">{brands.length}</strong> marcas
          </span>
          <button
            onClick={onAddBrand}
            className="px-3.5 py-2 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Marca</span>
          </button>
        </div>
      </div>

      {/* Brands Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                <th className="py-3.5 px-5">Marca</th>
                <th className="py-3.5 px-4">País Origen</th>
                <th className="py-3.5 px-4">Descripción</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredBrands.map((brand) => (
                <tr
                  key={brand.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Brand info & logo */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden p-1 shrink-0 shadow-xs">
                        {brand.logo ? (
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Building2 className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 group-hover:text-[#E60012] transition-colors font-display">
                          {brand.name}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400 font-bold">REF: {brand.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* Country */}
                  <td className="py-4 px-4 font-medium text-slate-700 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>{brand.country || 'Japón'}</span>
                    </div>
                  </td>

                  {/* Description */}
                  <td className="py-4 px-4 text-xs text-slate-500 max-w-xs truncate font-sans">
                    {brand.description || 'Sin descripción especificada.'}
                  </td>

                  {/* Traffic Light Status Badge */}
                  <td className="py-4 px-4">
                    <button
                      onClick={() => onToggleActive(brand.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all ${
                        brand.active
                          ? 'bg-emerald-50 text-[#059669] border-emerald-200 hover:bg-emerald-100'
                          : 'bg-red-50 text-[#dc2626] border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {brand.active ? (
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
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEditBrand(brand)}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Editar marca"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteBrand(brand.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-[#dc2626] hover:bg-red-50 transition-colors"
                        title="Eliminar marca"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredBrands.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-800">No se encontraron marcas</p>
                    <p className="text-xs text-slate-400 mt-0.5">Ajusta los términos de búsqueda o filtros.</p>
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
