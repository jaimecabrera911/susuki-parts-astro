import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CompatibilitySelector } from './components/CompatibilitySelector';
import { TechnicalSearchCard } from './components/TechnicalSearchCard';
import { IdentificationGuideModal } from './components/IdentificationGuideModal';
import { GarageModal } from './components/GarageModal';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ProductDetailPage } from './components/ProductDetailPage';
import { ExplodedView } from './components/ExplodedView';
import { AIAssistantModal } from './components/AIAssistantModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { CheckoutPage } from './components/CheckoutPage';
import { FavoritesPage } from './components/FavoritesPage';
import { OrdersModal } from './components/OrdersModal';


import { UserProfilePage } from './components/UserProfilePage';
import { AuthModal } from './components/AuthModal';
import { CatalogSidebarFilter } from './components/CatalogSidebarFilter';

import { WhatsAppWidget } from './components/WhatsAppWidget';
import { SUZUKI_PARTS } from './data/suzukiData';
import type { ActiveMotorcycle, SuzukiPart, CartItem, AvailabilityStatus, UserProfile } from './types';
import { getAvailabilityStatus, AVAILABILITY_META, matchesOem, getPrimaryOem } from './types';
import { ShieldCheck, Wrench, ArrowRight, Layers, FileSearch, Sparkles, CheckCircle2, ArrowUpDown } from 'lucide-react';


