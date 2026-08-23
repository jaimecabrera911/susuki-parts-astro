import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { CompatibilitySelector } from "./components/CompatibilitySelector";
import { TechnicalSearchCard } from "./components/TechnicalSearchCard";
import { IdentificationGuideModal } from "./components/IdentificationGuideModal";
import { GarageModal } from "./components/GarageModal";
import { ProductCard } from "./components/ProductCard";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { ProductDetailPage } from "./components/ProductDetailPage";
import { ExplodedView } from "./components/ExplodedView";
import { AIAssistantModal } from "./components/AIAssistantModal";
import { CartDrawer } from "./components/CartDrawer";
import { CheckoutModal } from "./components/CheckoutModal";
import { CheckoutPage } from "./components/CheckoutPage";
import { FavoritesPage } from "./components/FavoritesPage";
import { OrdersModal } from "./components/OrdersModal";

import { UserProfilePage } from "./components/UserProfilePage";
import { AuthModal } from "./components/AuthModal";
import { AuthRequired } from "./components/AuthRequired";
import { CatalogSidebarFilter } from "./components/CatalogSidebarFilter";
import { ProductCatalogSkeletonGrid } from "./components/SkeletonLoaders";

import { WhatsAppWidget } from "./components/WhatsAppWidget";
import { Footer } from "./components/Footer";
import { ContactPage } from "./components/ContactPage";
import { MobileDock } from "./components/MobileDock";
import { SiteSettingsProvider } from "./components/SiteSettingsProvider";
import type {
  ActiveMotorcycle,
  SuzukiPart,
  CartItem,
  AvailabilityStatus,
  UserProfile,
  SuzukiModel,
  ExplodedDiagram,
  Order,
  Category,
} from "./types";
import {
  getAvailabilityStatus,
  AVAILABILITY_META,
  matchesOem,
  getPrimaryOem,
} from "./types";
import {
  ShieldCheck,
  Wrench,
  ArrowRight,
  Layers,
  FileSearch,
  Sparkles,
  CheckCircle2,
  ArrowUpDown,
} from "lucide-react";
import { FaCartShopping } from "react-icons/fa6";

import {
  fetchOrders,
  saveUserApi,
  saveGarageApi,
  deleteGarageApi,
  fetchGarages,
  fetchModels,
  fetchParts,
  fetchSchematics,
  fetchCategories,
} from "./services/api";

