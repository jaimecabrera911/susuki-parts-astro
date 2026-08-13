import React, { useState, useMemo } from 'react';
import { Heart, Search, ArrowRight, Trash2, ShieldCheck } from 'lucide-react';
import { ProductCard } from './ProductCard';
import type { SuzukiPart, ActiveMotorcycle } from '../types';

interface FavoritesPageProps {
  favoriteParts: SuzukiPart[];
  activeMotorcycle: ActiveMotorcycle | null;
  onOpenDetail: (part: SuzukiPart) => void;
  onAddToCart: (part: SuzukiPart) => void;
  onOpenGarageModal: () => void;
  onToggleFavorite: (partId: string) => void;
  onNavigateToCatalog: () => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  favoriteParts,
  activeMotorcycle,
  onOpenDetail,
  onAddToCart,
  onOpenGarageModal,
  onToggleFavorite,
  onNavigateToCatalog
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered favorite parts search
  const filteredFavorites = useMemo(() => {
    if (!searchTerm.trim()) return favoriteParts;
    const term = searchTerm.toLowerCase();
    return favoriteParts.filter(part => 
      part.name.toLowerCase().includes(term) ||
      part.oemNumbers.some(oem => oem.toLowerCase().includes(term)) ||
      part.category.toLowerCase().includes(term)
    );
  }, [favoriteParts, searchTerm]);

  return (
    <div id="favorites-page" className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12">
      
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0 shadow-xs">
              <Heart className="w-7 h-7 fill-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-rose-200">
                  {favoriteParts.length} {favoriteParts.length === 1 ? 'Repuesto Guardado' : 'Repuestos Guardados'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                Lista de Favoritos & Deseos
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Consulta y gestiona los repuestos que has guardado para comprar o cotizar en cualquier momento.
              </p>
            </div>
          </div>

          {favoriteParts.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar en mis favoritos..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Active Motorcycle Info Bar */}
      {activeMotorcycle && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md border border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">
                COMPATIBILIDAD VERIFICADA
              </span>
              <span className="font-bold text-slate-100">
                Mostrando favoritos para: {activeMotorcycle.brand} {activeMotorcycle.modelName} ({activeMotorcycle.year})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenGarageModal}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            Cambiar Moto
          </button>
        </div>
      )}

      {/* EMPTY FAVORITES STATE */}
      {favoriteParts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-lg mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <Heart className="w-8 h-8 fill-rose-500/20" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Tu lista de favoritos está vacía</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Puedes guardar repuestos haciendo clic en el ícono de corazón en cualquier tarjeta del catálogo o en las fochas técnicas para consultarlos más tarde.
          </p>
          <button
            type="button"
            onClick={onNavigateToCatalog}
            className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-500/20 cursor-pointer"
          >
            <span>Explorar Catálogo Suzuki OEM</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
          No se encontraron favoritos que coincidan con la búsqueda "<strong>{searchTerm}</strong>".
        </div>
      ) : (
        /* FAVORITES PRODUCT GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFavorites.map((part) => (
            <ProductCard
              key={part.id}
              part={part}
              activeMotorcycle={activeMotorcycle}
              onOpenDetail={onOpenDetail}
              onAddToCart={onAddToCart}
              onOpenGarageModal={onOpenGarageModal}
              isFavorite={true}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}

    </div>
  );
};
