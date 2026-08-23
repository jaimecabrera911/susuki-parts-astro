import React, { useState, useRef, useEffect } from 'react';
import { Search, Wrench, Sparkles, Layers, Menu, X, Package, Clock, ShieldCheck, ChevronRight, User, LogIn, LogOut, ChevronDown, Heart } from 'lucide-react';
import { FaCartShopping } from 'react-icons/fa6';
import type { ActiveMotorcycle } from '../types';
import { UserAvatar } from './UserAvatar';
import { useSiteSettings } from './SiteSettingsProvider';
import { getStoreLogo, getStoreName, getStoreTagline } from '../utils/config';
import logoImg from '../assets/logo.png';

const logoUrl = typeof logoImg === 'string' ? logoImg : (logoImg?.src || '/src/assets/logo.png');


interface NavbarProps {
  activeMotorcycle: ActiveMotorcycle | null;
  cartCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeTab: 'catalog' | 'garage' | 'schematics' | 'orders' | 'product-page' | 'account' | 'checkout' | 'favorites' | 'contact';
  setActiveTab: (tab: 'catalog' | 'garage' | 'schematics' | 'orders' | 'product-page' | 'account' | 'checkout' | 'favorites' | 'contact') => void;

  onOpenGarageModal: () => void;
  onOpenCart: () => void;
  onOpenAI: () => void;
  userName?: string;
  isLoggedIn?: boolean;
  userRole?: string;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeMotorcycle,
  cartCount,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  onOpenGarageModal,
  onOpenCart,
  onOpenAI,
  userName = '',
  isLoggedIn = true,
  userRole = 'customer',
  onOpenAuthModal,
  onLogout,
  mobileMenuOpen = false,
  setMobileMenuOpen
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen?.(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen?.(false);

  const { settings } = useSiteSettings();

  const storeLogo = settings.storeLogo || getStoreLogo();
  const storeName = settings.storeName || getStoreName();
  const storeTagline = settings.storeTagline || getStoreTagline();
  const logoToShow = storeLogo || logoUrl;

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabClick = (tab: 'catalog' | 'garage' | 'schematics' | 'orders' | 'product-page' | 'account' | 'favorites') => {
    if (tab === 'account' && !isLoggedIn && onOpenAuthModal) {
      onOpenAuthModal();
      return;
    }
    setActiveTab(tab);
    closeMobileMenu();
    setUserDropdownOpen(false);
  };




  return (
    <header id="navbar" className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* Logo */}
          <button 
            type="button"
            role="button"
            aria-label="Ir al Inicio - Garaje Suzuki"
            onClick={() => handleTabClick('garage')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTabClick('garage');
              }
            }}
            className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] rounded-xl p-1"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 overflow-hidden rounded-xl shrink-0">
              <img src={logoToShow} alt={storeName} className="w-full h-full object-cover pointer-events-none select-none" />
            </div>
            <div className="hidden min-[380px]:block">
              <div className="flex items-center gap-1">
                <span className="text-[#E60012] font-black tracking-tight text-base sm:text-lg md:text-xl leading-none uppercase">{storeName}</span>
              </div>
              <span className="text-slate-900 font-extrabold text-[9px] sm:text-[10px] md:text-xs tracking-widest block leading-tight uppercase whitespace-nowrap">{storeTagline}</span>
            </div>
          </button>

          {/* Desktop Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <label htmlFor="navbar-desktop-search" className="sr-only">Buscar por Ref. OEM o Nombre</label>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
              <input
                id="navbar-desktop-search"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab !== 'catalog') setActiveTab('catalog');
                }}
                placeholder="Buscar por Ref. OEM o Nombre (Ej. 13780-06G00)..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012] transition-all"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Navegación principal">
            <button
              type="button"
              onClick={() => handleTabClick('catalog')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
                activeTab === 'catalog' 
                  ? 'text-[#E60012] bg-red-50 border-b-2 border-[#E60012]' 
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Catálogo
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('garage')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
                activeTab === 'garage' 
                  ? 'text-[#E60012] bg-red-50 border-b-2 border-[#E60012]' 
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Garaje
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('schematics')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
                activeTab === 'schematics' 
                  ? 'text-[#E60012] bg-red-50 border-b-2 border-[#E60012]' 
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              Despieces
            </button>
          </nav>



          {/* Right Action Icons & Buttons (Desktop & Mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* AI Assistant Button - desktop only, available in drawer on mobile */}
            <button
              type="button"
              onClick={onOpenAI}
              aria-label="Abrir asistente técnico de IA Suzuki"
              className="hidden lg:flex min-h-[44px] px-3 text-slate-800 hover:text-[#E60012] hover:bg-slate-50 rounded-xl border border-slate-300 transition-colors items-center gap-1.5 text-xs font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
              title="Asistente Técnico Suzuki AI"
            >
              <Sparkles className="w-4 h-4 text-[#E60012]" aria-hidden="true" />
              <span className="font-semibold text-xs">Asistente AI</span>
            </button>

            {/* Active Garage Badge Button - desktop only */}
            <button
              type="button"
              onClick={onOpenGarageModal}
              aria-label="Abrir gestión de garaje"
              className={`hidden lg:flex items-center gap-1.5 px-2 sm:px-3 py-2 min-h-[44px] rounded-xl border text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
                activeMotorcycle
                  ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800 shadow-xs'
                  : 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <Wrench className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
              <div className="text-left leading-tight hidden xl:block">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-normal">GARAJE ACTIVO</span>
                <span className="truncate max-w-[100px] inline-block font-semibold">
                  {activeMotorcycle ? `${activeMotorcycle.modelName}` : 'SELECCIONAR'}
                </span>
              </div>
              <span className="xl:hidden text-[10px] font-bold uppercase truncate max-w-[70px] sm:max-w-[100px] md:max-w-[120px]">
                {activeMotorcycle ? activeMotorcycle.modelName : 'MI MOTO'}
              </span>
            </button>

            {/* User Account Dropdown - desktop only, available in drawer on mobile */}

            {isLoggedIn ? (
              <div className="relative hidden lg:block" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-label="Menú de usuario"
                  className={`min-h-[44px] px-3 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
                    activeTab === 'account'
                      ? 'bg-red-50 text-[#E60012] border-red-300'
                      : 'text-slate-800 hover:text-[#E60012] hover:bg-slate-50 border-slate-300'
                  }`}
                  title="Mi Cuenta Suzuki"
                >
                  <UserAvatar fullName={userName} className="w-6.5 h-6.5" textClassName="text-[10px]" />
                  <span className="hidden sm:inline font-semibold text-xs truncate max-w-[80px]">{userName.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 navbar-fade-in">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Cliente Verificado</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTabClick('account')}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-[#E60012]" />
                      <span>Mi Cuenta / Perfil</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTabClick('orders')}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5 text-blue-600" />
                      <span>Mis Pedidos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTabClick('favorites')}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      <span>Repuestos Guardados</span>
                    </button>

                    {isLoggedIn && userRole && userRole !== 'customer' && (
                      <a
                        href="/admin"
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                        <span>Panel Admin (Marcas/Modelos)</span>
                      </a>
                    )}



                    <div className="pt-1 mt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-600" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                aria-label="Iniciar Sesión"
                className="hidden lg:flex min-h-[44px] px-3 bg-[#E60012] hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all items-center gap-1.5 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                title="Iniciar Sesión"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline font-extrabold text-xs">Iniciar Sesión</span>
              </button>
            )}

            {/* Cart Button */}

            <button
              type="button"
              onClick={onOpenCart}
              className="relative w-11 h-11 flex items-center justify-center text-slate-800 hover:text-[#E60012] hover:bg-slate-50 rounded-xl transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
              aria-label={`Ver Carrito (${cartCount} repuestos)`}
            >
              <FaCartShopping className="w-5 h-5" aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#E60012] text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Hamburger Toggle */}
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="lg:hidden w-11 h-11 flex items-center justify-center text-slate-800 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer ml-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
              aria-label={mobileMenuOpen ? "Cerrar Menú" : "Abrir Menú"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 shadow-xl navbar-slide-down">
          <div className="w-full max-w-[1720px] mx-auto px-4 py-3 space-y-1">
            
            {/* Quick Mobile Search inside Drawer */}
            <div className="mb-3 md:hidden">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (activeTab !== 'catalog') setActiveTab('catalog');
                  }}
                  placeholder="Buscar repuestos..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                />
              </div>
            </div>

            <button
              onClick={() => handleTabClick('catalog')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-colors ${
                activeTab === 'catalog'
                  ? 'bg-red-50 text-[#E60012]'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-[#E60012]" />
                Catálogo de Repuestos
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => handleTabClick('garage')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-colors ${
                activeTab === 'garage'
                  ? 'bg-red-50 text-[#E60012]'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Wrench className="w-4 h-4 text-amber-600" />
                Mi Garaje & Compatibilidad
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => handleTabClick('schematics')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-colors ${
                activeTab === 'schematics'
                  ? 'bg-red-50 text-[#E60012]'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-blue-600" />
                Despieces Técnicos OEM
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => handleTabClick('orders')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-colors ${
                activeTab === 'orders'
                  ? 'bg-red-50 text-[#E60012]'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-600" />
                Mis Pedidos
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {isLoggedIn ? (
              <>
                <button
                  onClick={() => handleTabClick('account')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-colors ${
                    activeTab === 'account'
                      ? 'bg-red-50 text-[#E60012]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-red-600" />
                    Mi Cuenta ({userName})
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {isLoggedIn && userRole && userRole !== 'customer' && (
                  <a
                    href="/admin"
                    onClick={() => closeMobileMenu()}
                    className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-colors ${
                      'text-slate-700 hover:bg-sky-50 hover:text-sky-700'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-sky-600" />
                      Panel Admin (Marcas/Modelos)
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </a>
                )}

                <button
                  onClick={() => {
                    closeMobileMenu();
                    if (onLogout) onLogout();
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between text-red-600 hover:bg-red-50 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <LogOut className="w-4 h-4 text-red-600" />
                    Cerrar Sesión
                  </span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  if (onOpenAuthModal) onOpenAuthModal();
                  closeMobileMenu();
                }}
                className="w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between bg-red-50 text-[#E60012] border border-red-100"
              >
                <span className="flex items-center gap-2.5">
                  <LogIn className="w-4 h-4 text-[#E60012]" />
                  Iniciar Sesión / Crear Cuenta
                </span>
                <ChevronRight className="w-4 h-4 text-[#E60012]" />
              </button>
            )}



            <div className="pt-2 mt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  onOpenAI();
                  closeMobileMenu();
                }}
                className="w-full text-left px-4 py-3 bg-red-50/60 text-[#E60012] rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between border border-red-100"
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#E60012]" />
                  Asistente IA Suzuki Expert
                </span>
                <ChevronRight className="w-4 h-4 text-[#E60012]" />
              </button>
            </div>

            {/* Motorcycle Context Summary in Mobile Drawer */}
            <div className="pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Motocicleta Activa</span>
                    <span className="text-xs font-black text-slate-900">
                      {activeMotorcycle ? `${activeMotorcycle.modelName} (${activeMotorcycle.year})` : 'Ninguna Seleccionada'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onOpenGarageModal();
                    closeMobileMenu();
                  }}
                  className="text-[11px] font-extrabold text-[#E60012] bg-white border border-red-200 px-2.5 py-1 rounded-lg"
                >
                  {activeMotorcycle ? 'Cambiar' : 'Seleccionar'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};

