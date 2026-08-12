import React, { useState, useEffect } from "react";
import { AdminSidebar, type AdminTab } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminMetrics } from "./AdminMetrics";
import { BrandsManager } from "./BrandsManager";
import { ModelsManager } from "./ModelsManager";
import { CategoriesManager } from "./CategoriesManager";
import { PartsManager } from "./PartsManager";
import { SchematicsManager } from "./SchematicsManager";
import { OrdersManager } from "./OrdersManager";
import { UsersManager } from "./UsersManager";
import { ShippingManager } from "./ShippingManager";
import { TaxSettingsManager } from "./TaxSettingsManager";
import { CouponsManager } from "./CouponsManager";
import { ReturnsManager } from "./ReturnsManager";
import { ReturnModal } from "./ReturnModal";
import { BrandModal } from "./BrandModal";
import { ModelDrawer } from "./ModelDrawer";
import { ModelViewModal } from "./ModelViewModal";
import { CategoryModal } from "./CategoryModal";
import { PartDrawer } from "./PartDrawer";
import { SchematicDrawer } from "./SchematicDrawer";
import { SchematicViewModal } from "./SchematicViewModal";
import { OrderModal } from "./OrderModal";
import { UserModal } from "./UserModal";
import {
  fetchBrands,
  fetchModels,
  fetchCategories,
  fetchParts,
  fetchSchematics,
  fetchOrders,
  fetchUsers,
  fetchReturns,
  saveBrandApi,
  deleteBrandApi,
  saveModelApi,
  deleteModelApi,
  savePartApi,
  deletePartApi,
  saveSchematicApi,
  deleteSchematicApi,
  saveOrderApi,
  deleteOrderApi,
  saveCategoryApi,
  deleteCategoryApi,
  saveUserApi,
  deleteUserApi,
  saveReturnApi,
  deleteReturnApi,
} from "../../services/api";
// adminStore removed — all data loaded exclusively from Neon DB API
import type {
  Brand,
  SuzukiModel,
  Category,
  SuzukiPart,
  AvailabilityStatus,
  ExplodedDiagram,
  Order,
  UserProfile,
} from "../../types";
import {
  CheckCircle2,
  ShoppingCart,
  BarChart3,
  Users,
  ShieldAlert,
} from "lucide-react";
import { getStoredLogin, getStoredUser, isAdminUser } from "../../utils/auth";

const getTabFromUrl = (): AdminTab => {
  if (typeof window === "undefined") return "brands";
  const path = window.location.pathname.replace(/\/$/, "");
  const section = path.split("/")[2];
  const validTabs: AdminTab[] = [
    "brands",
    "models",
    "categories",
    "parts",
    "schematics",
    "orders",
    "returns",
    "users",
    "shipping",
    "metrics",
  ];
  if (section && validTabs.includes(section as AdminTab)) {
    return section as AdminTab;
  }
  return "brands";
};

