import React from 'react';
import { 
  Building2, 
  Bike, 
  Package, 
  Layers, 
  FolderTree,
  ShoppingCart, 
  Users,
  BarChart3, 
  ArrowLeft,
  ChevronRight
} from 'lucide-react';

export type AdminTab = 'brands' | 'models' | 'categories' | 'parts' | 'schematics' | 'orders' | 'users' | 'metrics';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  brandsCount: number;
  modelsCount: number;
  categoriesCount: number;
  partsCount: number;
  schematicsCount: number;
  ordersCount?: number;
  usersCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  brandsCount,
  modelsCount,
  categoriesCount,
  partsCount,
  schematicsCount,
  ordersCount = 0,
  usersCount = 0
}) => {
  const menuItems = [
    {
      id: 'brands' as AdminTab,
      label: 'MARCAS',
      icon: Building2,
      count: brandsCount,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
    },
    {
      id: 'models' as AdminTab,
      label: 'MODELOS DE MOTO',
      icon: Bike,
      count: modelsCount,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'categories' as AdminTab,
      label: 'CATEGORÍAS Y SUBCAT',
      icon: FolderTree,
      count: categoriesCount,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'parts' as AdminTab,
      label: 'CATÁLOGO REPUESTOS',
      icon: Package,
      count: partsCount,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
    },
    {
      id: 'schematics' as AdminTab,
      label: 'DESPIECES EXPLOSIÓN',
      icon: Layers,
      count: schematicsCount,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      id: 'orders' as AdminTab,
      label: 'GESTIÓN DE PEDIDOS',
      icon: ShoppingCart,
      count: ordersCount,
      badgeColor: 'bg-red-50 text-[#E60012] border-red-200 font-bold'
    },
    {
      id: 'users' as AdminTab,
      label: 'GESTIÓN DE USUARIOS',
      icon: Users,
      count: usersCount,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 font-bold'
    },
    {
      id: 'metrics' as AdminTab,
      label: 'MÉTRICAS & INFORMES',
      icon: BarChart3
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 text-slate-900 flex flex-col justify-between h-screen sticky top-0 z-30 select-none shadow-xs">
      <div>
        {/* Header Suzuki Genuine Parts Workshop Branding */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E60012] flex items-center justify-center text-white font-black text-xl tracking-tighter shadow-md shadow-red-500/20 shrink-0">
              S
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-sm tracking-tight font-display">
                  SUZUKI
                </span>
                <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-red-100 text-[#E60012] border border-red-200">
                  ADMIN
                </span>
              </div>
              <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                PARTS EXPERT
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="p-3 space-y-1">
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
            MÓDULOS DE CONTROL
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 group border ${
                  isActive
                    ? 'bg-red-50 text-[#E60012] border-red-200 shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#E60012]' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <span className="tracking-wide font-sans">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-md font-mono font-bold border ${
                      isActive
                        ? 'bg-[#E60012] text-white border-[#E60012]'
                        : item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Return Link */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70">
        <a
          href="/"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-all text-xs font-bold group border border-slate-200 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4 text-[#E60012] group-hover:-translate-x-0.5 transition-transform" />
            <span>Volver a la Tienda</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </aside>
  );
};
