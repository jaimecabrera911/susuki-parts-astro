import React, { useEffect } from 'react';
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
  ArrowLeft,
  Search,
  Plus,
  X,
  Tag,
  RotateCcw,
  Settings,
  Boxes,
} from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import type { AdminTab } from './AdminSidebar';
import { hasModulePermission, getStoredUser } from '../../utils/auth';

interface AdminMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
}

const menuItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: 'brands', label: 'MARCAS', icon: Building2 },
  { id: 'models', label: 'MODELOS DE MOTO', icon: FaMotorcycle },
  { id: 'categories', label: 'CATEGORÍAS Y SUBCAT', icon: FolderTree },
  { id: 'parts', label: 'CATÁLOGO REPUESTOS', icon: Package },
  { id: 'kardex', label: 'KARDEX & INVENTARIO', icon: Boxes },
  { id: 'schematics', label: 'DESPIECES EXPLOSIÓN', icon: Layers },
  { id: 'orders', label: 'GESTIÓN DE PEDIDOS', icon: ShoppingCart },
  { id: 'returns', label: 'DEVOLUCIONES & RMA', icon: RotateCcw },
  { id: 'users', label: 'GESTIÓN DE USUARIOS', icon: Users },
  { id: 'shipping', label: 'MÉTODOS DE ENVÍO', icon: Truck },
  { id: 'payments', label: 'MEDIOS DE PAGO', icon: CreditCard },
  { id: 'settings', label: 'CONFIGURACIÓN', icon: Settings },
  { id: 'coupons', label: 'CUPONES & DESCUENTOS', icon: Tag },
  { id: 'metrics', label: 'MÉTRICAS & INFORMES', icon: BarChart3 },
];

export const AdminMobileMenu: React.FC<AdminMobileMenuProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  searchQuery,
  onSearchChange,
  onPrimaryAction,
  primaryActionLabel,
}) => {
  const currentUser = getStoredUser();
  const visibleMenuItems = menuItems.filter(item => hasModulePermission(currentUser, item.id, 'read'));
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (tab: AdminTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <div id="admin-mobile-menu" className="lg:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative w-[300px] max-w-[85vw] h-full bg-white shadow-2xl flex flex-col overflow-hidden navbar-slide-down">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              PANEL ADMINISTRATIVO
            </p>
            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
              Módulos de control
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search + Primary Action */}
        <div className="p-3 border-b border-slate-100 space-y-2 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por nombre, ref..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 transition-all font-medium"
            />
          </div>
          {onPrimaryAction && primaryActionLabel && (
            <button
              type="button"
              onClick={() => {
                onPrimaryAction();
                onClose();
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{primaryActionLabel}</span>
            </button>
          )}
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-red-50 text-[#E60012] border border-red-200 shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#E60012]' : 'text-slate-400'}`} />
                <span className="tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer - Volver a la tienda */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70 shrink-0">
          <a
            href="/"
            className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 transition-all text-xs font-bold border border-slate-200 shadow-xs"
          >
            <span className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4 text-[#E60012]" />
              Volver a la Tienda
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};