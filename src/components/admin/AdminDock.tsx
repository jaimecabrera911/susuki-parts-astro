import React, { useRef, useEffect } from "react";
import {
  BarChart3,
  Building2,
  FolderTree,
  Package,
  Layers,
  ShoppingCart,
  RotateCcw,
  Truck,
  Tag,
  Users,
  Settings,
  Store,
} from "lucide-react";
import { FaMotorcycle } from "react-icons/fa";
import type { AdminTab } from "./AdminSidebar";

interface AdminDockProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

interface DockItem {
  id: AdminTab | "store";
  label: string;
  icon: React.ReactNode;
  isStore?: boolean;
}

export const AdminDock: React.FC<AdminDockProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const activeRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll active tab into view when selected
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeTab]);

  const items: DockItem[] = [
    { id: "metrics", label: "Métricas", icon: <BarChart3 className="w-5 h-5 sm:w-5 sm:h-5" /> },
    { id: "brands", label: "Marcas", icon: <Building2 className="w-5 h-5 sm:w-5 sm:h-5" /> },
    { id: "models", label: "Modelos", icon: <FaMotorcycle className="w-5 h-5 sm:w-5 sm:h-5" /> },
    { id: "categories", label: "Categorías", icon: <FolderTree className="w-5 h-5 sm:w-5 sm:h-5" /> },
    { id: "parts", label: "Repuestos", icon: <Package className="w-5 h-5 sm:w-5 sm:h-5" /> },
    { id: "schematics", label: "Despieces", icon: <Layers className="w-5 h-5 sm:w-5 sm:h-5" /> },
    { id: "orders", label: "Pedidos", icon: <ShoppingCart className="w-5 h-5 sm:w-5 sm:h-5" /> },
    { id: "returns", label: "Devoluciones", icon: <RotateCcw className="w-5 h-5 sm:w-5 sm:h-5" /> },
    { id: "shipping", label: "Envíos", icon: <Truck className="w-5 h-5 sm:w-5 sm:h-5" /> },
    { id: "coupons", label: "Cupones", icon: <Tag className="w-5 h-5 sm:w-5 sm:h-5" /> },
    { id: "users", label: "Usuarios", icon: <Users className="w-5 h-5 sm:w-5 sm:h-5" /> },
    { id: "settings", label: "Ajustes", icon: <Settings className="w-5 h-5 sm:w-5 sm:h-5" /> },
    { id: "store", label: "Tienda", icon: <Store className="w-5 h-5 sm:w-5 sm:h-5 text-red-400" />, isStore: true },
  ];

  return (
    <div
      id="admin-dock"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md text-white border-t border-slate-800 border-t-red-600/40 shadow-2xl px-1.5 py-1.5 animate-in slide-in-from-bottom duration-200"
    >
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-1 snap-x snap-mandatory scroll-smooth"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {items.map((item) => {
          if (item.isStore) {
            return (
              <a
                key={item.id}
                href="/"
                className="snap-center shrink-0 flex flex-col items-center justify-center py-1.5 px-3 rounded-xl min-w-[68px] sm:min-w-[76px] transition-all cursor-pointer text-slate-300 hover:text-white hover:bg-slate-800/80 font-bold text-center border border-slate-800 hover:border-red-500/30"
              >
                {item.icon}
                <span className="text-[9px] sm:text-[10px] uppercase tracking-tighter mt-1 font-bold whitespace-nowrap">
                  {item.label}
                </span>
              </a>
            );
          }

          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              ref={isActive ? activeRef : null}
              type="button"
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={`snap-center shrink-0 flex flex-col items-center justify-center py-1.5 px-3 rounded-xl min-w-[68px] sm:min-w-[76px] transition-all cursor-pointer text-center ${
                isActive
                  ? "bg-[#E60012] text-white font-black shadow-md shadow-red-600/30 scale-105"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-semibold"
              }`}
            >
              {item.icon}
              <span className="text-[9px] sm:text-[10px] uppercase tracking-tighter mt-1 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
