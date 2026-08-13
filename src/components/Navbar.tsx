import React, { useState, useRef, useEffect } from 'react';
import { Search, Wrench, Sparkles, Layers, Menu, X, Package, Clock, ShieldCheck, ChevronRight, User, LogIn, LogOut, ChevronDown, Heart } from 'lucide-react';
import { FaCartShopping } from 'react-icons/fa6';
import type { ActiveMotorcycle } from '../types';
import { UserAvatar } from './UserAvatar';
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
  userRole?: 'customer' | 'admin';
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
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
  userName = 'Cliente Suzuki',
  isLoggedIn = true,
  userRole = 'customer',
  onOpenAuthModal,
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const storeLogo = getStoreLogo();
  const storeName = getStoreName();
  const storeTagline = getStoreTagline();
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
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <>
      <header id="navbar" className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          
          {/* Main Top Header Bar */}
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
            
            {/* Left: Mobile/Tablet Hamburger Menu Toggle + Brand Logo */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              {/* Mobile/Tablet Drawer Hamburger Button (< lg) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                aria-label="Abrir menú principal"
                title="Menú de navegación"
              >
                <Menu className="w-6 h-6 text-slate-800" aria-hidden="true" />
              </button>

              {/* Brand Logo Button */}
              <button 
                type="button"
                aria-label="Ir al Inicio - Garaje Suzuki"
                onClick={() => handleTabClick('garage')}
                className="flex items-center gap-2 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] rounded-xl p-0.5"
              >
                <div className="w-9 h-9 sm:w-11 sm:h-11 overflow-hidden rounded-xl shrink-0">
                  <img src={logoToShow} alt={storeName} className="w-full h-full object-cover pointer-events-none select-none" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[#E60012] font-black tracking-tight text-base sm:text-xl leading-none uppercase">{storeName}</span>
                  </div>
                  <span className="text-slate-900 font-extrabold text-[9px] sm:text-xs tracking-widest hidden sm:block leading-tight uppercase whitespace-nowrap">{storeTagline}</span>
                </div>
              </button>
            </div>

            {/* Desktop Search Bar (lg and up) */}
            <div className="flex-1 max-w-md hidden lg:block">
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

            {/* Desktop Navigation Links (lg and up) */}
            <nav className="hidden lg:flex items-center gap-1.5" aria-label="Navegación principal">
              <button
                type="button"
                onClick={() => handleTabClick('catalog')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
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
                className={`px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
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
                className={`px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
                  activeTab === 'schematics' 
                    ? 'text-[#E60012] bg-red-50 border-b-2 border-[#E60012]' 
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                Despieces
              </button>
            </nav>

            {/* Right Action Icons & Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              
              {/* Mobile & Tablet Search Toggle Button (< lg) */}
              <button
                type="button"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                aria-label="Buscar repuestos"
                className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-700 hover:text-[#E60012] hover:bg-slate-50 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                title="Buscar repuestos"
              >
                <Search className="w-5 h-5" aria-hidden="true" />
              </button>

              {/* AI Assistant Button */}
              <button
                type="button"
                onClick={onOpenAI}
                aria-label="Abrir asistente técnico de IA Suzuki"
                className="min-h-[40px] sm:min-h-[44px] px-2.5 sm:px-3 text-slate-800 hover:text-[#E60012] hover:bg-slate-50 rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                title="Asistente Técnico Suzuki AI"
              >
                <Sparkles className="w-4 h-4 text-[#E60012]" aria-hidden="true" />
                <span className="hidden xl:inline font-semibold text-xs">Asistente AI</span>
              </button>

              {/* Active Garage Badge Button (Desktop lg and up) */}
              <button
                type="button"
                onClick={onOpenGarageModal}
                aria-label="Abrir gestión de garaje"
                className={`hidden lg:flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl border text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
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
                <span className="xl:hidden text-[10px] font-bold uppercase truncate max-w-[90px]">
                  {activeMotorcycle ? activeMotorcycle.modelName : 'MI MOTO'}
                </span>
              </button>

              {/* User Account Dropdown (Desktop lg and up) */}
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
                    <span className="hidden xl:inline font-semibold text-xs truncate max-w-[80px]">{userName.split(' ')[0]}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
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

                      {isLoggedIn && userRole === 'admin' && (
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
                  <span className="hidden xl:inline font-extrabold text-xs">Iniciar Sesión</span>
                </button>
              )}

              {/* Cart Button */}
              <button
                type="button"
                onClick={onOpenCart}
                className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-slate-800 hover:text-[#E60012] hover:bg-slate-50 rounded-xl transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                aria-label={`Ver Carrito (${cartCount} repuestos)`}
              >
                <FaCartShopping className="w-5 h-5 text-slate-800 hover:text-[#E60012]" aria-hidden="true" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#E60012] text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>

            </div>
          </div>

          {/* Mobile & Tablet Inline Search Bar (< lg) */}
          {mobileSearchOpen && (
            <div className="lg:hidden pb-3 pt-1 border-t border-slate-200 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="relative">
                <label htmlFor="navbar-mobile-search" className="sr-only">Buscar por Ref. OEM o Nombre</label>
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
                <input
                  id="navbar-mobile-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (activeTab !== 'catalog') setActiveTab('catalog');
                  }}
                  placeholder="Buscar por Ref. OEM o Nombre..."
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile & Tablet Off-Canvas Slide-Over Drawer (< lg) */}
      {mobileMenuOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación móvil y tablet"
          className="fixed inset-0 z-50 lg:hidden flex"
        >
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Off-Canvas Drawer Panel */}
          <div className="relative w-[85%] max-w-sm sm:max-w-md bg-white text-slate-900 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-left duration-250">
            
            {/* Drawer Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <img src={logoToShow} alt={storeName} className="w-8 h-8 rounded-lg object-cover" />
                <span className="font-black text-base text-[#E60012] uppercase tracking-tight">{storeName}</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Cerrar menú móvil"
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              
              {/* User Account Status Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                {isLoggedIn ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar fullName={userName} className="w-9 h-9 shrink-0" textClassName="text-xs" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                        <span className="text-[10px] text-emerald-600 font-bold block">Cliente Verificado</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTabClick('account')}
                      className="text-xs font-bold text-[#E60012] hover:underline shrink-0"
                    >
                      Perfil
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenAuthModal) onOpenAuthModal();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Iniciar Sesión / Registro
                  </button>
                )}
              </div>

              {/* Active Motorcycle Widget */}
              <div className="bg-slate-900 text-white rounded-2xl p-3.5 relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 text-[#E60012] flex items-center justify-center shrink-0">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Moto Seleccionada</span>
                      <span className="text-xs font-extrabold truncate block">
                        {activeMotorcycle ? `${activeMotorcycle.modelName} (${activeMotorcycle.year})` : 'Sin seleccionar'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenGarageModal();
                      setMobileMenuOpen(false);
                    }}
                    className="text-[10px] font-extrabold uppercase bg-white text-slate-900 px-2.5 py-1 rounded-lg shrink-0 hover:bg-slate-100"
                  >
                    {activeMotorcycle ? 'Cambiar' : 'Elegir'}
                  </button>
                </div>
              </div>

              {/* AI Technical Assistant Card */}
              <button
                type="button"
                onClick={() => {
                  onOpenAI();
                  setMobileMenuOpen(false);
                }}
                className="w-full p-3 bg-red-50/70 border border-red-200 rounded-2xl text-left flex items-center justify-between hover:bg-red-100/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#E60012] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">Asistente IA Suzuki</span>
                    <span className="text-[10px] text-slate-500 block">Consultas técnicas y repuestos OEM</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#E60012]" />
              </button>

              {/* Navigation Links List */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider px-3 block mb-1">Navegación</span>
                
                <button
                  type="button"
                  onClick={() => handleTabClick('garage')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-colors ${
                    activeTab === 'garage' ? 'bg-red-50 text-[#E60012]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Wrench className="w-4 h-4 text-[#E60012]" />
                    Garaje & Compatibilidad
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick('catalog')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-colors ${
                    activeTab === 'catalog' ? 'bg-red-50 text-[#E60012]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-[#E60012]" />
                    Catálogo de Repuestos
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick('schematics')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-colors ${
                    activeTab === 'schematics' ? 'bg-red-50 text-[#E60012]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    Despieces Técnicos OEM
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick('orders')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-colors ${
                    activeTab === 'orders' ? 'bg-red-50 text-[#E60012]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-slate-600" />
                    Mis Pedidos
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick('favorites')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-colors ${
                    activeTab === 'favorites' ? 'bg-red-50 text-[#E60012]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    Repuestos Guardados
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {isLoggedIn && userRole === 'admin' && (
                  <a
                    href="/admin"
                    className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between text-sky-700 bg-sky-50 transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-sky-600" />
                      Panel Administrativo
                    </span>
                    <ChevronRight className="w-4 h-4 text-sky-400" />
                  </a>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            {isLoggedIn && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full py-2.5 text-xs font-extrabold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer uppercase tracking-wider"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky Bottom Navigation Bar (< lg - Mobile & Tablet viewports) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 sm:px-6 py-2 flex items-center justify-around shadow-lg">
        <button
          type="button"
          onClick={() => handleTabClick('garage')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'garage' ? 'text-[#E60012] font-black' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[9px] sm:text-[10px] uppercase tracking-tighter mt-0.5">Inicio</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('catalog')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'catalog' ? 'text-[#E60012] font-black' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[9px] sm:text-[10px] uppercase tracking-tighter mt-0.5">Catálogo</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('schematics')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'schematics' ? 'text-[#E60012] font-black' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[9px] sm:text-[10px] uppercase tracking-tighter mt-0.5">Despieces</span>
        </button>

        <button
          type="button"
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors cursor-pointer relative text-slate-500 hover:text-slate-800"
        >
          <FaCartShopping className="w-5 h-5 sm:w-6 sm:h-6" />
          {cartCount > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-[#E60012] text-white text-[9px] font-black flex items-center justify-center shadow-xs">
              {cartCount}
            </span>
          )}
          <span className="text-[9px] sm:text-[10px] uppercase tracking-tighter mt-0.5">Carrito</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('account')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'account' ? 'text-[#E60012] font-black' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[9px] sm:text-[10px] uppercase tracking-tighter mt-0.5">Cuenta</span>
        </button>
      </div>
    </>
  );
};
