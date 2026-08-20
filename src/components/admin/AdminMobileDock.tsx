import React from 'react';
import {
  Building2,
  Package,
  Layers,
  FolderTree,
  ShoppingCart,
  Users,
  Truck,
  CreditCard,
  BarChart3,
  Menu,
  Tag,
  RotateCcw,
  Settings,
} from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import type { AdminTab } from './AdminSidebar';

interface AdminMobileDockProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  onOpenMenu: () => void;
}

export const AdminMobileDock: React.FC<AdminMobileDockProps> = ({
  activeTab,
  setActiveTab,
  onOpenMenu,
}) => {
  const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'brands', label: 'Marcas', icon: Building2 },
    { id: 'models', label: 'Modelos', icon: FaMotorcycle },
    { id: 'categories', label: 'Categorías', icon: FolderTree },
    { id: 'parts', label: 'Repuestos', icon: Package },
    { id: 'schematics', label: 'Despieces', icon: Layers },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { id: 'returns', label: 'Devoluciones', icon: RotateCcw },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'shipping', label: 'Envío', icon: Truck },
    { id: 'payments', label: 'Pagos', icon: CreditCard },
    { id: 'settings', label: 'Config', icon: Settings },
    { id: 'coupons', label: 'Cupones', icon: Tag },
    { id: 'metrics', label: 'Métricas', icon: BarChart3 },
  ];

  return (
    <nav
      id="admin-mobile-dock"
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
      aria-label="Navegación administrativa"
    >
      <div className="flex items-stretch h-16 max-w-5xl mx-auto">
        {/* Pista de scroll horizontal con todos los módulos */}
        <div className="flex-1 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory">
          <div className="flex items-center h-16 px-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex flex-col items-center justify-center gap-0.5 w-16 h-16 shrink-0 snap-center rounded-xl transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
                    isActive ? 'text-[#E60012]' : 'text-slate-500 active:text-slate-700'
                  }`}
                  aria-label={tab.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  <span className="text-[9px] font-bold uppercase tracking-wider leading-none text-center px-1">
                    {tab.label}
                  </span>
                  {isActive && (
                    <span className="absolute top-1.5 w-1 h-1 rounded-full bg-[#E60012]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Menú — drawer con búsqueda y acciones */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="shrink-0 w-14 h-16 flex flex-col items-center justify-center gap-0.5 border-l border-slate-200 text-slate-500 active:text-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E60012]"
          aria-label="Abrir menú de módulos"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider leading-none">Menú</span>
        </button>
      </div>

      {/* Safe area para iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};