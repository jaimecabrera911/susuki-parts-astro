import React, { useState, useEffect } from "react";
import { UserAvatar } from "./UserAvatar";
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Wrench,
  Package,
  Heart,
  Save,
  CheckCircle2,
  Calendar,
  Trash2,
  Plus,
  ChevronRight,
  FileText,
  Sparkles,
  Award,
  Lock,
  ArrowRight,
  Printer,
  LogOut,
  RotateCcw,
} from "lucide-react";
import { FaCartPlus } from "react-icons/fa6";
import type {
  UserProfile,
  ActiveMotorcycle,
  SuzukiPart,
  CartItem,
} from "../types";
import {
  getAvailabilityStatus,
  AVAILABILITY_META,
  getPrimaryOem,
} from "../types";
import { formatCurrency } from "../utils/formatCurrency";
import { OrdersTable } from "./OrdersTable";
import { ReturnsTable } from "./ReturnsTable";
import {
  shouldShowProductImages,
  getDefaultLocation,
} from "../utils/config";
import { ProductImageEmptyState } from "./ProductImageEmptyState";
import { LocationSelector } from "./LocationSelector";
import type { CityRecord } from "../types";
import { fetchCities, fetchReturns } from "../services/api";
import { parseReturnNotes } from "../utils/returnNotes";