export default function App() {
  const [models, setModels] = useState<SuzukiModel[]>([]);
  const [parts, setParts] = useState<SuzukiPart[]>([]);
  const [schematics, setSchematics] = useState<ExplodedDiagram[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Dynamic Catalog Filter States
  const [availabilityFilter, setAvailabilityFilter] = useState<
    Set<AvailabilityStatus>
  >(
    () =>
      new Set<AvailabilityStatus>(["in_stock", "international", "on_order"]),
  );
  const [maxPriceFilter, setMaxPriceFilter] = useState(5000000);
  const [minPriceFilter, setMinPriceFilter] = useState(0);
  const [sortBy, setSortBy] = useState("relevance");

  const loadStorefrontData = async (isInitial = false) => {
    try {
      const [liveModels, liveParts, liveSchematics, liveCategories] = await Promise.all([
        fetchModels().catch(() => []),
        fetchParts().catch(() => []),
        fetchSchematics().catch(() => []),
        fetchCategories().catch(() => []),
      ]);
      if (liveModels && liveModels.length > 0) setModels(liveModels);
      if (liveCategories && liveCategories.length > 0) setCategories(liveCategories);
      if (liveParts && liveParts.length > 0) {
        setParts(
          liveParts.map((p: any) => ({
            ...p,
            taxable: p.taxable !== false,
            priceIncludesTax: p.priceIncludesTax === true,
          })),
        );
        if (isInitial) {
          const maxP = Math.max(...liveParts.map((p: any) => p.price), 5000000);
          setMaxPriceFilter(maxP);
        }
      }
      if (liveSchematics && liveSchematics.length > 0)
        setSchematics(liveSchematics);
    } catch (err) {
      console.error("Error loading live storefront data:", err);
    }
  };

  useEffect(() => {
    setIsLoadingData(true);
    loadStorefrontData(true).finally(() => setIsLoadingData(false));
  }, []);

  // Re-fetch catalog data when the tab becomes visible again (e.g. returning
  // from the admin panel in another tab or via browser back), so edits made in
  // the admin are reflected without a manual refresh.
  useEffect(() => {
    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") {
        loadStorefrontData(false);
      }
    };
    const refreshOnPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) loadStorefrontData(false);
    };
    document.addEventListener("visibilitychange", refreshOnVisible);
    window.addEventListener("pageshow", refreshOnPageShow);
    window.addEventListener("focus", refreshOnVisible);
    return () => {
      document.removeEventListener("visibilitychange", refreshOnVisible);
      window.removeEventListener("pageshow", refreshOnPageShow);
      window.removeEventListener("focus", refreshOnVisible);
    };
  }, []);

  // State for active motorcycle in garage
  const [activeMotorcycle, setActiveMotorcycle] =
    useState<ActiveMotorcycle | null>(() => {
      const saved = localStorage.getItem("sz_active_moto");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return null;
        }
      }
      return null;
    });

  const [savedGarages, setSavedGarages] = useState<ActiveMotorcycle[]>(() => {
    const saved = localStorage.getItem("sz_saved_garages");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Auth & Login State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem("sz_is_logged_in");
    return saved !== null ? saved === "true" : false;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sz_is_logged_in", isLoggedIn ? "true" : "false");
  }, [isLoggedIn]);

  // Mirrors isLoggedIn for use inside the URL-routing effect (registered with [])
  const isLoggedInRef = React.useRef(isLoggedIn);
  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("sz_user_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      id: "",
      fullName: "",
      email: "",
      phone: "",
      documentId: "",
      city: "",
      address: "",
      postalCode: "",
      favoritePartIds: [],
      createdAt: "",
    };
  });

  useEffect(() => {
    localStorage.setItem("sz_user_profile", JSON.stringify(userProfile));
  }, [userProfile]);

  const handleLoginSuccess = (user: UserProfile) => {
    setUserProfile(user);
    setIsLoggedIn(true);
    isLoggedInRef.current = true;
    navigateToTab("account");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    isLoggedInRef.current = false;
    navigateToTab("garage");
  };

  const handleToggleFavorite = (partId: string) => {
    setUserProfile((prev) => {
      const exists = prev.favoritePartIds.includes(partId);
      const updatedFavorites = exists
        ? prev.favoritePartIds.filter((id) => id !== partId)
        : [...prev.favoritePartIds, partId];
      const updatedProfile = { ...prev, favoritePartIds: updatedFavorites };
      saveUserApi(updatedProfile, true).catch((err) =>
        console.error("Error guardando favoritos en BD:", err),
      );
      return updatedProfile;
    });
  };

  const handleUpdateProfile = async (updated: UserProfile) => {
    setUserProfile(updated);
    try {
      await saveUserApi(updated, true);
    } catch (err) {
      console.error("Error guardando perfil en BD:", err);
    }
  };

  // App Navigation & Modal States
  const [activeTab, setActiveTab] = useState<
    | "garage"
    | "catalog"
    | "schematics"
    | "orders"
    | "product-page"
    | "account"
    | "checkout"
    | "favorites"
    | "contact"
  >("garage");

  const [selectedPagePart, setSelectedPagePart] = useState<SuzukiPart | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [onlyCompatible, setOnlyCompatible] = useState(true);

  const handleResetFilters = () => {
    setSelectedCategory("all");
    setAvailabilityFilter(
      new Set<AvailabilityStatus>(["in_stock", "international", "on_order"]),
    );
    const maxP = Math.max(...parts.map((p) => p.price), 5000000);
    setMaxPriceFilter(maxP);
    setMinPriceFilter(0);
    setSearchQuery("");
    setSortBy("relevance");
  };

  const navigateToTab = (
    tab:
      | "garage"
      | "catalog"
      | "schematics"
      | "orders"
      | "product-page"
      | "account"
      | "checkout"
      | "favorites"
      | "contact",
    pathOverride?: string,
  ) => {
    // Clear schematic targets when leaving the schematics view to avoid stale pre-selection
    if (tab !== "schematics" && !pathOverride) {
      setSchematicTargetId(undefined);
      setSchematicTargetPartId(undefined);
    }
    setActiveTab(tab);
    let targetPath = "/garaje";
    if (tab === "catalog") targetPath = "/catalogo";
    else if (tab === "schematics") targetPath = pathOverride || "/despieces";
    else if (tab === "orders") targetPath = "/pedidos";
    else if (tab === "account") targetPath = "/cuenta";
    else if (tab === "checkout") targetPath = "/completar-pedido";
    else if (tab === "favorites") targetPath = "/favoritos";
    else if (tab === "contact") targetPath = "/contacto";
    else if (pathOverride) targetPath = pathOverride;

    if (tab === "orders" || tab === "account") {
      fetchOrders().then((fetched) => setOrders(fetched)).catch(() => {});
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, "", targetPath);
      window.dispatchEvent(new Event("popstate"));
    }
  };

  // Listen to URL path and hash changes for clean HTML5 SPA routing
  useEffect(() => {
    const handleLocationChange = () => {
      const pathname = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      // Check product page route (/producto/REF or #producto=REF)
      if (pathname.startsWith("/producto/")) {
        const oem = decodeURIComponent(pathname.replace("/producto/", ""));
        const found = parts.find((p) => matchesOem(p, oem) || p.id === oem);
        if (found) {
          setSelectedPagePart(found);
          setActiveTab("product-page");
          return;
        }
      } else if (hash.startsWith("#producto=")) {
        const oem = decodeURIComponent(hash.replace("#producto=", ""));
        const found = parts.find((p) => matchesOem(p, oem) || p.id === oem);
        if (found) {
          setSelectedPagePart(found);
          setActiveTab("product-page");
          return;
        }
      }

      // Check schematics detail route (/despieces/CODE or #despieces=CODE)
      if (pathname.startsWith("/despieces/")) {
        const code = decodeURIComponent(
          window.location.pathname.replace(/^\/despieces\//i, ""),
        );
        if (code && code !== "catalogo" && code !== "all") {
          setSchematicTargetId(code);
          setActiveTab("schematics");
          return;
        } else {
          setSchematicTargetId(undefined);
          setActiveTab("schematics");
          return;
        }
      } else if (hash.startsWith("#despieces=")) {
        const code = decodeURIComponent(hash.replace("#despieces=", ""));
        if (code && code !== "catalogo" && code !== "all") {
          setSchematicTargetId(code);
          setActiveTab("schematics");
          return;
        }
      }

      // Check clean path names
      if (
        pathname === "/catalogo" ||
        hash === "#catalogo" ||
        hash === "#catalog"
      ) {
        setActiveTab("catalog");
      } else if (
        pathname === "/despieces" ||
        pathname === "/despieces/catalogo" ||
        hash === "#despieces" ||
        hash === "#schematics"
      ) {
        setSchematicTargetId(undefined);
        setActiveTab("schematics");
      } else if (
        pathname === "/pedidos" ||
        hash === "#pedidos" ||
        hash === "#orders"
      ) {
        setActiveTab("orders");
        if (!isLoggedInRef.current) setIsAuthModalOpen(true);
      } else if (
        pathname === "/cuenta" ||
        pathname === "/usuario" ||
        hash === "#cuenta" ||
        hash === "#perfil"
      ) {
        setActiveTab("account");
        if (!isLoggedInRef.current) setIsAuthModalOpen(true);
      } else if (
        pathname === "/completar-pedido" ||
        hash === "#completar-pedido" ||
        hash === "#checkout"
      ) {
        setActiveTab("checkout");
      } else if (
        pathname === "/favoritos" ||
        hash === "#favoritos" ||
        hash === "#favorites"
      ) {
        setActiveTab("favorites");
        if (!isLoggedInRef.current) setIsAuthModalOpen(true);
      } else if (
        pathname === "/contacto" ||
        hash === "#contacto" ||
        hash === "#contact"
      ) {
        setActiveTab("contact");
      } else if (
        pathname === "/garaje" ||
        pathname === "/" ||
        hash === "#garaje" ||
        hash === "#garage"
      ) {
        if (pathname === "/") {
          window.history.replaceState(null, "", "/garaje");
        }
        setActiveTab("garage");
      }
    };

    handleLocationChange();
    window.addEventListener("popstate", handleLocationChange);

    window.addEventListener("hashchange", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, []);

  const handleOpenProductPage = (part: SuzukiPart) => {
    setSelectedPagePart(part);
    setActiveTab("product-page");
    window.history.pushState(
      null,
      "",
      `/producto/${encodeURIComponent(getPrimaryOem(part))}`,
    );
  };

  const handleBackFromProductPage = () => {
    setSelectedPagePart(null);
    navigateToTab("catalog");
  };

  // Cart & Orders State
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("sz_cart_items");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const syncedCartItems = React.useMemo(() => {
    return cartItems.map((item) => {
      const live = parts.find(
        (p) =>
          p.id === item.part.id ||
          (item.part.oemNumbers &&
            p.oemNumbers.includes(item.part.oemNumbers[0])),
      );
      return live ? { ...item, part: live } : item;
    });
  }, [cartItems, parts]);

  useEffect(() => {
    localStorage.setItem("sz_cart_items", JSON.stringify(cartItems));
  }, [cartItems]);

  // Load orders from Neon DB API on mount
  useEffect(() => {
    const loadAllOrders = async () => {
      try {
        const fetched = await fetchOrders();
        setOrders(fetched);
      } catch (err) {
        console.error("Error cargando órdenes:", err);
        setOrders([]);
      }
    };
    loadAllOrders();
  }, []);

  // Modals
  const [isGarageModalOpen, setIsGarageModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPartDetail, setSelectedPartDetail] =
    useState<SuzukiPart | null>(null);
  const [schematicTargetId, setSchematicTargetId] = useState<
    string | undefined
  >(undefined);
  const [schematicTargetPartId, setSchematicTargetPartId] = useState<
    string | undefined
  >(undefined);

  // Save motorcycle in localStorage
  useEffect(() => {
    if (activeMotorcycle) {
      localStorage.setItem("sz_active_moto", JSON.stringify(activeMotorcycle));
      // Add to saved garages list if not present
      setSavedGarages((prev) => {
        const exists = prev.some(
          (m) =>
            m.modelId === activeMotorcycle.modelId &&
            m.year === activeMotorcycle.year &&
            m.version === activeMotorcycle.version,
        );
        if (exists) return prev;
        const updated = [activeMotorcycle, ...prev];
        localStorage.setItem("sz_saved_garages", JSON.stringify(updated));
        return updated;
      });
    } else {
      localStorage.removeItem("sz_active_moto");
    }
  }, [activeMotorcycle]);

  const handleSelectMotorcycle = (moto: ActiveMotorcycle) => {
    setActiveMotorcycle(moto);
    setOnlyCompatible(true);
    navigateToTab("catalog");

    setTimeout(() => {
      const target = document.getElementById("catalog-products-section");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 50);
  };

  const handleGoToProducts = () => {
    navigateToTab("catalog");
    setTimeout(() => {
      const target = document.getElementById("catalog-products-section");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 50);
  };

  const handleClearMotorcycle = () => {
    setActiveMotorcycle(null);
  };

  const handleRemoveFromGarage = (moto: ActiveMotorcycle) => {
    const updated = savedGarages.filter(
      (m) =>
        !(
          m.modelId === moto.modelId &&
          m.year === moto.year &&
          m.version === moto.version
        ),
    );
    setSavedGarages(updated);
    localStorage.setItem("sz_saved_garages", JSON.stringify(updated));
    if (
      activeMotorcycle?.modelId === moto.modelId &&
      activeMotorcycle?.year === moto.year
    ) {
      setActiveMotorcycle(updated[0] || null);
    }
  };

  // Cart Handlers
  const handleAddToCart = (part: SuzukiPart, quantity: number = 1) => {
    if (!activeMotorcycle) {
      setIsGarageModalOpen(true);
      return;
    }

    const qtyToAdd = Math.max(1, quantity || 1);

    setCartItems((prev) => {
      const existing = prev.find((item) => item.part.id === part.id);
      if (existing) {
        return prev.map((item) =>
          item.part.id === part.id
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item,
        );
      } else {
        return [...prev, { part, quantity: qtyToAdd, motorcycle: activeMotorcycle }];
      }
    });

    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (partId: string, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.part.id === partId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }),
    );
  };

  const handleRemoveCartItem = (partId: string) => {
    setCartItems((prev) => prev.filter((item) => item.part.id !== partId));
  };

  const handleOrderComplete = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setCartItems([]);
    navigateToTab("orders");
  };

  // Filter Parts List
  const filteredParts = parts
    .filter((part) => {
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchOem = matchesOem(part, q);
        const matchName = part.name.toLowerCase().includes(q);
        const matchCategory = part.category.toLowerCase().includes(q);
        if (!matchName && !matchOem && !matchCategory) return false;
      }

      // Category filter
      if (selectedCategory !== "all") {
        const foundCat = categories.find((c) => c.slug === selectedCategory);
        const allowedSlugs = foundCat
          ? [foundCat.slug, ...(foundCat.subcategories?.map((sub) => sub.slug) || [])]
          : [selectedCategory];
        if (!allowedSlugs.includes(part.category)) {
          return false;
        }
      }

      // Price range filter
      if (part.price < minPriceFilter || part.price > maxPriceFilter)
        return false;

      // Availability filter (multi-select)
      if (!availabilityFilter.has(getAvailabilityStatus(part))) return false;

      // Compatible filter toggle
      if (onlyCompatible && activeMotorcycle) {
        const isCompat = part.compatibility.some((c) => {
          if (c.modelId !== activeMotorcycle.modelId) return false;
          if (
            (c.yearStart && activeMotorcycle.year < c.yearStart) ||
            (c.yearEnd && activeMotorcycle.year > c.yearEnd)
          )
            return false;
          if (c.version && c.version !== activeMotorcycle.version) return false;
          return true;
        });
        if (!isCompat) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      // Default (relevance): prioriza disponibles sin ocultar el resto
      const aStatus = AVAILABILITY_META[getAvailabilityStatus(a)].sortOrder;
      const bStatus = AVAILABILITY_META[getAvailabilityStatus(b)].sortOrder;
      if (aStatus !== bStatus) return aStatus - bStatus;
      return a.name.localeCompare(b.name);
    });

  return (
    <SiteSettingsProvider>
      <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-[#E60012] selection:text-white">
        {/* Top Header Navbar */}
        <Navbar
        activeMotorcycle={activeMotorcycle}
        cartCount={cartItems.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        onOpenGarageModal={() => setIsGarageModalOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAI={() => setIsAIOpen(true)}
        userName={userProfile.fullName}
        isLoggedIn={isLoggedIn}
        userRole={userProfile.role}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main View Switcher */}
      <main className="flex-1 pb-20 lg:pb-0">
        {/* Tab 1: Garage & Quick Home View */}
        {activeTab === "garage" && (
          <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
            {/* Primary Motorcycle Compatibility Selector */}
            <CompatibilitySelector
              activeMotorcycle={activeMotorcycle}
              onSelectMotorcycle={handleSelectMotorcycle}
              onClearMotorcycle={handleClearMotorcycle}
              onGoToProducts={handleGoToProducts}
              models={models}
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
                      ? `Mostrando repuestos compatibles para ${activeMotorcycle.brand} ${activeMotorcycle.modelName} (${activeMotorcycle.year})`
                      : "Piezas originales más solicitadas con certificación de compatibilidad Suzuki"}
                  </p>
                </div>

                <button
                  onClick={() => navigateToTab("catalog")}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <span>Explorar Catálogo Completo</span>
                  <ArrowRight className="w-4 h-4 text-[#E60012]" />
                </button>
              </div>

              {/* Grid of Parts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
                {parts
                  .filter((part) => {
                    if (!activeMotorcycle) return true;
                    return part.compatibility.some((c) => {
                      if (c.modelId !== activeMotorcycle.modelId) return false;
                      if (
                        (c.yearStart && activeMotorcycle.year < c.yearStart) ||
                        (c.yearEnd && activeMotorcycle.year > c.yearEnd)
                      )
                        return false;
                      if (c.version && c.version !== activeMotorcycle.version)
                        return false;
                      return true;
                    });
                  })
                  .slice(0, 5)
                  .map((part) => (
                    <ProductCard
                      key={part.id}
                      part={part}
                      activeMotorcycle={activeMotorcycle}
                      onOpenDetail={(p) => setSelectedPartDetail(p)}
                      onAddToCart={handleAddToCart}
                      onOpenGarageModal={() => setIsGarageModalOpen(true)}
                      isFavorite={userProfile.favoritePartIds.includes(part.id)}
                      onToggleFavorite={handleToggleFavorite}
                      schematics={schematics}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Full Catalog View with Left Dynamic Sidebar */}
        {activeTab === "catalog" && (
          <div
            id="catalog-products-section"
            className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6"
          >
            {/* Catalog Top Header Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Catálogo Oficial de Repuestos
                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">
                    {filteredParts.length} repuestos
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Filtra por categoría, precio, modelo y repuestos 100%
                  compatibles con tu moto.
                </p>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2.5 self-start md:self-auto">
                <label
                  htmlFor="catalog-sort-select"
                  className="text-xs font-extrabold text-slate-700 uppercase tracking-wider shrink-0 flex items-center gap-1"
                >
                  <ArrowUpDown
                    className="w-3.5 h-3.5 text-[#E60012]"
                    aria-hidden="true"
                  />{" "}
                  Ordenar:
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
                categories={categories}
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
                allParts={parts}
                filteredCount={filteredParts.length}
                onResetFilters={handleResetFilters}
                models={models}
                isLoading={isLoadingData}
              />

              {/* Right Products Grid */}
              <div className="flex-1 w-full">
                {isLoadingData ? (
                  <ProductCatalogSkeletonGrid count={8} />
                ) : filteredParts.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-lg mx-auto">
                    <ShieldCheck
                      className="w-12 h-12 text-slate-400 mx-auto mb-3"
                      aria-hidden="true"
                    />
                    <h3 className="text-base font-bold text-slate-800">
                      No se encontraron repuestos
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Ningún repuesto coincide con los criterios seleccionados
                      (modelo, precio, categoría o compatibilidad).
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[1900px]:grid-cols-5 gap-6">
                    {filteredParts.map((part) => (
                      <ProductCard
                        key={part.id}
                        part={part}
                        activeMotorcycle={activeMotorcycle}
                        onOpenDetail={(p) => setSelectedPartDetail(p)}
                        onAddToCart={handleAddToCart}
                        onOpenGarageModal={() => setIsGarageModalOpen(true)}
                        isFavorite={userProfile.favoritePartIds.includes(
                          part.id,
                        )}
                        onToggleFavorite={handleToggleFavorite}
                        schematics={schematics}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Interactive Exploded View Diagram Schematics */}
        {activeTab === "schematics" && (
          <ExplodedView
            activeMotorcycle={activeMotorcycle}
            onAddToCart={handleAddToCart}
            onOpenPartDetail={(p) => setSelectedPartDetail(p)}
            onOpenGarageModal={() => setIsGarageModalOpen(true)}
            initialSchematicId={schematicTargetId}
            initialPartId={schematicTargetPartId}
            schematicsList={schematics}
            partsList={parts}
            modelsList={models}
            isLoading={isLoadingData}
          />
        )}

        {/* Tab 4: Orders History */}
        {!isLoggedIn &&
          (activeTab === "orders" ||
            activeTab === "account" ||
            activeTab === "favorites") && (
            <AuthRequired
              onLogin={() => setIsAuthModalOpen(true)}
              onGoHome={() => navigateToTab("garage")}
            />
          )}

        {activeTab === "orders" && isLoggedIn && (
          <OrdersModal orders={orders} />
        )}

        {/* Tab 5: User Profile & Account Dashboard */}
        {activeTab === "account" && isLoggedIn && (
          <UserProfilePage
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            savedGarages={savedGarages}
            activeMotorcycle={activeMotorcycle}
            onSelectActiveBike={handleSelectMotorcycle}
            onOpenGarageModal={() => setIsGarageModalOpen(true)}
            onRemoveGarageBike={(modelId, year) => {
              const updated = savedGarages.filter(
                (m) => !(m.modelId === modelId && m.year === year),
              );
              setSavedGarages(updated);
              localStorage.setItem("sz_saved_garages", JSON.stringify(updated));
              deleteGarageApi(`${modelId}-${year}`).catch((err) =>
                console.error("Error eliminando garaje de BD:", err),
              );
            }}
            orders={orders}
            favoriteParts={parts.filter((p) =>
              userProfile.favoritePartIds.includes(p.id),
            )}
            onToggleFavorite={handleToggleFavorite}
            onAddToCart={handleAddToCart}
            onNavigateToCatalog={() => navigateToTab("catalog")}
            onNavigateToSchematics={() => navigateToTab("schematics")}
            onLogout={handleLogout}
          />
        )}

        {/* Tab 6: Standalone Full Product Page View */}

        {activeTab === "product-page" && selectedPagePart && (
          <ProductDetailPage
            part={selectedPagePart}
            activeMotorcycle={activeMotorcycle}
            allParts={parts}
            schematics={schematics}
            models={models}
            onBack={handleBackFromProductPage}
            onAddToCart={handleAddToCart}
            onOpenGarageModal={() => setIsGarageModalOpen(true)}
            onViewSchematics={(sId, pId) => {
              setSchematicTargetId(sId);
              setSchematicTargetPartId(pId);
              navigateToTab(
                "schematics",
                `/despieces/${encodeURIComponent(sId)}`,
              );
            }}
            onSelectRelatedPart={(p) => {
              setSelectedPagePart(p);
              window.history.pushState(
                null,
                "",
                `/producto/${encodeURIComponent(getPrimaryOem(p))}`,
              );
            }}
          />
        )}

        {/* Tab 7: Dedicated Checkout Page (/completar-pedido) */}
        {activeTab === "checkout" && (
          <CheckoutPage
            cartItems={syncedCartItems}
            activeMotorcycle={activeMotorcycle}
            userProfile={userProfile}
            isLoggedIn={isLoggedIn}
            onOrderComplete={(order) => {
              setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
            }}
            onClearCart={() => setCartItems([])}
            onNavigateToCatalog={() => navigateToTab("catalog")}
            onNavigateToOrders={() => navigateToTab("orders")}
          />
        )}

        {/* Tab 8: Dedicated Favorites Page (/favoritos) */}
        {activeTab === "favorites" && isLoggedIn && (
          <FavoritesPage
            favoriteParts={parts.filter((p) =>
              userProfile.favoritePartIds.includes(p.id),
            )}
            activeMotorcycle={activeMotorcycle}
            onOpenDetail={(p) => setSelectedPartDetail(p)}
            onAddToCart={handleAddToCart}
            onOpenGarageModal={() => setIsGarageModalOpen(true)}
            onToggleFavorite={handleToggleFavorite}
            onNavigateToCatalog={() => navigateToTab("catalog")}
            schematics={schematics}
          />
        )}

        {/* Tab 9: Contact Page (/contacto) */}
        {activeTab === "contact" && (
          <ContactPage onGoHome={() => navigateToTab("garage")} />
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
        models={models}
      />

      <IdentificationGuideModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      <ProductDetailModal
        part={selectedPartDetail}
        activeMotorcycle={activeMotorcycle}
        allParts={parts}
        schematics={schematics}
        models={models}
        onClose={() => setSelectedPartDetail(null)}
        onAddToCart={handleAddToCart}
        onOpenGarageModal={() => setIsGarageModalOpen(true)}
        onViewSchematics={(sId, pId) => {
          setSelectedPartDetail(null);
          setSchematicTargetId(sId);
          setSchematicTargetPartId(pId);
          navigateToTab("schematics", `/despieces/${encodeURIComponent(sId)}`);
        }}
        onSelectRelatedPart={(p) => setSelectedPartDetail(p)}
        onOpenAsPage={handleOpenProductPage}
      />

      <AIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        activeMotorcycle={activeMotorcycle}
        partsList={parts}
        onOpenDetail={(p) => setSelectedPartDetail(p)}
        onAddToCart={handleAddToCart}
        onOpenGarageModal={() => setIsGarageModalOpen(true)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={syncedCartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedCheckout={() => {
          setIsCartOpen(false);
          navigateToTab("checkout");
        }}
        onContinueShopping={() => {
          setIsCartOpen(false);
          navigateToTab("catalog");
        }}
        onViewPartDetail={(part) => setSelectedPartDetail(part)}
        activeMotorcycle={activeMotorcycle}
      />

      {/* Floating Cart Button - desktop only (mobile uses dock) */}
      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        aria-label={`Abrir carrito (${cartItems.length} repuestos)`}
        className="hidden lg:flex fixed right-5 top-1/2 -translate-y-1/2 z-40 w-14 h-14 items-center justify-center bg-[#E60012] hover:bg-[#b5000b] text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E60012]/40"
      >
        <FaCartShopping className="w-6 h-6" aria-hidden="true" />
        {cartItems.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-white text-[#E60012] text-[11px] font-black flex items-center justify-center border border-[#E60012]/20 shadow-sm">
            {cartItems.length}
          </span>
        )}
      </button>

      {/* Floating WhatsApp Widget */}
      <WhatsAppWidget
        activeMotorcycle={activeMotorcycle}
        onOpenGarageModal={() => setIsGarageModalOpen(true)}
      />

      {/* Mobile Bottom Dock (mobile & tablet) */}
      <MobileDock
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        cartCount={cartItems.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenMenu={() => setMobileMenuOpen((prev) => !prev)}
      />

      {/* Footer strictly formatted as user design */}
      <Footer
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenContact={() => navigateToTab("contact")}
      />
      </div>
    </SiteSettingsProvider>
  );
}
