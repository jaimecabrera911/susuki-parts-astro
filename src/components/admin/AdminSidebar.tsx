import React from 'react';
import { 
  Building2, 
  Package, 
  Layers, 
  FolderTree,
  ShoppingCart, 
  Users,
  Truck,
  BarChart3, 
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';

import { Tag, RotateCcw, Settings } from 'lucide-react';
import { getStoreLogo, getStoreName, getStoreTagline } from '../../utils/config';
import logoImg from '../../assets/logo.png';

const logoUrl = typeof logoImg === 'string' ? logoImg : (logoImg?.src || '/src/assets/logo.png');

export type AdminTab = 'brands' | 'models' | 'categories' | 'parts' | 'schematics' | 'orders' | 'returns' | 'users' | 'shipping' | 'settings' | 'coupons' | 'metrics';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  brandsCount: number;
  modelsCount: number;
  categoriesCount: number;
  partsCount: number;
  schematicsCount: number;
  ordersCount?: number;
  returnsCount?: number;
  usersCount?: number;
  shippingCount?: number;
  couponsCount?: number;
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
  returnsCount = 0,
  usersCount = 0,
  shippingCount = 0,
  couponsCount = 0
}) => {
  const storeLogo = getStoreLogo();
  const storeName = getStoreName();
  const storeTagline = getStoreTagline();
  const logoToShow = storeLogo || logoUrl;

  const menuItems = [
    {
      id: 'brands' as AdminTab,
      label: 'MARCAS',
      icon: Building2,
    },
    {
      id: 'models' as AdminTab,
      label: 'MODELOS DE MOTO',
      icon: FaMotorcycle,
    },
    {
      id: 'categories' as AdminTab,
      label: 'CATEGORÍAS Y SUBCAT',
      icon: FolderTree,
    },
    {
      id: 'parts' as AdminTab,
      label: 'CATÁLOGO REPUESTOS',
      icon: Package,
    },
    {
      id: 'schematics' as AdminTab,
      label: 'DESPIECES EXPLOSIÓN',
      icon: Layers,
    },
    {
      id: 'orders' as AdminTab,
      label: 'GESTIÓN DE PEDIDOS',
      icon: ShoppingCart,
    },
    {
      id: 'returns' as AdminTab,
      label: 'DEVOLUCIONES & RMA',
      icon: RotateCcw,
    },
    {
      id: 'users' as AdminTab,
      label: 'GESTIÓN DE USUARIOS',
      icon: Users,
    },
    {
      id: 'shipping' as AdminTab,
      label: 'MÉTODOS DE ENVÍO',
      icon: Truck,
    },
    {
      id: 'settings' as AdminTab,
      label: 'CONFIGURACIÓN',
      icon: Settings,
    },
    {
      id: 'coupons' as AdminTab,
      label: 'CUPONES & DESCUENTOS',
      icon: Tag,
    },
    {
      id: 'metrics' as AdminTab,
      label: 'MÉTRICAS & INFORMES',
      icon: BarChart3
    }
  ];

  return (
    <aside id="admin-sidebar" className="w-64 bg-white border-r border-slate-200 text-slate-900 flex flex-col justify-between h-screen sticky top-0 z-30 select-none shadow-xs">
      <div>
        {/* Header Suzuki Genuine Parts Workshop Branding */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white overflow-hidden flex items-center justify-center shrink-0">
              <img src={logoToShow} alt={storeName} className="w-full h-full object-cover pointer-events-none select-none" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-sm tracking-tight font-display">
                  {storeName}
                </span>
                <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-red-100 text-[#E60012] border border-red-200">
                  ADMIN
                </span>
              </div>
              <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                {storeTagline}
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
            const href = `/admin/${item.id}`;
            return (
              <a
                key={item.id}
                href={href}
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    setActiveTab(item.id);
                  }
                }}
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
              </a>
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
