import React from 'react';
import { Wrench, Package, Layers, Menu } from 'lucide-react';
import { FaCartShopping } from 'react-icons/fa6';

type Tab = 'catalog' | 'garage' | 'schematics' | 'orders' | 'product-page' | 'account' | 'checkout' | 'favorites' | 'contact';

interface MobileDockProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenMenu: () => void;
}

export const MobileDock: React.FC<MobileDockProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart,
  onOpenMenu
}) => {
  return (
    <nav
      id="mobile-dock"
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
      aria-label="Navegación principal"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {/* Garage / Home */}
        <button
          type="button"
          onClick={() => setActiveTab('garage')}
          className={`flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-xl transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
            activeTab === 'garage'
              ? 'text-[#E60012]'
              : 'text-slate-500 active:text-slate-700'
          }`}
          aria-label="Mi Garaje"
        >
          <Wrench className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'garage' ? 'scale-110' : ''}`} />
          <span className="text-[9px] font-bold uppercase tracking-wider leading-none">Garaje</span>
          {activeTab === 'garage' && (
            <span className="absolute top-1.5 w-1 h-1 rounded-full bg-[#E60012]" />
          )}
        </button>

        {/* Catálogo */}
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-xl transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
            activeTab === 'catalog'
              ? 'text-[#E60012]'
              : 'text-slate-500 active:text-slate-700'
          }`}
          aria-label="Catálogo de Repuestos"
        >
          <Package className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'catalog' ? 'scale-110' : ''}`} />
          <span className="text-[9px] font-bold uppercase tracking-wider leading-none">Catálogo</span>
          {activeTab === 'catalog' && (
            <span className="absolute top-1.5 w-1 h-1 rounded-full bg-[#E60012]" />
          )}
        </button>

        {/* Despieces */}
        <button
          type="button"
          onClick={() => setActiveTab('schematics')}
          className={`flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-xl transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
            activeTab === 'schematics'
              ? 'text-[#E60012]'
              : 'text-slate-500 active:text-slate-700'
          }`}
          aria-label="Despieces Técnicos"
        >
          <Layers className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'schematics' ? 'scale-110' : ''}`} />
          <span className="text-[9px] font-bold uppercase tracking-wider leading-none">Despieces</span>
          {activeTab === 'schematics' && (
            <span className="absolute top-1.5 w-1 h-1 rounded-full bg-[#E60012]" />
          )}
        </button>

        {/* Carrito */}
        <button
          type="button"
          onClick={onOpenCart}
          className="relative flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-xl text-slate-500 active:text-slate-700 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
          aria-label={`Carrito (${cartCount} repuestos)`}
        >
          <FaCartShopping className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider leading-none">Carrito</span>
          {cartCount > 0 && (
            <span className="absolute top-1 right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E60012] text-white text-[10px] font-black flex items-center justify-center shadow-sm">
              {cartCount}
            </span>
          )}
        </button>

        {/* Menú */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-xl text-slate-500 active:text-slate-700 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
          aria-label="Abrir Menú"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider leading-none">Menú</span>
        </button>
      </div>

      {/* Safe area for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};