interface UserProfilePageProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  savedGarages: ActiveMotorcycle[];
  activeMotorcycle: ActiveMotorcycle | null;
  onSelectActiveBike: (bike: ActiveMotorcycle) => void;
  onOpenGarageModal: () => void;
  onRemoveGarageBike: (modelId: string, year: number) => void;
  orders: any[];
  favoriteParts: SuzukiPart[];
  onToggleFavorite: (partId: string) => void;
  onAddToCart: (part: SuzukiPart) => void;
  onNavigateToCatalog: () => void;
  onNavigateToSchematics: () => void;
  initialTab?: "profile" | "garage" | "orders" | "returns" | "favorites";
  onLogout?: () => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  userProfile,
  onUpdateProfile,
  savedGarages,
  activeMotorcycle,
  onSelectActiveBike,
  onOpenGarageModal,
  onRemoveGarageBike,
  orders,
  favoriteParts,
  onToggleFavorite,
  onAddToCart,
  onNavigateToCatalog,
  onNavigateToSchematics,
  initialTab = "profile",
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<
    "profile" | "garage" | "orders" | "returns" | "favorites"
  >(initialTab);

  const [userReturns, setUserReturns] = useState<any[]>([]);

  useEffect(() => {
    if (userProfile?.email) {
      fetchReturns(userProfile.email)
        .then((res) => setUserReturns(res || []))
        .catch(() => setUserReturns([]));
    }
  }, [userProfile?.email]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === "#favoritos" || hash === "#favorites") {
        setActiveTab("favorites");
      } else if (hash === "#devoluciones" || hash === "#returns") {
        setActiveTab("returns");
      } else if (hash === "#pedidos" || hash === "#orders") {
        setActiveTab("orders");
      } else if (hash === "#garaje" || hash === "#garage") {
        setActiveTab("garage");
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const [citiesList, setCitiesList] = useState<CityRecord[]>([]);

  useEffect(() => {
    fetchCities()
      .then((data) => {
        if (data && data.length > 0)
          setCitiesList(data.filter((c: any) => c.active));
      })
      .catch((err) => console.error("Error cargando ciudades en perfil:", err));
  }, []);

  // Local form state for user profile editing
  const [formData, setFormData] = useState({
    fullName: userProfile.fullName,
    email: userProfile.email,
    phone: userProfile.phone,
    documentId: userProfile.documentId,
    country: userProfile.country || getDefaultLocation().country,
    department: userProfile.department || getDefaultLocation().department,
    city: userProfile.city,
    address: userProfile.address,
    postalCode: userProfile.postalCode,
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...userProfile,
      ...formData,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div id="user-profile-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 border border-slate-800">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#E60012]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative">
              <UserAvatar
                avatarUrl={userProfile.avatarUrl}
                fullName={userProfile.fullName}
                className="w-16 h-16 sm:w-20 sm:h-20 ring-4 ring-white/10"
                textClassName="text-2xl sm:text-3xl font-black"
              />
              <div
                className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-slate-900"
                title="Usuario Verificado"
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
                  {userProfile.fullName}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />{" "}
                  {userProfile.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />{" "}
                  {userProfile.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Miembro
                  desde {userProfile.createdAt}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-800">
            <div className="bg-slate-800/80 backdrop-blur-xs rounded-2xl p-3 border border-slate-700/60 flex-1 md:flex-initial text-center md:text-left min-w-[120px]">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                Garaje Activo
              </span>
              <span className="text-xs font-extrabold text-red-400 truncate block">
                {activeMotorcycle
                  ? `${activeMotorcycle.modelName} ('${activeMotorcycle.year.toString().slice(-2)})`
                  : "Ninguna"}
              </span>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-xs rounded-2xl p-3 border border-slate-700/60 flex-1 md:flex-initial text-center md:text-left min-w-[100px]">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                Pedidos
              </span>
              <span className="text-xs font-mono font-black text-emerald-400">
                {orders.length} Realizados
              </span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="bg-red-600/30 hover:bg-red-600 text-red-200 hover:text-white px-3.5 py-3 rounded-2xl border border-red-500/40 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shrink-0"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4 text-red-400 hover:text-white" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Navigation Sidebar & Content Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <div className="px-3 py-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">
            MI CUENTA SUZUKI
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-[#E60012] text-white shadow-md shadow-red-500/20"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="flex items-center gap-3">
              <User
                className={`w-4 h-4 ${activeTab === "profile" ? "text-white" : "text-slate-500"}`}
              />
              Perfil y Datos
            </span>
            <ChevronRight
              className={`w-4 h-4 ${activeTab === "profile" ? "text-white" : "text-slate-400"}`}
            />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("garage")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
              activeTab === "garage"
                ? "bg-[#E60012] text-white shadow-md shadow-red-500/20"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="flex items-center gap-3">
              <Wrench
                className={`w-4 h-4 ${activeTab === "garage" ? "text-white" : "text-amber-600"}`}
              />
              Mi Garaje ({savedGarages.length})
            </span>
            <ChevronRight
              className={`w-4 h-4 ${activeTab === "garage" ? "text-white" : "text-slate-400"}`}
            />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
              activeTab === "orders"
                ? "bg-[#E60012] text-white shadow-md shadow-red-500/20"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="flex items-center gap-3">
              <Package
                className={`w-4 h-4 ${activeTab === "orders" ? "text-white" : "text-blue-600"}`}
              />
              Mis Pedidos ({orders.length})
            </span>
            <ChevronRight
              className={`w-4 h-4 ${activeTab === "orders" ? "text-white" : "text-slate-400"}`}
            />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("returns")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
              activeTab === "returns"
                ? "bg-[#E60012] text-white shadow-md shadow-red-500/20"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="flex items-center gap-3">
              <RotateCcw
                className={`w-4 h-4 ${activeTab === "returns" ? "text-white" : "text-amber-600"}`}
              />
              Mis Devoluciones ({userReturns.length})
            </span>
            <ChevronRight
              className={`w-4 h-4 ${activeTab === "returns" ? "text-white" : "text-slate-400"}`}
            />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("favorites")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
              activeTab === "favorites"
                ? "bg-[#E60012] text-white shadow-md shadow-red-500/20"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="flex items-center gap-3">
              <Heart
                className={`w-4 h-4 ${activeTab === "favorites" ? "text-white" : "text-rose-500"}`}
              />
              Repuestos Guardados ({favoriteParts.length})
            </span>
            <ChevronRight
              className={`w-4 h-4 ${activeTab === "favorites" ? "text-white" : "text-slate-400"}`}
            />
          </button>

          <div className="pt-4 border-t border-slate-100 px-3 pb-2 space-y-2">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Datos Protegidos</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Tus datos de despacho están asegurados.
              </p>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2.5 px-3 text-left rounded-xl text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Content Panel */}
        <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          {/* TAB 1: PROFILE & CONTACT DATA */}
          {activeTab === "profile" && (
            <div>
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Información Personal & Dirección de Envío
                  </h2>
                  <p className="text-xs text-slate-500">
                    Mantén actualizados tus datos para el despacho automático de
                    repuestos Suzuki
                  </p>
                </div>
                {saveSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>¡Datos guardados con éxito!</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-xs font-bold uppercase text-slate-700 mb-1"
                    >
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-bold uppercase text-slate-700 mb-1"
                    >
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-xs font-bold uppercase text-slate-700 mb-1"
                    >
                      Teléfono / WhatsApp de Contacto
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="phone"
                        name="phone"
                        type="text"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="documentId"
                      className="block text-xs font-bold uppercase text-slate-700 mb-1"
                    >
                      Documento de Identidad (Cédula / DNI)
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="documentId"
                        name="documentId"
                        type="text"
                        value={formData.documentId}
                        onChange={handleInputChange}
                        placeholder="Ej. 1.098.472.910"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                      />
                    </div>
                  </div>

                  {/* Ubicación en Cascada: País, Departamento, Ciudad */}
                  <div className="sm:col-span-2">
                    <LocationSelector
                      country={formData.country}
                      department={formData.department}
                      city={formData.city}
                      citiesList={citiesList}
                      onChange={({ country, department, city }) => {
                        setFormData((prev) => ({
                          ...prev,
                          country,
                          department,
                          city,
                        }));
                      }}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="address"
                      className="block text-xs font-bold uppercase text-slate-700 mb-1"
                    >
                      Dirección Completa de Despacho / Taller
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="address"
                        name="address"
                        type="text"
                        required
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="postalCode"
                      className="block text-xs font-bold uppercase text-slate-700 mb-1"
                    >
                      Código Postal (Opcional)
                    </label>
                    <input
                      id="postalCode"
                      name="postalCode"
                      type="text"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="Ej. 110111"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/20 focus:outline-none focus:ring-2 focus:ring-[#E60012]"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: MI GARAJE SUZUKI */}
          {activeTab === "garage" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Mis Motocicletas Suzuki Guardadas
                  </h2>
                  <p className="text-xs text-slate-500">
                    Selecciona tu moto activa para filtrar automáticamente el
                    catálogo y diagramas despiece
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenGarageModal}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 text-red-400" />
                  <span>Agregar Moto al Garaje</span>
                </button>
              </div>

              {savedGarages.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <Wrench className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-800">
                    No tienes motocicletas registradas en tu Garaje
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
                    Agrega tu Suzuki para recibir validación de compatibilidad
                    OEM en tiempo real.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenGarageModal}
                    className="px-5 py-2.5 bg-[#E60012] text-white text-xs font-bold uppercase tracking-wider rounded-xl"
                  >
                    Registrar mi Suzuki ahora
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedGarages.map((bike, idx) => {
                    const isActive =
                      activeMotorcycle?.modelId === bike.modelId &&
                      activeMotorcycle?.year === bike.year;

                    return (
                      <div
                        key={idx}
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                          isActive
                            ? "bg-red-50/50 border-[#E60012] ring-2 ring-[#E60012]/20 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black tracking-widest text-[#E60012] uppercase bg-red-100 px-2.5 py-0.5 rounded-full">
                              {bike.brand}
                            </span>
                            {isActive ? (
                              <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                                Activa Actualmente
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  onRemoveGarageBike(bike.modelId, bike.year)
                                }
                                className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                                title="Eliminar del Garaje"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <h3 className="text-lg font-black text-slate-900">
                            {bike.modelName}
                          </h3>
                          <div className="text-xs font-semibold text-slate-600 mt-1">
                            Año:{" "}
                            <span className="text-slate-900 font-bold">
                              {bike.year}
                            </span>{" "}
                            | Versión:{" "}
                            <span className="text-slate-900 font-bold">
                              {bike.version}
                            </span>
                          </div>
                          {bike.vin && (
                            <div className="text-[11px] font-mono text-slate-500 mt-2 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                              VIN: {bike.vin}
                            </div>
                          )}
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-200/80 flex items-center justify-between">
                          {!isActive ? (
                            <button
                              type="button"
                              onClick={() => onSelectActiveBike(bike)}
                              className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                            >
                              Establecer como Moto Activa
                            </button>
                          ) : (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />{" "}
                                Filtros aplicados
                              </span>
                              <button
                                type="button"
                                onClick={onNavigateToCatalog}
                                className="text-xs font-extrabold text-[#E60012] hover:underline flex items-center gap-1"
                              >
                                Ver Repuestos{" "}
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MIS PEDIDOS */}
          {activeTab === "orders" && (
            <div>
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Histórico de Pedidos & Garantía OEM
                  </h2>
                  <p className="text-xs text-slate-500">
                    Facturación y certificados de compatibilidad emitidos para
                    tus vehículos
                  </p>
                </div>
              </div>

              <OrdersTable
                orders={orders}
                onNavigateToCatalog={onNavigateToCatalog}
              />
            </div>
          )}

          {/* TAB DEVOLUCIONES & GARANTÍAS */}
          {activeTab === "returns" && (
            <div>
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 font-display">
                    <RotateCcw className="w-5 h-5 text-amber-600" />
                    Mis Devoluciones & Garantías (RMA)
                  </h2>
                  <p className="text-xs text-slate-500 font-sans">
                    Consulta el estado en tiempo real, guías de envío y reembolsos de tus solicitudes de garantía
                  </p>
                </div>
              </div>

              <ReturnsTable returnsList={userReturns} orders={orders} />
            </div>
          )}

          {/* TAB 4: REPUESTOS GUARDADOS / FAVORITOS */}

          {activeTab === "favorites" && (
            <div>
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Repuestos Guardados & Deseos
                  </h2>
                  <p className="text-xs text-slate-500">
                    Piezas guardadas para comprar más adelante o consultar en
                    talleres
                  </p>
                </div>
              </div>

              {favoriteParts.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <Heart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-800">
                    No tienes repuestos guardados
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
                    Haz clic en el ícono de corazón en los productos del
                    catálogo para guardarlos aquí.
                  </p>
                  <button
                    type="button"
                    onClick={onNavigateToCatalog}
                    className="px-5 py-2.5 bg-[#E60012] text-white text-xs font-bold uppercase tracking-wider rounded-xl"
                  >
                    Ir al Catálogo Suzuki
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favoriteParts.map((part) => {
                    const primaryOem = getPrimaryOem(part);
                    const availabilityStatus = getAvailabilityStatus(part);
                    const availMeta = AVAILABILITY_META[availabilityStatus];

                    return (
                      <div
                        key={part.id}
                        className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="font-mono text-[11px] font-bold text-[#E60012] bg-red-50 px-2 py-0.5 rounded border border-red-100">
                              OEM: {primaryOem}
                            </span>
                            <button
                              type="button"
                              onClick={() => onToggleFavorite(part.id)}
                              className="text-rose-500 hover:text-slate-400 p-1 transition-colors"
                              title="Remover de Favoritos"
                            >
                              <Heart className="w-4 h-4 fill-rose-500" />
                            </button>
                          </div>

                          <div className="flex gap-3 my-2">
                            {shouldShowProductImages() ? (
                              <img
                                src={part.image}
                                alt={part.name}
                                className="w-16 h-16 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0"
                              />
                            ) : (
                              <ProductImageEmptyState className="w-16 h-16 shrink-0" />
                            )}
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 line-clamp-2">
                                {part.name}
                              </h4>
                              <div className="mt-1">
                                <span
                                  className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${availMeta.bgClass} ${availMeta.textClass} ${availMeta.borderClass}`}
                                >
                                  {availMeta.label}
                                </span>
                              </div>
                              <div className="font-mono font-black text-slate-900 text-sm mt-2">
                                {formatCurrency(part.price)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onAddToCart(part)}
                            className="flex-1 py-2 bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <FaCartPlus className="w-3.5 h-3.5" />
                            <span>Al Carrito</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