export const AdminDashboard: React.FC = () => {
  const [authorized] = useState<boolean>(
    () => getStoredLogin() && isAdminUser(getStoredUser()),
  );
  const [activeTab, setActiveTabState] = useState<AdminTab>(() =>
    getTabFromUrl(),
  );

  const handleSetActiveTab = (tab: AdminTab) => {
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      const targetPath = `/admin/${tab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ tab }, "", targetPath);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTabState(getTabFromUrl());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

  // State — loaded exclusively from Neon DB API on mount
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<SuzukiModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [parts, setParts] = useState<SuzukiPart[]>([]);
  const [schematics, setSchematics] = useState<ExplodedDiagram[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returnsList, setReturnsList] = useState<any[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info";
  } | null>(null);

  // Modal / Drawer state
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null);

  const [isModelDrawerOpen, setIsModelDrawerOpen] = useState(false);
  const [modelToEdit, setModelToEdit] = useState<SuzukiModel | null>(null);
  const [modelDrawerInitialTab, setModelDrawerInitialTab] = useState<
    "data" | "schematics"
  >("data");

  const [isModelViewModalOpen, setIsModelViewModalOpen] = useState(false);
  const [modelToView, setModelToView] = useState<SuzukiModel | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  const [isPartDrawerOpen, setIsPartDrawerOpen] = useState(false);
  const [partToEdit, setPartToEdit] = useState<SuzukiPart | null>(null);

  const [isSchematicDrawerOpen, setIsSchematicDrawerOpen] = useState(false);
  const [schematicToEdit, setSchematicToEdit] =
    useState<ExplodedDiagram | null>(null);

  const [isSchematicViewModalOpen, setIsSchematicViewModalOpen] =
    useState(false);
  const [schematicToView, setSchematicToView] =
    useState<ExplodedDiagram | null>(null);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnToEdit, setReturnToEdit] = useState<any | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);

  // Load all data from Neon DB API on mount — no localStorage, no mocks
  useEffect(() => {
    if (!authorized) return;
    async function loadLiveData() {
      try {
        const [b, m, c, p, s, o, r, u] = await Promise.all([
          fetchBrands(),
          fetchModels(),
          fetchCategories(),
          fetchParts(),
          fetchSchematics(),
          fetchOrders(),
          fetchReturns(),
          fetchUsers(),
        ]);
        setBrands(b);
        setModels(m);
        setCategories(c);
        setParts(p);
        setSchematics(s);
        setOrders(o);
        setReturnsList(r);
        setUsers(u);
      } catch (err) {
        console.error("Error loading data from DB API:", err);
      }
    }
    loadLiveData();
  }, []);

  const handleSaveUser = async (savedUser: UserProfile) => {
    const exists = users.some((u) => u.id === savedUser.id);
    if (exists) {
      setUsers(users.map((u) => (u.id === savedUser.id ? savedUser : u)));
      showToast(`Usuario "${savedUser.fullName}" actualizado.`);
    } else {
      setUsers([...users, savedUser]);
      showToast(`Usuario "${savedUser.fullName}" creado con éxito.`);
    }
    await saveUserApi(savedUser, exists).catch((e) =>
      console.error("API Error:", e),
    );
  };

  const handleDeleteUser = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    if (confirm(`¿Estás seguro de eliminar al usuario "${user.fullName}"?`)) {
      setUsers(users.filter((u) => u.id !== id));
      showToast(`Usuario "${user.fullName}" eliminado.`, "info");
      await deleteUserApi(id).catch((e) => console.error("API Error:", e));
    }
  };

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // --- BRAND HANDLERS ---
  const handleSaveBrand = async (savedBrand: Brand) => {
    const exists = brands.some((b) => b.id === savedBrand.id);
    if (exists) {
      setBrands(brands.map((b) => (b.id === savedBrand.id ? savedBrand : b)));
      showToast(`Marca "${savedBrand.name}" actualizada con éxito.`);
    } else {
      setBrands([...brands, savedBrand]);
      showToast(`Marca "${savedBrand.name}" creada con éxito.`);
    }
    await saveBrandApi(savedBrand, exists).catch((e) =>
      console.error("API Error:", e),
    );
  };

  const handleToggleBrandActive = async (id: string) => {
    let target: Brand | undefined;
    setBrands(
      brands.map((b) => {
        if (b.id === id) {
          const updated = { ...b, active: !b.active };
          target = updated;
          showToast(
            `Marca "${b.name}" ${updated.active ? "activada" : "desactivada"}.`,
            "info",
          );
          return updated;
        }
        return b;
      }),
    );
    if (target)
      await saveBrandApi(target, true).catch((e) =>
        console.error("API Error:", e),
      );
  };

  const handleDeleteBrand = async (id: string) => {
    const brand = brands.find((b) => b.id === id);
    if (!brand) return;
    if (
      confirm(
        `¿Estás seguro de eliminar la marca "${brand.name}"? Los modelos asociados podrían quedar sin marca.`,
      )
    ) {
      setBrands(brands.filter((b) => b.id !== id));
      showToast(`Marca "${brand.name}" eliminada.`, "info");
      await deleteBrandApi(id).catch((e) => console.error("API Error:", e));
    }
  };

  // --- MODEL HANDLERS ---
  const handleSaveModel = async (savedModel: SuzukiModel) => {
    const exists = models.some((m) => m.id === savedModel.id);
    if (exists) {
      setModels(models.map((m) => (m.id === savedModel.id ? savedModel : m)));
      showToast(`Modelo "${savedModel.name}" actualizado con éxito.`);
    } else {
      setModels([...models, savedModel]);
      showToast(`Modelo "${savedModel.name}" creado con éxito.`);
    }
    await saveModelApi(savedModel, exists).catch((e) =>
      console.error("API Error:", e),
    );
  };

  const handleDuplicateModel = async (sourceModel: SuzukiModel) => {
    const newId = `${sourceModel.id}-copy-${Date.now().toString().slice(-4)}`;
    const duplicated: SuzukiModel = {
      ...sourceModel,
      id: newId,
      name: `${sourceModel.name} (Copia)`,
      notes: `Duplicado de ${sourceModel.name}`,
    };
    setModels([...models, duplicated]);
    showToast(`Modelo "${sourceModel.name}" duplicado con éxito.`);
    await saveModelApi(duplicated, false).catch((e) =>
      console.error("API Error:", e),
    );
  };

  const handleToggleModelActive = async (id: string) => {
    let target: SuzukiModel | undefined;
    setModels(
      models.map((m) => {
        if (m.id === id) {
          const updated = { ...m, active: m.active === false ? true : false };
          target = updated;
          showToast(
            `Modelo "${m.name}" ${updated.active ? "activado" : "desactivado"}.`,
            "info",
          );
          return updated;
        }
        return m;
      }),
    );
    if (target)
      await saveModelApi(target, true).catch((e) =>
        console.error("API Error:", e),
      );
  };

  const handleDeleteModel = async (id: string) => {
    const model = models.find((m) => m.id === id);
    if (!model) return;
    if (confirm(`¿Estás seguro de eliminar el modelo "${model.name}"?`)) {
      setModels(models.filter((m) => m.id !== id));
      showToast(`Modelo "${model.name}" eliminado.`, "info");
      await deleteModelApi(id).catch((e) => console.error("API Error:", e));
    }
  };

  // --- CATEGORY HANDLERS ---
  const handleSaveCategory = async (savedCategory: Category) => {
    const exists = categories.some((c) => c.id === savedCategory.id);
    if (exists) {
      setCategories(
        categories.map((c) => (c.id === savedCategory.id ? savedCategory : c)),
      );
      showToast(`Categoría "${savedCategory.name}" actualizada con éxito.`);
    } else {
      setCategories([...categories, savedCategory]);
      showToast(`Categoría "${savedCategory.name}" creada con éxito.`);
    }
    await saveCategoryApi(savedCategory, exists).catch((e) =>
      console.error("API Error:", e),
    );
  };

  const handleToggleCategoryActive = async (id: string) => {
    let target: Category | undefined;
    setCategories(
      categories.map((c) => {
        if (c.id === id) {
          const updated = { ...c, active: !c.active };
          target = updated;
          showToast(
            `Categoría "${c.name}" ${updated.active ? "activada" : "desactivada"}.`,
            "info",
          );
          return updated;
        }
        return c;
      }),
    );
    if (target)
      await saveCategoryApi(target, true).catch((e) =>
        console.error("API Error:", e),
      );
  };

  const handleDeleteCategory = async (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    if (
      confirm(
        `¿Estás seguro de eliminar la categoría "${cat.name}" y sus subcategorías?`,
      )
    ) {
      setCategories(categories.filter((c) => c.id !== id));
      showToast(`Categoría "${cat.name}" eliminada.`, "info");
      await deleteCategoryApi(id).catch((e) => console.error("API Error:", e));
    }
  };

  // --- SCHEMATIC-TO-MODEL LINKING HANDLERS ---
  const handleLinkSchematicToModel = async (
    schematicId: string,
    modelId: string,
  ) => {
    let target: ExplodedDiagram | undefined;
    setSchematics(
      schematics.map((s) => {
        if (s.id === schematicId) {
          const existingIds = s.applicableModelIds || [];
          if (!existingIds.includes(modelId)) {
            showToast(`Despiece "${s.title}" vinculado al modelo.`, "info");
            target = { ...s, applicableModelIds: [...existingIds, modelId] };
            return target;
          }
        }
        return s;
      }),
    );
    if (target)
      await saveSchematicApi(target, true).catch((e) =>
        console.error("API Error:", e),
      );
  };

  const handleUnlinkSchematicFromModel = async (
    schematicId: string,
    modelId: string,
  ) => {
    let target: ExplodedDiagram | undefined;
    setSchematics(
      schematics.map((s) => {
        if (s.id === schematicId) {
          const updatedIds = (s.applicableModelIds || []).filter(
            (id) => id !== modelId,
          );
          showToast(`Despiece "${s.title}" desvinculado del modelo.`, "info");
          target = { ...s, applicableModelIds: updatedIds };
          return target;
        }
        return s;
      }),
    );
    if (target)
      await saveSchematicApi(target, true).catch((e) =>
        console.error("API Error:", e),
      );
  };

  const handleCreateSchematicForModel = (
    model: SuzukiModel,
    presetCategory?: string,
  ) => {
    setIsModelDrawerOpen(false);
    const minY = model.years?.length ? Math.min(...model.years) : "";
    const maxY = model.years?.length ? Math.max(...model.years) : "";

    const catName = presetCategory || "";

    const sectionMap: Record<string, string> = {
      "Frenos & Suspensión": "Brakes",
      "Transmisión & Embrague": "Drive & Transmission",
      "Eléctrico & Encendido": "Frame & Electrical",
      "Chasis & Carrocería": "Frame & Electrical",
      "Motor & Admisión": "Engine",
    };

    const presetSchematic: ExplodedDiagram = {
      id: `diag-${Date.now().toString().slice(-6)}`,
      title: `Despiece ${catName} - ${model.name}`,
      category: catName,
      section: sectionMap[catName] || "",
      applicableModelIds: [model.id],
      modelTarget: model.years?.length
        ? `${model.name} (${minY}-${maxY})`
        : model.name,
      diagramImage: "",
      description: `Diagrama despiece oficial para ${model.name}${catName ? ` (${catName}).` : "."}`,
      hotspots: [],
    };

    setSchematicToEdit(presetSchematic);
    setIsSchematicDrawerOpen(true);
  };

  // --- PART HANDLERS ---
  const handleSavePart = async (savedPart: SuzukiPart) => {
    const exists = parts.some((p) => p.id === savedPart.id);
    if (exists) {
      setParts(parts.map((p) => (p.id === savedPart.id ? savedPart : p)));
      showToast(`Repuesto "${savedPart.name}" actualizado con éxito.`);
    } else {
      setParts([...parts, savedPart]);
      showToast(`Repuesto "${savedPart.name}" creado con éxito.`);
    }
    await savePartApi(savedPart, exists).catch((e) =>
      console.error("API Error:", e),
    );
  };

  const handleDuplicatePart = async (sourcePart: SuzukiPart) => {
    const newId = `part-${Date.now().toString().slice(-6)}`;
    const duplicated: SuzukiPart = {
      ...sourcePart,
      id: newId,
      name: `${sourcePart.name} (Copia)`,
      oemNumbers: sourcePart.oemNumbers[0]
        ? [`${sourcePart.oemNumbers[0]}-COPY`, ...sourcePart.oemNumbers.slice(1)]
        : sourcePart.oemNumbers,
    };
    setParts([...parts, duplicated]);
    showToast(`Repuesto "${sourcePart.name}" duplicado con éxito.`);
    await savePartApi(duplicated, false).catch((e) =>
      console.error("API Error:", e),
    );
  };

  const handleTogglePartAvailability = async (id: string) => {
    let target: SuzukiPart | undefined;
    setParts(
      parts.map((p) => {
        if (p.id === id) {
          const current =
            p.availability || (p.stock > 0 ? "in_stock" : "on_order");
          let nextStatus: AvailabilityStatus = "in_stock";
          if (current === "in_stock") nextStatus = "international";
          else if (current === "international") nextStatus = "on_order";
          else nextStatus = "in_stock";

          const updated = { ...p, availability: nextStatus };
          target = updated;
          showToast(
            `Disponibilidad de "${p.name}" cambiada a ${nextStatus}.`,
            "info",
          );
          return updated;
        }
        return p;
      }),
    );
    if (target)
      await savePartApi(target, true).catch((e) =>
        console.error("API Error:", e),
      );
  };

  const handleDeletePart = async (id: string) => {
    const part = parts.find((p) => p.id === id);
    if (!part) return;
    if (confirm(`¿Estás seguro de eliminar el repuesto "${part.name}"?`)) {
      setParts(parts.filter((p) => p.id !== id));
      showToast(`Repuesto "${part.name}" eliminado del catálogo.`, "info");
      await deletePartApi(id).catch((e) => console.error("API Error:", e));
    }
  };

  // --- SCHEMATIC HANDLERS ---
  const handleSaveSchematic = async (savedSchematic: ExplodedDiagram) => {
    const exists = schematics.some((s) => s.id === savedSchematic.id);
    if (exists) {
      setSchematics(
        schematics.map((s) =>
          s.id === savedSchematic.id ? savedSchematic : s,
        ),
      );
      showToast(`Despiece "${savedSchematic.title}" actualizado con éxito.`);
    } else {
      setSchematics([...schematics, savedSchematic]);
      showToast(`Despiece "${savedSchematic.title}" creado con éxito.`);
    }
    await saveSchematicApi(savedSchematic, exists).catch((e) =>
      console.error("API Error:", e),
    );
  };

  const handleDuplicateSchematic = async (sourceSchematic: ExplodedDiagram) => {
    const newId = `diag-${Date.now().toString().slice(-6)}`;
    const duplicated: ExplodedDiagram = {
      ...sourceSchematic,
      id: newId,
      title: `${sourceSchematic.title} (Copia)`,
    };
    setSchematics([...schematics, duplicated]);
    showToast(`Despiece "${sourceSchematic.title}" duplicado con éxito.`);
    await saveSchematicApi(duplicated, false).catch((e) =>
      console.error("API Error:", e),
    );
  };

  const handleSaveOrder = async (savedOrder: Order) => {
    setOrders(orders.map((o) => (o.id === savedOrder.id ? savedOrder : o)));
    showToast(`Pedido ${savedOrder.id} actualizado con éxito.`);
    await saveOrderApi(savedOrder, true).catch((e) =>
      console.error("API Error:", e),
    );
  };

  const handleDeleteSchematic = async (id: string) => {
    const schematic = schematics.find((s) => s.id === id);
    if (!schematic) return;
    if (
      confirm(`¿Estás seguro de eliminar el despiece "${schematic.title}"?`)
    ) {
      setSchematics(schematics.filter((s) => s.id !== id));
      showToast(`Despiece "${schematic.title}" eliminado.`, "info");
      await deleteSchematicApi(id).catch((e) => console.error("API Error:", e));
    }
  };

  const handleSaveReturn = async (updated: any) => {
    try {
      const res = await saveReturnApi(updated, true);
      if (res.success) {
        setReturnsList((prev) =>
          prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
        );
        showToast(`Devolución ${updated.id} actualizada correctamente`);
        // Recargar inventario por si se restauro stock
        if (updated.restockInventory) {
          const freshParts = await fetchParts();
          setParts(freshParts);
        }
      }
    } catch (e) {
      console.error("Error guardando devolución:", e);
    }
  };

  const handleDeleteReturn = async (id: string) => {
    if (!confirm(`¿Estás seguro de eliminar el registro de devolución ${id}?`)) return;
    try {
      const res = await deleteReturnApi(id);
      if (res.success) {
        setReturnsList((prev) => prev.filter((r) => r.id !== id));
        showToast(`Devolución ${id} eliminada`);
      }
    } catch (e) {
      console.error("Error eliminando devolución:", e);
    }
  };

  const handlePrimaryAction = () => {
    if (activeTab === "brands") {
      setBrandToEdit(null);
      setIsBrandModalOpen(true);
    } else if (activeTab === "models") {
      setModelToEdit(null);
      setModelDrawerInitialTab("data");
      setIsModelDrawerOpen(true);
    } else if (activeTab === "categories") {
      setCategoryToEdit(null);
      setIsCategoryModalOpen(true);
    } else if (activeTab === "parts") {
      setPartToEdit(null);
      setIsPartDrawerOpen(true);
    } else if (activeTab === "schematics") {
      setSchematicToEdit(null);
      setIsSchematicDrawerOpen(true);
    } else if (activeTab === "users") {
      setUserToEdit(null);
      setIsUserModalOpen(true);
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] flex font-sans antialiased items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-5 border border-red-100">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-slate-900 mb-2">
            Acceso denegado
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Este panel es exclusivo para administradores. Inicia sesión con una
            cuenta con rol de administrador para continuar.
          </p>
          <a
            href="/garaje"
            className="w-full inline-flex justify-center py-3 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-colors"
          >
            Volver al Garaje
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] flex font-sans antialiased">
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        brandsCount={brands.length}
        modelsCount={models.length}
        categoriesCount={categories.length}
        partsCount={parts.length}
        schematicsCount={schematics.length}
        ordersCount={orders.length}
        returnsCount={returnsList.length}
        usersCount={users.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <AdminHeader
          title={
            activeTab === "brands"
              ? "Gestión de Marcas"
              : activeTab === "models"
                ? "Gestión de Modelos"
                : activeTab === "categories"
                  ? "Gestión de Categorías & Subcategorías"
                  : activeTab === "parts"
                    ? "Catálogo de Repuestos"
                    : activeTab === "schematics"
                      ? "Despieces Explosión"
                      : activeTab === "orders"
                        ? "Gestión de Pedidos"
                        : activeTab === "users"
                          ? "Gestión de Usuarios"
                          : "Métricas & Informes"
          }
          subtitle={
            activeTab === "brands"
              ? "Administra las marcas de motocicletas y sus configuraciones en el catálogo Suzuki Parts"
              : activeTab === "models"
                ? "Administra la compatibilidad por modelo, años, versiones, despieces y especificaciones OEM"
                : activeTab === "categories"
                  ? "Administra la estructura jerárquica de categorías principales y subcategorías de repuestos"
                  : activeTab === "parts"
                    ? "Administra el catálogo oficial de repuestos OEM, precios, existencias y matriz de compatibilidad"
                    : activeTab === "schematics"
                      ? "Administra diagramas exploded-view y puntos hotspots interactivos vinculados a repuestos"
                      : activeTab === "orders"
                        ? "Administra el procesamiento de pedidos, guías de envío y estados de logística"
                        : activeTab === "users"
                          ? "Administra las cuentas de usuarios registrados, roles y permisos de acceso"
                          : "Sistema administrativo Suzuki Parts Expert"
          }
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onPrimaryAction={
            activeTab === "brands" ||
            activeTab === "models" ||
            activeTab === "categories" ||
            activeTab === "parts" ||
            activeTab === "schematics" ||
            activeTab === "users"
              ? handlePrimaryAction
              : undefined
          }
          primaryActionLabel={
            activeTab === "brands"
              ? "Nueva Marca"
              : activeTab === "models"
                ? "Nuevo Modelo"
                : activeTab === "categories"
                  ? "Nueva Categoría"
                  : activeTab === "parts"
                    ? "Nuevo Repuesto"
                    : activeTab === "users"
                      ? "Nuevo Usuario"
                      : "Nuevo Despiece"
          }
        />

        {/* Content Body */}
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Toast Notification Banner */}
          {toast && (
            <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
              <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
                <span className="text-xs font-bold font-mono">
                  {toast.message}
                </span>
              </div>
            </div>
          )}

          {/* Metrics KPIs Summary */}
          <AdminMetrics brands={brands} models={models} />

          {/* Tab Views */}
          {activeTab === "brands" && (
            <BrandsManager
              brands={brands}
              searchQuery={searchQuery}
              onAddBrand={() => {
                setBrandToEdit(null);
                setIsBrandModalOpen(true);
              }}
              onEditBrand={(brand) => {
                setBrandToEdit(brand);
                setIsBrandModalOpen(true);
              }}
              onToggleActive={handleToggleBrandActive}
              onDeleteBrand={handleDeleteBrand}
            />
          )}

          {activeTab === "models" && (
            <ModelsManager
              models={models}
              brands={brands}
              schematics={schematics}
              searchQuery={searchQuery}
              onAddModel={() => {
                setModelToEdit(null);
                setModelDrawerInitialTab("data");
                setIsModelDrawerOpen(true);
              }}
              onEditModel={(model) => {
                setModelToEdit(model);
                setModelDrawerInitialTab("data");
                setIsModelDrawerOpen(true);
              }}
              onViewModel={(model) => {
                setModelToView(model);
                setIsModelViewModalOpen(true);
              }}
              onManageSchematics={(model) => {
                setModelToEdit(model);
                setModelDrawerInitialTab("schematics");
                setIsModelDrawerOpen(true);
              }}
              onDuplicateModel={handleDuplicateModel}
              onToggleActive={handleToggleModelActive}
              onDeleteModel={handleDeleteModel}
            />
          )}

          {activeTab === "categories" && (
            <CategoriesManager
              categories={categories}
              parts={parts}
              searchQuery={searchQuery}
              onAddCategory={() => {
                setCategoryToEdit(null);
                setIsCategoryModalOpen(true);
              }}
              onEditCategory={(cat) => {
                setCategoryToEdit(cat);
                setIsCategoryModalOpen(true);
              }}
              onToggleCategoryActive={handleToggleCategoryActive}
              onDeleteCategory={handleDeleteCategory}
              onSaveCategory={handleSaveCategory}
            />
          )}

          {activeTab === "parts" && (
            <PartsManager
              parts={parts}
              models={models}
              searchQuery={searchQuery}
              onAddPart={() => {
                setPartToEdit(null);
                setIsPartDrawerOpen(true);
              }}
              onEditPart={(part) => {
                setPartToEdit(part);
                setIsPartDrawerOpen(true);
              }}
              onDuplicatePart={handleDuplicatePart}
              onToggleAvailability={handleTogglePartAvailability}
              onDeletePart={handleDeletePart}
            />
          )}

          {activeTab === "schematics" && (
            <SchematicsManager
              schematics={schematics}
              models={models}
              parts={parts}
              searchQuery={searchQuery}
              onAddSchematic={() => {
                setSchematicToEdit(null);
                setIsSchematicDrawerOpen(true);
              }}
              onEditSchematic={(schematic) => {
                setSchematicToEdit(schematic);
                setIsSchematicDrawerOpen(true);
              }}
              onViewSchematic={(schematic) => {
                setSchematicToView(schematic);
                setIsSchematicViewModalOpen(true);
              }}
              onDuplicateSchematic={handleDuplicateSchematic}
              onDeleteSchematic={handleDeleteSchematic}
            />
          )}

          {activeTab === "orders" && (
            <OrdersManager
              orders={orders}
              searchQuery={searchQuery}
              onEditOrder={(ord) => {
                setOrderToEdit(ord);
                setIsOrderModalOpen(true);
              }}
              onViewOrder={(ord) => {
                setOrderToEdit(ord);
                setIsOrderModalOpen(true);
              }}
            />
          )}

          {activeTab === "returns" && (
            <ReturnsManager
              returnsList={returnsList}
              searchQuery={searchQuery}
              onEditReturn={(item) => {
                setReturnToEdit(item);
                setIsReturnModalOpen(true);
              }}
              onDeleteReturn={handleDeleteReturn}
              onViewOrder={(orderId) => {
                const found = orders.find((o: any) => o.id === orderId);
                if (found) {
                  setOrderToEdit(found);
                } else {
                  setOrderToEdit({ id: orderId, date: new Date().toISOString(), customerName: 'Cliente', email: '', phone: '', documentId: '', city: '', shippingAddress: '', postalCode: '', items: [], totalPrice: 0, guaranteeCode: '', paymentMethod: 'transferencia', status: 'Entregado' } as any);
                }
                setIsOrderModalOpen(true);
              }}
            />
          )}

          {activeTab === "users" && (
            <UsersManager
              users={users}
              searchQuery={searchQuery}
              onAddUser={() => {
                setUserToEdit(null);
                setIsUserModalOpen(true);
              }}
              onEditUser={(usr) => {
                setUserToEdit(usr);
                setIsUserModalOpen(true);
              }}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeTab === "shipping" && <ShippingManager />}

          {activeTab === "taxes" && <TaxSettingsManager />}

          {activeTab === "coupons" && <CouponsManager />}

          {/* Placeholder views for remaining modules */}
          {activeTab !== "brands" &&
            activeTab !== "models" &&
            activeTab !== "categories" &&
            activeTab !== "parts" &&
            activeTab !== "schematics" &&
            activeTab !== "orders" &&
            activeTab !== "returns" &&
            activeTab !== "users" &&
            activeTab !== "shipping" &&
            activeTab !== "taxes" &&
            activeTab !== "coupons" && (
              <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center max-w-xl mx-auto my-12 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#E60012] border border-red-200 flex items-center justify-center mx-auto mb-4">
                  {activeTab === "metrics" && <BarChart3 className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight font-display">
                  MÓDULO {activeTab.toUpperCase()}
                </h3>
                <p className="text-xs text-slate-500 mb-6 font-sans">
                  Este módulo está listo para enlazarse con los flujos de
                  pedidos y métricas de ventas.
                </p>
                <button
                  onClick={() => handleSetActiveTab("categories")}
                  className="px-5 py-2.5 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                >
                  Ir a Categorías y Subcat
                </button>
              </div>
            )}
        </main>
      </div>

      {/* Modals & Drawers */}
      <BrandModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        onSave={handleSaveBrand}
        brandToEdit={brandToEdit}
      />

      <ModelDrawer
        isOpen={isModelDrawerOpen}
        onClose={() => setIsModelDrawerOpen(false)}
        onSave={handleSaveModel}
        modelToEdit={modelToEdit}
        brands={brands}
        schematics={schematics}
        onLinkSchematic={handleLinkSchematicToModel}
        onUnlinkSchematic={handleUnlinkSchematicFromModel}
        onCreateSchematicForModel={handleCreateSchematicForModel}
        onEditSchematic={(schematic) => {
          setIsModelDrawerOpen(false);
          setSchematicToEdit(schematic);
          setIsSchematicDrawerOpen(true);
        }}
        onViewSchematic={(schematic) => {
          setSchematicToView(schematic);
          setIsSchematicViewModalOpen(true);
        }}
        initialTab={modelDrawerInitialTab}
      />

      <ModelViewModal
        isOpen={isModelViewModalOpen}
        onClose={() => setIsModelViewModalOpen(false)}
        model={modelToView}
        brands={brands}
        schematics={schematics}
        onEditModel={(model) => {
          setIsModelViewModalOpen(false);
          setModelToEdit(model);
          setModelDrawerInitialTab("data");
          setIsModelDrawerOpen(true);
        }}
        onViewSchematic={(sch) => {
          setIsModelViewModalOpen(false);
          setSchematicToView(sch);
          setIsSchematicViewModalOpen(true);
        }}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        categoryToEdit={categoryToEdit}
      />

      <PartDrawer
        isOpen={isPartDrawerOpen}
        onClose={() => setIsPartDrawerOpen(false)}
        onSave={handleSavePart}
        partToEdit={partToEdit}
        models={models}
      />

      <SchematicDrawer
        isOpen={isSchematicDrawerOpen}
        onClose={() => setIsSchematicDrawerOpen(false)}
        onSave={handleSaveSchematic}
        schematicToEdit={schematicToEdit}
        models={models}
        parts={parts}
      />

      <SchematicViewModal
        isOpen={isSchematicViewModalOpen}
        onClose={() => setIsSchematicViewModalOpen(false)}
        schematic={schematicToView}
        parts={parts}
        onEditSchematic={(schematic) => {
          setIsSchematicViewModalOpen(false);
          setSchematicToEdit(schematic);
          setIsSchematicDrawerOpen(true);
        }}
        onEditPart={(part) => {
          setIsSchematicViewModalOpen(false);
          setPartToEdit(part);
          setIsPartDrawerOpen(true);
        }}
      />

      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        order={orderToEdit}
        onSaveOrder={handleSaveOrder}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        userToEdit={userToEdit}
        onSaveUser={handleSaveUser}
      />

      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        returnItem={returnToEdit}
        onSaveReturn={handleSaveReturn}
      />
    </div>
  );
};
