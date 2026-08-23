import React, { useState, useEffect } from "react";
import { AdminSidebar, type AdminTab } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminMobileDock } from "./AdminMobileDock";
import { AdminMobileMenu } from "./AdminMobileMenu";
import { AdminMetrics } from "./AdminMetrics";
import { BrandsManager } from "./BrandsManager";
import { ModelsManager } from "./ModelsManager";
import { CategoriesManager } from "./CategoriesManager";
import { PartsManager } from "./PartsManager";
import { KardexManager } from "./KardexManager";
import { SchematicsManager } from "./SchematicsManager";
import { OrdersManager } from "./OrdersManager";
import { UsersManager } from "./UsersManager";
import { ShippingManager } from "./ShippingManager";
import { PaymentsManager } from "./PaymentsManager";
import { SettingsManager } from "./SettingsManager";
import { CouponsManager } from "./CouponsManager";
import { ReturnsManager } from "./ReturnsManager";
import { ReturnModal } from "./ReturnModal";
import { getStoreName } from "../../utils/config";
import { BrandModal } from "./BrandModal";
import { ModelDrawer } from "./ModelDrawer";
import { ModelViewModal } from "./ModelViewModal";
import { CategoryModal } from "./CategoryModal";
import { PartDrawer } from "./PartDrawer";
import { SchematicDrawer } from "./SchematicDrawer";
import { SchematicViewModal } from "./SchematicViewModal";
import { OrderModal } from "./OrderModal";
import { UserModal } from "./UserModal";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { RoleModal } from "./RoleModal";
import {
  fetchBrands,
  fetchModels,
  fetchCategories,
  fetchParts,
  fetchSchematics,
  fetchOrders,
  fetchUsers,
  fetchReturns,
  fetchRoles,
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
  saveRoleApi,
  deleteRoleApi,
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
  Role,
} from "../../types";
import {
  CheckCircle2,
  ShoppingCart,
  BarChart3,
  Users,
  ShieldAlert,
} from "lucide-react";
import { getStoredLogin, getStoredUser, isAdminUser, hasModulePermission } from "../../utils/auth";
import { SiteSettingsProvider } from "../SiteSettingsProvider";

