import React, { useState, useEffect, useRef } from "react";
import { Search, Plus, RefreshCw, ShieldCheck, Wrench, LogOut, ChevronDown, Store, User, Menu } from "lucide-react";
import { UserAvatar } from "../UserAvatar";
import { getStoredUser, clearStoredSession } from "../../utils/auth";
import type { UserProfile } from "../../types";

interface AdminHeaderProps {
  title: string;
  subtitle: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  onRefresh?: () => void;
  user?: UserProfile | null;
  onToggleMobileMenu?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  onPrimaryAction,
  primaryActionLabel = "Nuevo Registro",
  onRefresh,
  user: propUser,
  onToggleMobileMenu
}) => {
  const [sessionUser, setSessionUser] = useState<UserProfile | null>(propUser || null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!propUser) {
      const stored = getStoredUser();
      if (stored) {
        setSessionUser(stored);
      }
    }
  }, [propUser]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearStoredSession();
    window.location.href = "/";
  };

  const activeUser = propUser || sessionUser;
  const displayName = activeUser?.fullName || "";
  const displayEmail = activeUser?.email || "";

  return (
    <header id="admin-header" className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 sticky top-0 z-20 shadow-xs space-y-3 md:space-y-0">
      
      {/* Container: Flex layout (stacked on mobile < md, single-row on >= md) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        
        {/* Top Bar Row (Mobile: title + menu button on left, user avatar on right) */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors shrink-0 cursor-pointer"
                aria-label="Abrir menú de navegación"
              >
                <Menu className="w-5 h-5 text-[#E60012]" />
              </button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono leading-none mb-0.5 truncate">
                <span>ADMINISTRACIÓN</span>
                <span>/</span>
                <span className="text-[#E60012] font-black truncate">{title}</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight font-display leading-tight truncate">
                {title}
              </h1>
              <p className="text-xs text-slate-500 font-sans hidden sm:block mt-0.5">{subtitle}</p>
            </div>
          </div>

          {/* User Avatar & Session Controls (Always top right on mobile < md) */}
          <div className="md:hidden relative flex items-center gap-2 shrink-0" ref={dropdownRef}>
            {onRefresh && (
              <button
                onClick={onRefresh}
                title="Recargar datos"
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 p-1 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer border border-slate-200 bg-slate-50"
              aria-label="Menú de perfil del administrador"
            >
              <UserAvatar
                avatarUrl={activeUser?.avatarUrl}
                fullName={displayName}
                className="w-8 h-8 rounded-xl"
                textClassName="text-xs font-black"
              />
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
                  <p className="text-xs font-black text-slate-900 truncate">{displayName}</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">{displayEmail}</p>
                  <span className="inline-flex items-center gap-1 text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-red-100 text-[#E60012] border border-red-200 mt-1">
                    Administrador
                  </span>
                </div>

                <div className="py-1">
                  <a
                    href="/"
                    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-colors"
                  >
                    <Store className="w-3.5 h-3.5 text-[#E60012]" />
                    <span>Volver a la Tienda</span>
                  </a>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-600" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls Row (Search input + Refresh + Primary CTA + Desktop Avatar) */}
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
          
          {/* Search Bar */}
          <div className="relative flex-1 md:w-64 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-7 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 transition-all font-medium font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Desktop Refresh button (>= md) */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Recargar datos"
              className="hidden md:flex p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Primary Action Button (Suzuki Red CTA per DESIGN.md) */}
          {onPrimaryAction && (
            <button
              onClick={onPrimaryAction}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all duration-150 flex items-center gap-1.5 active:scale-[0.98] cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{primaryActionLabel}</span>
            </button>
          )}

          {/* Desktop Admin Avatar Badge (>= md) */}
          <div className="hidden md:block relative pl-3 border-l border-slate-200" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              title="Opciones de perfil y sesión"
            >
              <UserAvatar
                avatarUrl={activeUser?.avatarUrl}
                fullName={displayName}
                className="w-9 h-9 rounded-xl"
                textClassName="text-xs font-black"
              />
              <div className="hidden xl:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-400 font-mono font-medium truncate max-w-[140px]">
                  {displayEmail}
                </p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
                  <p className="text-xs font-black text-slate-900 truncate">{displayName}</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">{displayEmail}</p>
                  <span className="inline-flex items-center gap-1 text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-red-100 text-[#E60012] border border-red-200 mt-1">
                    Administrador
                  </span>
                </div>

                <div className="py-1">
                  <a
                    href="/"
                    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-colors"
                  >
                    <Store className="w-3.5 h-3.5 text-[#E60012]" />
                    <span>Volver a la Tienda</span>
                  </a>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-600" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