export default function App() {
  // State for active motorcycle in garage
  const [activeMotorcycle, setActiveMotorcycle] = useState<ActiveMotorcycle | null>(() => {
    const saved = localStorage.getItem('sz_active_moto');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    // Default initial bike for instant seamless demo (GSX-R1000)
    return {
      brand: 'SUZUKI',
      modelId: 'gsx-r1000',
      modelName: 'GSX-R1000',
      year: 2021,
      version: 'GSX-R1000R Spec'
    };
  });

  const [savedGarages, setSavedGarages] = useState<ActiveMotorcycle[]>(() => {
    const saved = localStorage.getItem('sz_saved_garages');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [
      { brand: 'SUZUKI', modelId: 'gsx-r1000', modelName: 'GSX-R1000', year: 2021, version: 'GSX-R1000R Spec' },
      { brand: 'SUZUKI', modelId: 'gixxer-150-fi', modelName: 'Gixxer 150 FI', year: 2020, version: 'FI ABS (Disco Doble)' },
      { brand: 'SUZUKI', modelId: 'vstrom-650', modelName: 'V-Strom 650', year: 2021, version: 'DL650 XT Spoke Wheels' }
    ];
  });

  // Auth & Login State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem('sz_is_logged_in');
    return saved !== null ? saved === 'true' : true;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sz_is_logged_in', isLoggedIn ? 'true' : 'false');
  }, [isLoggedIn]);

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('sz_user_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      id: 'USR-8849',
      fullName: 'Juan Pérez',
      email: 'juan.perez@mototaller.com',
      phone: '+57 310 982 7311',
      documentId: '1.098.472.910',
      city: 'Bogotá D.C.',
      address: 'Av. Central #450, Taller Mecánico Motos',
      postalCode: '110111',
      favoritePartIds: ['suzuki-gsxr-1000-air-filter', 'suzuki-gixxer-150-brake-pads'],
      createdAt: 'Marzo 2024'
    };
  });

  useEffect(() => {
    localStorage.setItem('sz_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  const handleLoginSuccess = (user: UserProfile) => {
    setUserProfile(user);
    setIsLoggedIn(true);
    navigateToTab('account');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigateToTab('garage');
  };

  const handleToggleFavorite = (partId: string) => {
    setUserProfile(prev => {
      const exists = prev.favoritePartIds.includes(partId);
      const updatedFavorites = exists
        ? prev.favoritePartIds.filter(id => id !== partId)
        : [...prev.favoritePartIds, partId];
      return { ...prev, favoritePartIds: updatedFavorites };
    });
  };

  // App Navigation & Modal States
  const [activeTab, setActiveTab] = useState<'garage' | 'catalog' | 'schematics' | 'orders' | 'product-page' | 'account' | 'checkout' | 'favorites'>('garage');

  const [selectedPagePart, setSelectedPagePart] = useState<SuzukiPart | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [onlyCompatible, setOnlyCompatible] = useState(true);

  // Dynamic Catalog Filter States
  const [availabilityFilter, setAvailabilityFilter] = useState<Set<AvailabilityStatus>>(
    () => new Set<AvailabilityStatus>(['in_stock', 'international', 'on_order'])
  );
  const [maxPriceFilter, setMaxPriceFilter] = useState(1000000);
  const [minPriceFilter, setMinPriceFilter] = useState(20000);
  const [sortBy, setSortBy] = useState('relevance');

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setAvailabilityFilter(new Set<AvailabilityStatus>(['in_stock', 'international', 'on_order']));
    setMaxPriceFilter(1000000);
    setMinPriceFilter(20000);
    setSearchQuery('');
    setSortBy('relevance');
  };

  const navigateToTab = (tab: 'garage' | 'catalog' | 'schematics' | 'orders' | 'product-page' | 'account' | 'checkout' | 'favorites', pathOverride?: string) => {
    // Clear schematic targets when leaving the schematics view to avoid stale pre-selection
    if (tab !== 'schematics') {
      setSchematicTargetId(undefined);
      setSchematicTargetPartId(undefined);
    }
    setActiveTab(tab);
    let targetPath = '/garaje';
    if (tab === 'catalog') targetPath = '/catalogo';
    else if (tab === 'schematics') targetPath = '/despieces';
    else if (tab === 'orders') targetPath = '/pedidos';
    else if (tab === 'account') targetPath = '/cuenta';
    else if (tab === 'checkout') targetPath = '/completar-pedido';
    else if (tab === 'favorites') targetPath = '/favoritos';
    else if (pathOverride) targetPath = pathOverride;

    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  // Listen to URL path and hash changes for clean HTML5 SPA routing
  useEffect(() => {
    const handleLocationChange = () => {
      const pathname = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      // Check product page route (/producto/REF or #producto=REF)
      if (pathname.startsWith('/producto/')) {
        const oem = decodeURIComponent(pathname.replace('/producto/', ''));
        const found = SUZUKI_PARTS.find(
          p => matchesOem(p, oem) || p.id === oem
        );
        if (found) {
          setSelectedPagePart(found);
          setActiveTab('product-page');
          return;
        }
      } else if (hash.startsWith('#producto=')) {
        const oem = decodeURIComponent(hash.replace('#producto=', ''));
        const found = SUZUKI_PARTS.find(
          p => matchesOem(p, oem) || p.id === oem
        );
        if (found) {
          setSelectedPagePart(found);
          setActiveTab('product-page');
          return;
        }
      }

      // Check clean path names
      if (pathname === '/catalogo' || hash === '#catalogo' || hash === '#catalog') {
        setActiveTab('catalog');
      } else if (pathname === '/despieces' || hash === '#despieces' || hash === '#schematics') {
        setActiveTab('schematics');
      } else if (pathname === '/pedidos' || hash === '#pedidos' || hash === '#orders') {
        setActiveTab('orders');
      } else if (pathname === '/cuenta' || pathname === '/usuario' || hash === '#cuenta' || hash === '#perfil') {
        setActiveTab('account');
      } else if (pathname === '/completar-pedido' || hash === '#completar-pedido' || hash === '#checkout') {
        setActiveTab('checkout');
      } else if (pathname === '/favoritos' || hash === '#favoritos' || hash === '#favorites') {
        setActiveTab('favorites');
      } else if (pathname === '/garaje' || pathname === '/' || hash === '#garaje' || hash === '#garage') {
        if (pathname === '/') {
          window.history.replaceState(null, '', '/garaje');
        }
        setActiveTab('garage');
      }
    };


    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);

    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const handleOpenProductPage = (part: SuzukiPart) => {
    setSelectedPagePart(part);
    setActiveTab('product-page');
    window.history.pushState(null, '', `/producto/${encodeURIComponent(getPrimaryOem(part))}`);
  };

  const handleBackFromProductPage = () => {
    setSelectedPagePart(null);
    navigateToTab('catalog');
  };

  // Cart & Orders State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Modals
  const [isGarageModalOpen, setIsGarageModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPartDetail, setSelectedPartDetail] = useState<SuzukiPart | null>(null);
  const [schematicTargetId, setSchematicTargetId] = useState<string | undefined>(undefined);
  const [schematicTargetPartId, setSchematicTargetPartId] = useState<string | undefined>(undefined);

  // Save motorcycle in localStorage
  useEffect(() => {
    if (activeMotorcycle) {
      localStorage.setItem('sz_active_moto', JSON.stringify(activeMotorcycle));
      // Add to saved garages list if not present
      setSavedGarages(prev => {
        const exists = prev.some(m => m.modelId === activeMotorcycle.modelId && m.year === activeMotorcycle.year && m.version === activeMotorcycle.version);
        if (exists) return prev;
        const updated = [activeMotorcycle, ...prev];
        localStorage.setItem('sz_saved_garages', JSON.stringify(updated));
        return updated;
      });
    } else {
      localStorage.removeItem('sz_active_moto');
    }
  }, [activeMotorcycle]);

  const handleSelectMotorcycle = (moto: ActiveMotorcycle) => {
    setActiveMotorcycle(moto);
    setOnlyCompatible(true);
    navigateToTab('catalog');

    setTimeout(() => {
      const target = document.getElementById('catalog-products-section');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  const handleGoToProducts = () => {
    navigateToTab('catalog');
    setTimeout(() => {
      const target = document.getElementById('catalog-products-section');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  const handleClearMotorcycle = () => {
    setActiveMotorcycle(null);
  };

  const handleRemoveFromGarage = (moto: ActiveMotorcycle) => {
    const updated = savedGarages.filter(m => !(m.modelId === moto.modelId && m.year === moto.year && m.version === moto.version));
    setSavedGarages(updated);
    localStorage.setItem('sz_saved_garages', JSON.stringify(updated));
    if (activeMotorcycle?.modelId === moto.modelId && activeMotorcycle?.year === moto.year) {
      setActiveMotorcycle(updated[0] || null);
    }
  };

  // Cart Handlers
  const handleAddToCart = (part: SuzukiPart) => {
    if (!activeMotorcycle) {
      setIsGarageModalOpen(true);
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(item => item.part.id === part.id);
      if (existing) {
        return prev.map(item => item.part.id === part.id ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        return [...prev, { part, quantity: 1, motorcycle: activeMotorcycle }];
      }
    });

    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (partId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.part.id === partId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const handleRemoveCartItem = (partId: string) => {
    setCartItems(prev => prev.filter(item => item.part.id !== partId));
  };

  const handleOrderComplete = (newOrder: any) => {
    setOrders(prev => [newOrder, ...prev]);
    setCartItems([]);
    navigateToTab('orders');
  };

  // Filter Parts List
  const filteredParts = SUZUKI_PARTS.filter(part => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOem = matchesOem(part, q);
      const matchName = part.name.toLowerCase().includes(q);
      const matchCategory = part.category.toLowerCase().includes(q);
      if (!matchName && !matchOem && !matchCategory) return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && part.category !== selectedCategory) {
      return false;
    }

    // Price range filter
    if (part.price < minPriceFilter || part.price > maxPriceFilter) return false;

    // Availability filter (multi-select)
    if (!availabilityFilter.has(getAvailabilityStatus(part))) return false;

    // Compatible filter toggle
    if (onlyCompatible && activeMotorcycle) {
      const isCompat = part.compatibility.some(c => {
        if (c.modelId !== activeMotorcycle.modelId) return false;
        if (activeMotorcycle.year < c.yearStart || activeMotorcycle.year > c.yearEnd) return false;
        if (c.version && c.version !== activeMotorcycle.version) return false;
        return true;
      });
      if (!isCompat) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    // Default (relevance): prioriza disponibles sin ocultar el resto
    const aStatus = AVAILABILITY_META[getAvailabilityStatus(a)].sortOrder;
    const bStatus = AVAILABILITY_META[getAvailabilityStatus(b)].sortOrder;
    if (aStatus !== bStatus) return aStatus - bStatus;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-[#E60012] selection:text-white">
      
      {/* Top Header Navbar */}
      <Navbar
        activeMotorcycle={activeMotorcycle}
        cartCount={cartItems.reduce((a, b) => a + b.quantity, 0)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        onOpenGarageModal={() => setIsGarageModalOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAI={() => setIsAIOpen(true)}
        userName={userProfile.fullName}
        isLoggedIn={isLoggedIn}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />



      {/* Main View Switcher */}
      <main className="flex-1">
        
        {/* Tab 1: Garage & Quick Home View */}
        {activeTab === 'garage' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
            
            {/* Primary Motorcycle Compatibility Selector */}
            <CompatibilitySelector
              activeMotorcycle={activeMotorcycle}
              onSelectMotorcycle={handleSelectMotorcycle}
              onClearMotorcycle={handleClearMotorcycle}
              onGoToProducts={handleGoToProducts}
            />

            {/* Technical Search & Tutorial Cards */}
            <TechnicalSearchCard
              onSelectMotorcycle={handleSelectMotorcycle}
              onOpenPartDetail={(part) => setSelectedPartDetail(part)}
              onOpenTutorial={() => setIsTutorialOpen(true)}
            />

            {/* Quick Access Featured Parts Catalog Section */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Repuestos Destacados para Tu Moto
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {activeMotorcycle 
                      ? `Mostrando repuestos verificados para ${activeMotorcycle.brand} ${activeMotorcycle.modelName} (${activeMotorcycle.year})` 
                      : 'Piezas originales más solicitadas con certificación de compatibilidad Suzuki'}
                  </p>
                </div>

                <button
                  onClick={() => navigateToTab('catalog')}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <span>Explorar Catálogo Completo</span>
                  <ArrowRight className="w-4 h-4 text-[#E60012]" />
                </button>
              </div>

              {/* Grid of Parts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {SUZUKI_PARTS.filter(part => {
                  if (!activeMotorcycle) return true;
                  return part.compatibility.some(c => {
                    if (c.modelId !== activeMotorcycle.modelId) return false;
                    if (activeMotorcycle.year < c.yearStart || activeMotorcycle.year > c.yearEnd) return false;
                    if (c.version && c.version !== activeMotorcycle.version) return false;
                    return true;
                  });
                }).slice(0, 4).map(part => (
                  <ProductCard
                    key={part.id}
                    part={part}
                    activeMotorcycle={activeMotorcycle}
                    onOpenDetail={(p) => setSelectedPartDetail(p)}
                    onAddToCart={handleAddToCart}
                    onOpenGarageModal={() => setIsGarageModalOpen(true)}
                    isFavorite={userProfile.favoritePartIds.includes(part.id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Full Catalog View with Left Dynamic Sidebar */}
        {activeTab === 'catalog' && (
          <div id="catalog-products-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            
            {/* Catalog Top Header Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Catálogo Oficial Suzuki Parts
                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">
                    {filteredParts.length} repuestos
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Filtra por categoría, precio, modelo y repuestos 100% compatibles con tu garaje.
                </p>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2.5 self-start md:self-auto">
                <label htmlFor="catalog-sort-select" className="text-xs font-extrabold text-slate-700 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#E60012]" aria-hidden="true" /> Ordenar:
                </label>
                <select
                  id="catalog-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012] cursor-pointer"
                >
                  <option value="relevance">Relevancia / Destacados</option>
                  <option value="price-asc">Precio: Menor a Mayor</option>
                  <option value="price-desc">Precio: Mayor a Menor</option>
                  <option value="name">Nombre: A - Z</option>
                </select>
              </div>
            </div>

            {/* Catalog Main Layout: Dynamic Sidebar on Left + Product Grid on Right */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              
              {/* Left Dynamic Sidebar Filter */}
              <CatalogSidebarFilter
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                onlyCompatible={onlyCompatible}
                setOnlyCompatible={setOnlyCompatible}
                availabilityFilter={availabilityFilter}
                setAvailabilityFilter={setAvailabilityFilter}
                maxPriceFilter={maxPriceFilter}
                setMaxPriceFilter={setMaxPriceFilter}
                minPriceFilter={minPriceFilter}
                setMinPriceFilter={setMinPriceFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                activeMotorcycle={activeMotorcycle}
                onOpenGarageModal={() => setIsGarageModalOpen(true)}
                allParts={SUZUKI_PARTS}
                filteredCount={filteredParts.length}
                onResetFilters={handleResetFilters}
              />

              {/* Right Products Grid */}
              <div className="flex-1 w-full">
                {filteredParts.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-lg mx-auto">
                    <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" aria-hidden="true" />
                    <h3 className="text-base font-bold text-slate-800">No se encontraron repuestos</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Ningún repuesto coincide con los criterios seleccionados (modelo, precio, categoría o compatibilidad).
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="mt-5 px-5 py-2.5 min-h-[44px] bg-[#E60012] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                    >
                      Limpiar Filtros
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredParts.map(part => (
                      <ProductCard
                        key={part.id}
                        part={part}
                        activeMotorcycle={activeMotorcycle}
                        onOpenDetail={(p) => setSelectedPartDetail(p)}
                        onAddToCart={handleAddToCart}
                        onOpenGarageModal={() => setIsGarageModalOpen(true)}
                        isFavorite={userProfile.favoritePartIds.includes(part.id)}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* Tab 3: Interactive Exploded View Diagram Schematics */}
        {activeTab === 'schematics' && (
          <ExplodedView
            activeMotorcycle={activeMotorcycle}
            onAddToCart={handleAddToCart}
            onOpenPartDetail={(p) => setSelectedPartDetail(p)}
            onOpenGarageModal={() => setIsGarageModalOpen(true)}
            initialSchematicId={schematicTargetId}
            initialPartId={schematicTargetPartId}
          />
        )}

        {/* Tab 4: Orders History */}
        {activeTab === 'orders' && (
          <OrdersModal orders={orders} />
        )}

        {/* Tab 5: User Profile & Account Dashboard */}
        {activeTab === 'account' && (
          <UserProfilePage
            userProfile={userProfile}
            onUpdateProfile={(updated) => setUserProfile(updated)}
            savedGarages={savedGarages}
            activeMotorcycle={activeMotorcycle}
            onSelectActiveBike={handleSelectMotorcycle}
            onOpenGarageModal={() => setIsGarageModalOpen(true)}
            onRemoveGarageBike={(modelId, year) => {
              const updated = savedGarages.filter(m => !(m.modelId === modelId && m.year === year));
              setSavedGarages(updated);
              localStorage.setItem('sz_saved_garages', JSON.stringify(updated));
            }}
            orders={orders}
            favoriteParts={SUZUKI_PARTS.filter(p => userProfile.favoritePartIds.includes(p.id))}
            onToggleFavorite={handleToggleFavorite}
            onAddToCart={handleAddToCart}
            onNavigateToCatalog={() => navigateToTab('catalog')}
            onNavigateToSchematics={() => navigateToTab('schematics')}
            onLogout={handleLogout}
          />
        )}

        {/* Tab 6: Standalone Full Product Page View */}

        {activeTab === 'product-page' && selectedPagePart && (
          <ProductDetailPage
            part={selectedPagePart}
            activeMotorcycle={activeMotorcycle}
            allParts={SUZUKI_PARTS}
            onBack={handleBackFromProductPage}
            onAddToCart={handleAddToCart}
            onOpenGarageModal={() => setIsGarageModalOpen(true)}
            onViewSchematics={(sId, pId) => {
              setSchematicTargetId(sId);
              setSchematicTargetPartId(pId);
              navigateToTab('schematics');
            }}
            onSelectRelatedPart={(p) => {
              setSelectedPagePart(p);
              window.history.pushState(null, '', `/producto/${encodeURIComponent(getPrimaryOem(p))}`);
            }}
          />
        )}

        {/* Tab 7: Dedicated Checkout Page (/completar-pedido) */}
        {activeTab === 'checkout' && (
          <CheckoutPage
            cartItems={cartItems}
            activeMotorcycle={activeMotorcycle}
            userProfile={userProfile}
            isLoggedIn={isLoggedIn}
            onOrderComplete={(order) => {
              setOrders(prev => [order, ...prev]);
            }}
            onClearCart={() => setCartItems([])}
            onNavigateToCatalog={() => navigateToTab('catalog')}
            onNavigateToOrders={() => navigateToTab('orders')}
          />
        )}

        {/* Tab 8: Dedicated Favorites Page (/favoritos) */}
        {activeTab === 'favorites' && (
          <FavoritesPage
            favoriteParts={SUZUKI_PARTS.filter(p => userProfile.favoritePartIds.includes(p.id))}
            activeMotorcycle={activeMotorcycle}
            onOpenDetail={(p) => setSelectedPartDetail(p)}
            onAddToCart={handleAddToCart}
            onOpenGarageModal={() => setIsGarageModalOpen(true)}
            onToggleFavorite={handleToggleFavorite}
            onNavigateToCatalog={() => navigateToTab('catalog')}
          />
        )}


      </main>

      {/* Global Modals & Drawers */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <GarageModal
        isOpen={isGarageModalOpen}
        onClose={() => setIsGarageModalOpen(false)}
        activeMotorcycle={activeMotorcycle}
        onSelectMotorcycle={handleSelectMotorcycle}
        savedGarages={savedGarages}
        onRemoveFromGarage={handleRemoveFromGarage}
      />


      <IdentificationGuideModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      <ProductDetailModal
        part={selectedPartDetail}
        activeMotorcycle={activeMotorcycle}
        allParts={SUZUKI_PARTS}
        onClose={() => setSelectedPartDetail(null)}
        onAddToCart={handleAddToCart}
        onOpenGarageModal={() => setIsGarageModalOpen(true)}
        onViewSchematics={(sId, pId) => {
          setSchematicTargetId(sId);
          setSchematicTargetPartId(pId);
          navigateToTab('schematics');
        }}
        onSelectRelatedPart={(p) => setSelectedPartDetail(p)}
        onOpenAsPage={handleOpenProductPage}
      />

      <AIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        activeMotorcycle={activeMotorcycle}
        onOpenDetail={(p) => setSelectedPartDetail(p)}
        onAddToCart={handleAddToCart}
        onOpenGarageModal={() => setIsGarageModalOpen(true)}
      />


      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedCheckout={() => {
          setIsCartOpen(false);
          navigateToTab('checkout');
        }}
        onViewPartDetail={(part) => setSelectedPartDetail(part)}
        activeMotorcycle={activeMotorcycle}
      />


      {/* Floating WhatsApp Widget */}
      <WhatsAppWidget
        activeMotorcycle={activeMotorcycle}
        onOpenGarageModal={() => setIsGarageModalOpen(true)}
      />



      {/* Footer strictly formatted as user design */}
      <footer className="bg-slate-200/80 border-t border-slate-300 mt-16 py-10 text-slate-700 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="font-extrabold text-slate-900 uppercase text-sm mb-2">SUZUKI PARTS</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              © 2026 SUZUKI GENUINE PARTS | INDUSTRIAL PRECISION<br />
              Sistema oficial de consulta y suministro de repuestos con garantía de ajuste técnico OEM.
            </p>
          </div>

          <div className="md:text-right space-y-1">
            <div className="font-extrabold text-slate-800 text-[11px] uppercase mb-2">LEGAL & INFO</div>
            <div className="space-y-1 text-slate-700">
              <button type="button" onClick={() => setIsTutorialOpen(true)} className="hover:text-[#E60012] block text-left md:ml-auto cursor-pointer underline">Technical Specifications</button>
              <span className="block">OEM Verification Process</span>
              <span className="block">Shipping Policy & Warranty</span>
              <span className="block">Privacy Compliance</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