const getTabFromUrl = (): AdminTab => {
  if (typeof window === "undefined") return "brands";
  const path = window.location.pathname.replace(/\/$/, "");
  const section = path.split("/")[2];
  const validTabs: AdminTab[] = [
    "brands",
    "models",
    "categories",
    "parts",
    "kardex",
    "schematics",
    "orders",
    "returns",
    "users",
    "shipping",
    "payments",
    "settings",
    "coupons",
    "metrics",
  ];
  const sectionClean = section === "taxes" ? "settings" : section;
  if (sectionClean && validTabs.includes(sectionClean as AdminTab)) {
    return sectionClean as AdminTab;
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

  // Mobile menu drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // State — loaded exclusively from Neon DB API on mount
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<SuzukiModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [parts, setParts] = useState<SuzukiPart[]>([]);
  const [schematics, setSchematics] = useState<ExplodedDiagram[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returnsList, setReturnsList] = useState<any[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  // Current logged in user profile
  const currentUser = getStoredUser();

  // Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
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
  const [kardexFilterPartId, setKardexFilterPartId] = useState<string | undefined>(undefined);

  const [isSchematicDrawerOpen, setIsSchematicDrawerOpen] = useState(false);
  const [schematicToEdit, setSchematicToEdit] =
    useState<ExplodedDiagram | null>(null);

  const [isSchematicViewModalOpen, setIsSchematicViewModalOpen] =
    useState(false);
  const [schematicToView, setSchematicToView] =
    useState<ExplodedDiagram | null>(null);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [orderModalMode, setOrderModalMode] = useState<'view' | 'edit'>('edit');

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnToEdit, setReturnToEdit] = useState<any | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);

  // Confirm delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    itemName?: string;
    itemSubtitle?: string;
    itemImage?: string;
    warningText?: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const [isLoadingData, setIsLoadingData] = useState(true);

  // Ensure activeTab is authorized for current user, otherwise redirect to first authorized tab
  useEffect(() => {
    if (!authorized) return;
    const validTabs: AdminTab[] = [
      "brands",
      "models",
      "categories",
      "parts",
      "kardex",
      "schematics",
      "orders",
      "returns",
      "users",
      "shipping",
      "payments",
      "settings",
      "coupons",
      "metrics",
    ];

    if (!hasModulePermission(currentUser, activeTab, 'read')) {
      const firstAllowed = validTabs.find(tab => hasModulePermission(currentUser, tab, 'read'));
      if (firstAllowed && firstAllowed !== activeTab) {
        handleSetActiveTab(firstAllowed);
      }
    }
  }, [activeTab, authorized]);

  // Load all data from Neon DB API on mount — no localStorage, no mocks
  useEffect(() => {
    if (!authorized) return;
    async function loadLiveData() {
      setIsLoadingData(true);
      try {
        const [b, m, c, p, s, o, r, u, ro] = await Promise.all([
          fetchBrands(),
          fetchModels(),
          fetchCategories(),
          fetchParts(),
          fetchSchematics(),
          fetchOrders(),
          fetchReturns(),
          fetchUsers(),
          fetchRoles(),
        ]);
        setBrands(b);
        setModels(m);
        setCategories(c);
        setParts(p);
        setSchematics(s);
        setOrders(o);
        setReturnsList(r);
        setUsers(u);
        setRoles(ro);
      } catch (err) {
        console.error("Error loading data from DB API:", err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadLiveData();
  }, [authorized]);

  const handleSaveUser = async (savedUser: UserProfile) => {
    const exists = users.some((u) => u.id === savedUser.id);
    try {
      const res = await saveUserApi(savedUser, exists);
      if (res && res.success !== false) {
        if (exists) {
          setUsers(users.map((u) => (u.id === savedUser.id ? savedUser : u)));
          showToast(`Usuario "${savedUser.fullName}" actualizado.`);
        } else {
          setUsers([...users, savedUser]);
          showToast(`Usuario "${savedUser.fullName}" creado con éxito.`);
        }
      } else {
        showToast(`Error al guardar usuario: ${res?.error || "Desconocido"}`, "error");
      }
    } catch (e: any) {
      console.error("API Error:", e);
      showToast(`Error al guardar usuario: ${e?.message || e}`, "error");
    }
  };

  const handleDeleteUser = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    setDeleteModal({
      isOpen: true,
      title: "¿Eliminar usuario?",
      description: "¿Estás seguro de que deseas eliminar permanentemente a este usuario?",
      itemName: user.fullName,
      itemSubtitle: `Email: ${user.email} • Rol: ${user.role}`,
      itemImage: user.avatarUrl,
      warningText: "El usuario ya no podrá acceder a su cuenta ni a su historial.",
      onConfirm: async () => {
        setDeleteModal((prev) => (prev ? { ...prev, isLoading: true } : null));
        try {
          await deleteUserApi(id);
          setUsers((prev) => prev.filter((u) => u.id !== id));
          showToast(`Usuario "${user.fullName}" eliminado.`, "info");
        } catch (e: any) {
          console.error("API Error:", e);
          showToast(`Error al eliminar usuario: ${e?.message || e}`, "error");
        } finally {
          setDeleteModal(null);
        }
      }
    });
  };

  const handleSaveRole = async (savedRole: Partial<Role>) => {
    const exists = roles.some((r) => r.id === savedRole.id);
    try {
      const res = await saveRoleApi(savedRole, exists);
      if (res && res.success !== false) {
        if (exists) {
          setRoles(roles.map((r) => (r.id === savedRole.id ? { ...r, ...savedRole } as Role : r)));
          showToast(`Rol "${savedRole.name}" actualizado con éxito.`);
        } else {
          setRoles([...roles, savedRole as Role]);
          showToast(`Rol "${savedRole.name}" creado con éxito.`);
        }
        setIsRoleModalOpen(false);
      } else {
        showToast(`Error al guardar rol: ${res?.error || "Desconocido"}`, "error");
      }
    } catch (e: any) {
      console.error("API Error:", e);
      showToast(`Error al guardar rol: ${e?.message || e}`, "error");
    }
  };

  const handleDeleteRole = (id: string) => {
    const role = roles.find((r) => r.id === id);
    if (!role) return;
    if (role.isSystem) {
      showToast("No se pueden eliminar roles de sistema.", "error");
      return;
    }
    setDeleteModal({
      isOpen: true,
      title: "¿Eliminar rol / grupo de permisos?",
      description: "¿Estás seguro de que deseas eliminar permanentemente este rol?",
      itemName: role.name,
      itemSubtitle: `Identificador: ${role.slug}`,
      warningText: "Los usuarios asignados a este rol perderán los permisos específicos configurados.",
      onConfirm: async () => {
        setDeleteModal((prev) => (prev ? { ...prev, isLoading: true } : null));
        try {
          await deleteRoleApi(id);
          setRoles((prev) => prev.filter((r) => r.id !== id));
          showToast(`Rol "${role.name}" eliminado.`, "info");
        } catch (e: any) {
          console.error("API Error:", e);
          showToast(`Error al eliminar rol: ${e?.message || e}`, "error");
        } finally {
          setDeleteModal(null);
        }
      }
    });
  };

  const showToast = (
    message: string,
    type: "success" | "info" | "error" = "success",
  ) => {
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

  const handleDeleteBrand = (id: string) => {
    const brand = brands.find((b) => b.id === id);
    if (!brand) return;
    setDeleteModal({
      isOpen: true,
      title: "¿Eliminar marca?",
      description: "¿Estás seguro de que deseas eliminar esta marca?",
      itemName: brand.name,
      itemSubtitle: `País: ${brand.country || "N/A"}`,
      itemImage: brand.logo,
      warningText: "Los modelos asociados a esta marca podrían quedar sin fabricante asignado.",
      onConfirm: async () => {
        setDeleteModal((prev) => (prev ? { ...prev, isLoading: true } : null));
        try {
          await deleteBrandApi(id);
          setBrands((prev) => prev.filter((b) => b.id !== id));
          showToast(`Marca "${brand.name}" eliminada.`, "info");
        } catch (e: any) {
          console.error("API Error:", e);
          showToast(`Error al eliminar marca: ${e?.message || e}`, "error");
        } finally {
          setDeleteModal(null);
        }
      },
    });
  };

  // --- MODEL HANDLERS ---
  const handleSaveModel = async (savedModel: SuzukiModel) => {
    const exists = models.some((m) => m.id === savedModel.id);
    try {
      const res = await saveModelApi(savedModel, exists);
      if (res && res.success !== false) {
        if (exists) {
          setModels(models.map((m) => (m.id === savedModel.id ? savedModel : m)));
          showToast(`Modelo "${savedModel.name}" actualizado con éxito.`);
        } else {
          setModels([...models, savedModel]);
          showToast(`Modelo "${savedModel.name}" creado con éxito.`);
        }
      } else {
        showToast(
          `No se pudo guardar el modelo: ${res?.error || "Error desconocido"}`,
          "info",
        );
      }
    } catch (e: any) {
      console.error("API Error:", e);
      showToast(`Error al guardar en la base de datos: ${e?.message || e}`, "info");
    }
  };

  const handleDuplicateModel = async (sourceModel: SuzukiModel) => {
    const newId = crypto.randomUUID();
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

  const handleDeleteModel = (id: string) => {
    const model = models.find((m) => m.id === id);
    if (!model) return;
    setDeleteModal({
      isOpen: true,
      title: "¿Eliminar modelo?",
      description: "¿Estás seguro de que deseas eliminar este modelo de motocicleta?",
      itemName: model.name,
      itemSubtitle: `Categoría: ${model.category || "General"} • Versiones: ${model.versions?.join(", ") || "N/A"}`,
      itemImage: model.image,
      warningText: "Los repuestos y despieces vinculados a este modelo perderán la compatibilidad específica.",
      onConfirm: async () => {
        setDeleteModal((prev) => (prev ? { ...prev, isLoading: true } : null));
        try {
          await deleteModelApi(id);
          setModels((prev) => prev.filter((m) => m.id !== id));
          showToast(`Modelo "${model.name}" eliminado.`, "info");
        } catch (e: any) {
          console.error("API Error:", e);
          showToast(`Error al eliminar modelo: ${e?.message || e}`, "error");
        } finally {
          setDeleteModal(null);
        }
      },
    });
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

  const handleDeleteCategory = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    setDeleteModal({
      isOpen: true,
      title: "¿Eliminar categoría?",
      description: "¿Estás seguro de que deseas eliminar esta categoría?",
      itemName: cat.name,
      itemSubtitle: `Slug: /categoria/${cat.slug}`,
      warningText: "Las subcategorías asociadas se eliminarán y los repuestos asignados deberán reubicarse.",
      onConfirm: async () => {
        setDeleteModal((prev) => (prev ? { ...prev, isLoading: true } : null));
        try {
          await deleteCategoryApi(id);
          setCategories((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
          showToast(`Categoría "${cat.name}" eliminada.`, "info");
        } catch (e: any) {
          console.error("API Error:", e);
          showToast(`Error al eliminar categoría: ${e?.message || e}`, "error");
        } finally {
          setDeleteModal(null);
        }
      },
    });
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
    sectionName?: string,
  ) => {
    const minY = model.years?.[0] || 2020;
    const maxY = model.years?.[model.years.length - 1] || 2024;
    const sec = sectionName || "Motor";

    const presetSchematic: ExplodedDiagram = {
      id: crypto.randomUUID(),
      title: `Despiece ${sec} - ${model.name}`,
      category: sec,
      section: sec,
      applicableModelIds: [model.id],
      modelTarget: model.years?.length
        ? `${model.name} (${minY}-${maxY})`
        : model.name,
      diagramImage: "",
      description: `Diagrama despiece oficial para ${model.name} (${sec}).`,
      hotspots: [],
    };

    setSchematicToEdit(presetSchematic);
    setIsSchematicDrawerOpen(true);
  };

  // --- PART HANDLERS ---
  const handleSavePart = async (savedPart: SuzukiPart) => {
    const exists = parts.some((p) => p.id === savedPart.id);
    try {
      const res = await savePartApi(savedPart, exists);
      if (res && res.success !== false) {
        if (exists) {
          setParts(parts.map((p) => (p.id === savedPart.id ? savedPart : p)));
          showToast(`Repuesto "${savedPart.name}" actualizado con éxito.`, "success");
        } else {
          setParts([...parts, savedPart]);
          showToast(`Repuesto "${savedPart.name}" creado con éxito en el catálogo.`, "success");
        }
        return res;
      } else {
        showToast(`Error al guardar repuesto: ${res?.error || "Error desconocido"}`, "error");
        throw new Error(res?.error || "Error al guardar repuesto");
      }
    } catch (e: any) {
      console.error("API Error guardando repuesto:", e);
      showToast(`Error al guardar repuesto en base de datos: ${e?.message || e}`, "error");
      throw e;
    }
  };

  const handleDuplicatePart = async (sourcePart: SuzukiPart) => {
    const newId = crypto.randomUUID();
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

  const handleTogglePartActive = async (part: SuzukiPart) => {
    const nextActive = part.active === false;
    const updated: SuzukiPart = { ...part, active: nextActive };
    setParts(parts.map((p) => (p.id === part.id ? updated : p)));
    try {
      await savePartApi(updated, true);
      showToast(
        `Repuesto "${part.name}" ${nextActive ? "activado y visible en tienda" : "deshabilitado y oculto en tienda"}.`,
        nextActive ? "success" : "info"
      );
    } catch (e: any) {
      // Revert if API failed
      setParts(parts.map((p) => (p.id === part.id ? part : p)));
      showToast(`Error al cambiar estado del repuesto: ${e?.message || e}`, "error");
    }
  };

  const handleDeletePart = (id: string) => {
    const part = parts.find((p) => p.id === id);
    if (!part) return;
    setDeleteModal({
      isOpen: true,
      title: "¿Eliminar repuesto?",
      description: "¿Estás seguro de que deseas eliminar este repuesto del catálogo?",
      itemName: part.name,
      itemSubtitle: `OEM: ${part.oemNumbers?.[0] || "N/A"} • SKU: ${part.sku || "N/A"}`,
      itemImage: part.images?.[0],
      warningText: "El repuesto se eliminará del catálogo general, listas de compatibilidad y despieces asociados.",
      onConfirm: async () => {
        setDeleteModal((prev) => (prev ? { ...prev, isLoading: true } : null));
        try {
          await deletePartApi(id);
          setParts((prev) => prev.filter((p) => p.id !== id));
          showToast(`Repuesto "${part.name}" eliminado del catálogo.`, "info");
        } catch (e: any) {
          console.error("API Error:", e);
          showToast(`Error al eliminar repuesto: ${e?.message || e}`, "error");
        } finally {
          setDeleteModal(null);
        }
      },
    });
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
    const newId = crypto.randomUUID();
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

  const handleDeleteSchematic = (id: string) => {
    const schematic = schematics.find((s) => s.id === id);
    if (!schematic) return;
    setDeleteModal({
      isOpen: true,
      title: "¿Eliminar despiece?",
      description: "¿Estás seguro de que deseas eliminar este diagrama de despiece?",
      itemName: schematic.title,
      itemSubtitle: `Sección: ${schematic.section || "General"} • ${schematic.hotspots?.length || 0} puntos hotspot`,
      itemImage: schematic.diagramImage,
      warningText: "Se desvincularán los repuestos y se eliminarán los puntos interactivos asociados a este despiece.",
      onConfirm: async () => {
        setDeleteModal((prev) => (prev ? { ...prev, isLoading: true } : null));
        try {
          const res = await deleteSchematicApi(id);
          if (res && res.success === false) {
            throw new Error(res.error || "Error al eliminar el despiece");
          }
          setSchematics((prev) => prev.filter((s) => s.id !== id));
          showToast(`Despiece "${schematic.title}" eliminado con éxito.`, "info");
        } catch (e: any) {
          console.error("API Error:", e);
          showToast(`Error al eliminar despiece: ${e?.message || e}`, "error");
        } finally {
          setDeleteModal(null);
        }
      },
    });
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

  const handleDeleteReturn = (id: string) => {
    setDeleteModal({
      isOpen: true,
      title: "¿Eliminar devolución?",
      description: `¿Estás seguro de que deseas eliminar el registro de devolución / garantía #${id}?`,
      itemName: `Registro #${id}`,
      warningText: "Esta acción no se puede deshacer y el historial de esta solicitud de garantía se borrará.",
      onConfirm: async () => {
        setDeleteModal((prev) => (prev ? { ...prev, isLoading: true } : null));
        try {
          const res = await deleteReturnApi(id);
          if (res.success) {
            setReturnsList((prev) => prev.filter((r) => r.id !== id));
            showToast(`Devolución ${id} eliminada.`);
          } else {
            showToast(`Error: ${res.error || "No se pudo eliminar"}`, "error");
          }
        } catch (e: any) {
          console.error("Error eliminando devolución:", e);
          showToast(`Error al eliminar: ${e?.message || e}`, "error");
        } finally {
          setDeleteModal(null);
        }
      },
    });
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
      <div id="admin-dashboard" className="min-h-screen bg-[#f7f9fb] text-[#191c1e] flex font-sans antialiased items-center justify-center px-4">
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
    <SiteSettingsProvider>
      <div id="admin-dashboard" className="min-h-screen bg-[#f7f9fb] text-[#191c1e] flex font-sans antialiased">
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
        currentUser={currentUser}
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
                    : activeTab === "kardex"
                      ? "Kardex & Control de Inventario"
                      : activeTab === "schematics"
                        ? "Despieces Explosión"
                        : activeTab === "orders"
                          ? "Gestión de Pedidos"
                          : activeTab === "returns"
                            ? "Devoluciones & RMA"
                            : activeTab === "users"
                              ? "Gestión de Usuarios"
                              : activeTab === "shipping"
                                ? "Métodos de Envío"
                                : activeTab === "payments"
                                  ? "Medios de Pago"
                                  : activeTab === "settings"
                                    ? "Configuración de Tienda"
                                    : activeTab === "coupons"
                                      ? "Cupones & Descuentos"
                                      : "Métricas & Informes"
          }
          subtitle={
            activeTab === "brands"
              ? "Administra las marcas de motocicletas y sus configuraciones en el catálogo"
              : activeTab === "models"
                ? "Administra la compatibilidad por modelo, años, versiones, despieces y especificaciones OEM"
                : activeTab === "categories"
                  ? "Administra la estructura jerárquica de categorías principales y subcategorías de repuestos"
                  : activeTab === "parts"
                    ? "Administra el catálogo oficial de repuestos OEM, precios, existencias y matriz de compatibilidad"
                    : activeTab === "kardex"
                      ? "Historial de movimientos, auditoría de entradas/salidas, valoración de existencias y costo promedio"
                      : activeTab === "schematics"
                        ? "Administra diagramas exploded-view y puntos hotspots interactivos vinculados a repuestos"
                        : activeTab === "orders"
                          ? "Administra el procesamiento de pedidos, guías de envío y estados de logística"
                          : activeTab === "returns"
                            ? "Administración de garantías, devoluciones de producto y reembolsos a clientes"
                            : activeTab === "users"
                              ? "Administra las cuentas de usuarios registrados, roles y permisos de acceso"
                              : activeTab === "shipping"
                                ? "Configuración de transportadoras, zonas de despacho, ciudades y tarifas"
                                : activeTab === "payments"
                                  ? "Configuración de pasarelas de pago, Wompi, transferencias y reservas temporales de stock"
                                  : activeTab === "settings"
                                    ? "Configuración general, SEO, branding, localización y políticas de la tienda"
                                    : activeTab === "coupons"
                                      ? "Administración de promociones, códigos de descuento y campañas comerciales"
                                      : "Estadísticas de ventas, pedidos, rotación de inventario y comportamiento de clientes"
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
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto w-full">
          {/* Toast Notification Banner */}
          {toast && (
            <div className="fixed bottom-24 lg:bottom-6 right-4 sm:right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
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
              isLoading={isLoadingData}
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
              isLoading={isLoadingData}
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
              isLoading={isLoadingData}
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
              categories={categories}
              searchQuery={searchQuery}
              isLoading={isLoadingData}
              onAddPart={() => {
                setPartToEdit(null);
                setIsPartDrawerOpen(true);
              }}
              onEditPart={(part) => {
                setPartToEdit(part);
                setIsPartDrawerOpen(true);
              }}
              onViewKardex={(part) => {
                setKardexFilterPartId(part.id);
                handleSetActiveTab("kardex");
              }}
              onDuplicatePart={handleDuplicatePart}
              onToggleAvailability={handleTogglePartAvailability}
              onToggleActive={handleTogglePartActive}
              onDeletePart={handleDeletePart}
            />
          )}

          {activeTab === "kardex" && (
            <KardexManager initialPartId={kardexFilterPartId} />
          )}

          {activeTab === "schematics" && (
            <SchematicsManager
              schematics={schematics}
              models={models}
              parts={parts}
              searchQuery={searchQuery}
              isLoading={isLoadingData}
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
              isLoading={isLoadingData}
              onEditOrder={(ord) => {
                setOrderToEdit(ord);
                setOrderModalMode('edit');
                setIsOrderModalOpen(true);
              }}
              onViewOrder={(ord) => {
                setOrderToEdit(ord);
                setOrderModalMode('view');
                setIsOrderModalOpen(true);
              }}
            />
          )}

          {activeTab === "returns" && (
            <ReturnsManager
              returnsList={returnsList}
              searchQuery={searchQuery}
              isLoading={isLoadingData}
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
                setOrderModalMode('view');
                setIsOrderModalOpen(true);
              }}
            />
          )}

          {activeTab === "users" && (
            <UsersManager
              users={users}
              roles={roles}
              searchQuery={searchQuery}
              isLoading={isLoadingData}
              canWrite={hasModulePermission(currentUser, 'users', 'write')}
              onAddUser={() => {
                setUserToEdit(null);
                setIsUserModalOpen(true);
              }}
              onEditUser={(usr) => {
                setUserToEdit(usr);
                setIsUserModalOpen(true);
              }}
              onDeleteUser={handleDeleteUser}
              onAddRole={() => {
                setRoleToEdit(null);
                setIsRoleModalOpen(true);
              }}
              onEditRole={(r) => {
                setRoleToEdit(r);
                setIsRoleModalOpen(true);
              }}
              onDeleteRole={handleDeleteRole}
            />
          )}

          {activeTab === "shipping" && <ShippingManager />}

          {activeTab === "payments" && <PaymentsManager />}

          {activeTab === "settings" && <SettingsManager onShowToast={showToast} />}

          {activeTab === "coupons" && <CouponsManager />}

          {/* Placeholder views for remaining modules */}
          {activeTab !== "brands" &&
            activeTab !== "models" &&
            activeTab !== "categories" &&
            activeTab !== "parts" &&
            activeTab !== "kardex" &&
            activeTab !== "schematics" &&
            activeTab !== "orders" &&
            activeTab !== "returns" &&
            activeTab !== "users" &&
            activeTab !== "shipping" &&
            activeTab !== "payments" &&
            activeTab !== "settings" &&
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
        categories={categories}
      />

      <SchematicDrawer
        isOpen={isSchematicDrawerOpen}
        onClose={() => setIsSchematicDrawerOpen(false)}
        onSave={handleSaveSchematic}
        schematicToEdit={schematicToEdit}
        models={models}
        parts={parts}
        categories={categories}
        onSavePart={handleSavePart}
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
        mode={orderModalMode}
        onSaveOrder={handleSaveOrder}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        userToEdit={userToEdit}
        onSaveUser={handleSaveUser}
        availableRoles={roles}
      />

      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        roleToEdit={roleToEdit}
        onSaveRole={handleSaveRole}
      />

      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        returnItem={returnToEdit}
        onSaveReturn={handleSaveReturn}
      />

      {/* Confirmation Delete Modal */}
      {deleteModal && (
        <ConfirmDeleteModal
          isOpen={deleteModal.isOpen}
          title={deleteModal.title}
          description={deleteModal.description}
          itemName={deleteModal.itemName}
          itemSubtitle={deleteModal.itemSubtitle}
          itemImage={deleteModal.itemImage}
          warningText={deleteModal.warningText}
          confirmText={deleteModal.confirmText}
          cancelText={deleteModal.cancelText}
          isLoading={deleteModal.isLoading}
          onConfirm={deleteModal.onConfirm}
          onClose={() => {
            if (!deleteModal.isLoading) setDeleteModal(null);
          }}
        />
      )}

      {/* Mobile Bottom Dock (admin) */}
      <AdminMobileDock
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        onOpenMenu={() => setMobileMenuOpen(true)}
      />

      {/* Mobile Menu Drawer (all modules) */}
      <AdminMobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
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
      </div>
    </SiteSettingsProvider>
  );
};
