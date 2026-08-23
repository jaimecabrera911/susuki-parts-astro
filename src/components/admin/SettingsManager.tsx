import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  Save,
  CheckCircle2,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  Image,
  RotateCcw,
  Percent,
  Store,
  Layers,
  AlertTriangle,
  UploadCloud,
  Link2,
  Plus,
  Trash2,
  Music2,
  MessageCircle,
  Share2,
  FileText,
  Sliders,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Clock,
  Hourglass,
  Timer,
  Zap,
  CreditCard,
  Building2,
  Smartphone,
  PackageCheck,
  AlertCircle,
  Truck,
  Globe,
  Package,
} from "lucide-react";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import type {
  SiteSettings,
  FooterConfig,
  FooterLink,
  CityRecord,
  SocialLinks,
  InventoryReservationSettings,
  StockReservation,
} from "../../types";
import {
  GET_SETTINGS,
  POST_SETTINGS,
  UPLOAD_IMAGE,
  fetchCities,
  fetchInventoryReservationSettings,
  saveInventoryReservationSettingsApi,
  fetchStockReservations,
  expireOverdueReservationsApi,
  extendStockReservationApi,
  releaseStockReservationApi,
} from "../../services/api";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatOrderDate } from "../../utils/formatDate";
import { LocationSelector } from "../LocationSelector";

type SettingsTab = "general" | "shipping" | "specs" | "taxes" | "reservations" | "returns" | "documents" | "footer";

const SUBTABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "shipping", label: "Envíos & Tiempos", icon: Truck },
  { id: "specs", label: "Especificaciones", icon: Sliders },
  { id: "taxes", label: "Impuestos (IVA)", icon: Percent },
  { id: "reservations", label: "Reservas de Stock", icon: Clock },
  { id: "returns", label: "Devoluciones", icon: RotateCcw },
  { id: "documents", label: "Documentos", icon: FileText },
  { id: "footer", label: "Footer", icon: Link2 },
];

const EMPTY_FOOTER: FooterConfig = {
  tagline: "",
  description: "",
  copyright: "",
  legalLinks: [],
};

const EMPTY_SETTINGS: SiteSettings = {
  id: "default",
  storeName: "",
  storeLogo: "",
  storeTagline: "",
  whatsappNumber: "",
  contactEmail: "",
  storeAddress: "",
  socialLinks: {},
  defaultCountry: "",
  defaultDepartment: "",
  defaultCity: "",
  showProductImages: false,
  detailPrimary: 'despiece',
  showPartSchematicOnCard: false,
  taxName: "",
  taxRate: 0,
  taxActive: false,
  returnMaxDays: 0,
  orderPrefix: "",
  returnPrefix: "",
  defaultSpecs: [],
  footerConfig: EMPTY_FOOTER,
  shippingWorkingDaysMode: 'mon_fri',
  shippingInStockMinDays: 2,
  shippingInStockMaxDays: 4,
  shippingInternationalMinDays: 10,
  shippingInternationalMaxDays: 20,
  shippingOnOrderMinDays: 15,
  shippingOnOrderMaxDays: 30,
  shippingMixedPolicy: "Envío consolidado: Tu pedido se despachará en un solo paquete una vez arriben todas las piezas importadas.",
};

interface SettingsManagerProps {
  onShowToast?: (message: string, type?: "success" | "info" | "error") => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ onShowToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<SettingsTab>("general");
  const [settings, setSettings] = useState<SiteSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [citiesList, setCitiesList] = useState<CityRecord[]>([]);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Stock Reservation Config & Monitor State
  const DEFAULT_RESERVATION_STATE: InventoryReservationSettings = {
    enabled: true,
    defaultTtlMinutes: 60,
    paymentMethodTtl: {
      transferencia: 720,
      nequi: 120,
      daviplata: 120,
      wompi: 30,
      tarjeta: 30,
      pse: 30,
      contraentrega: 1440
    },
    expiryAction: 'cancel'
  };

  const [reservationConfig, setReservationConfig] = useState<InventoryReservationSettings>(DEFAULT_RESERVATION_STATE);
  const [reservations, setReservations] = useState<StockReservation[]>([]);
  const [reservationStats, setReservationStats] = useState({ totalActive: 0, totalReservedUnits: 0, totalExpired: 0 });
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [isCleaningReservations, setIsCleaningReservations] = useState(false);

  // Extend Modal State
  const [extendingOrder, setExtendingOrder] = useState<StockReservation | null>(null);
  const [extendMinutes, setExtendMinutes] = useState<number>(60);
  const [extendReason, setExtendReason] = useState<string>('Solicitud de prórroga concedida');
  const [isExtending, setIsExtending] = useState<boolean>(false);

  const loadReservationData = async () => {
    try {
      setLoadingReservations(true);
      const [cfg, resData] = await Promise.all([
        fetchInventoryReservationSettings().catch(() => DEFAULT_RESERVATION_STATE),
        fetchStockReservations().catch(() => ({ reservations: [], stats: { totalActive: 0, totalReservedUnits: 0, totalExpired: 0 } }))
      ]);
      if (cfg) setReservationConfig(cfg);
      if (resData) {
        setReservations(resData.reservations || []);
        setReservationStats(resData.stats || { totalActive: 0, totalReservedUnits: 0, totalExpired: 0 });
      }
    } catch (err) {
      console.error('Error cargando datos de reservas:', err);
    } finally {
      setLoadingReservations(false);
    }
  };

  useEffect(() => {
    loadReservationData();
  }, []);

  // Live timer tick for active reservations
  useEffect(() => {
    if (activeSubTab !== 'reservations') return;
    const interval = setInterval(() => {
      setReservations(prev =>
        prev.map(r => {
          if (r.status !== 'active') return r;
          const expTime = new Date(r.expiresAt).getTime();
          const remaining = Math.max(0, Math.floor((expTime - Date.now()) / 1000));
          return {
            ...r,
            remainingSeconds: remaining,
            isExpired: remaining <= 0,
            status: remaining <= 0 ? 'expired' : r.status
          };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSubTab]);

  const handleCleanOverdueReservations = async () => {
    try {
      setIsCleaningReservations(true);
      const result = await expireOverdueReservationsApi();
      if (onShowToast) {
        onShowToast(result.message || 'Reservas vencidas procesadas correctamente.', 'success');
      }
      await loadReservationData();
    } catch (err: any) {
      if (onShowToast) {
        onShowToast(err.message || 'Error liberando reservas vencidas', 'error');
      }
    } finally {
      setIsCleaningReservations(false);
    }
  };

  const handleReleaseSingleReservation = async (res: StockReservation) => {
    if (!confirm(`¿Estás seguro de liberar la reserva del pedido ${res.orderDocumentNumber}? El stock retenido (${res.quantity} unid.) volverá a estar disponible de inmediato.`)) {
      return;
    }
    try {
      await releaseStockReservationApi({
        orderId: res.orderId,
        reason: 'Liberación manual por el administrador desde el panel de reservas'
      });
      if (onShowToast) {
        onShowToast(`Reserva de ${res.orderDocumentNumber} liberada con éxito.`, 'success');
      }
      await loadReservationData();
    } catch (err: any) {
      if (onShowToast) {
        onShowToast(err.message || 'Error liberando reserva', 'error');
      }
    }
  };

  const handleConfirmExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingOrder) return;
    try {
      setIsExtending(true);
      const result = await extendStockReservationApi({
        orderId: extendingOrder.orderId,
        additionalMinutes: extendMinutes,
        reason: extendReason
      });
      if (onShowToast) {
        onShowToast(result.message || 'Tiempo de reserva extendido exitosamente.', 'success');
      }
      setExtendingOrder(null);
      await loadReservationData();
    } catch (err: any) {
      if (onShowToast) {
        onShowToast(err.message || 'Error extendiendo tiempo de reserva', 'error');
      }
    } finally {
      setIsExtending(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    GET_SETTINGS()
      .then((data) => {
        if (!cancelled && data) setSettings({ ...EMPTY_SETTINGS, ...data });
      })
      .catch((err) => {
        if (!cancelled) setErrorMsg("No se pudo cargar la configuración.");
        console.error("Error cargando configuración:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchCities()
      .then((rows) => {
        if (!cancelled) setCitiesList(rows || []);
      })
      .catch(() => {
        if (!cancelled) setCitiesList([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    setErrorMsg("");
    try {
      // Save reservation settings if on reservations tab or always sync
      if (activeSubTab === 'reservations') {
        await saveInventoryReservationSettingsApi(reservationConfig);
        setSavedSuccess(true);
        if (onShowToast) {
          onShowToast("Configuración de reservas de stock guardada exitosamente.", "success");
        }
        setTimeout(() => setSavedSuccess(false), 3000);
        return;
      }

      let currentLogo = settings.storeLogo;
      if (pendingLogoFile) {
        setUploadingLogo(true);
        try {
          const result = await UPLOAD_IMAGE(pendingLogoFile, "store");
          currentLogo = result.url;
          set("storeLogo", result.url);
          setPendingLogoFile(null);
          setLogoPreviewUrl(null);
        } catch (uploadErr: any) {
          console.warn("No se pudo subir la imagen a S3, usando fallback:", uploadErr?.message);
        }
      }
      const finalSettings = { ...settings, storeLogo: currentLogo };
      await POST_SETTINGS(finalSettings);
      setLogoPreviewUrl(null);
      setSavedSuccess(true);
      if (onShowToast) {
        onShowToast("Configuración guardada y actualizada con éxito.", "success");
      }
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      const msg = err?.message || "No se pudo guardar la configuración.";
      setErrorMsg(msg);
      if (onShowToast) {
        onShowToast(`No se pudo guardar la configuración: ${msg}`, "error");
      }
    } finally {
      setUploadingLogo(false);
      setIsSaving(false);
    }
  };

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const setSocial = (key: keyof SocialLinks, value: string) =>
    setSettings((prev) => ({
      ...prev,
      socialLinks: {
        ...(prev.socialLinks || {}),
        [key]: value,
      },
    }));

  const setFooter = <K extends keyof FooterConfig>(
    key: K,
    value: FooterConfig[K],
  ) =>
    setSettings((prev) => ({
      ...prev,
      footerConfig: {
        ...(prev.footerConfig || EMPTY_FOOTER),
        [key]: value,
      },
    }));

  const setLegalLink = (index: number, key: keyof FooterLink, value: string) =>
    setFooter("legalLinks", [
      ...(settings.footerConfig?.legalLinks || []).map((link, i) =>
        i === index ? { ...link, [key]: value } : link,
      ),
    ]);

  const addLegalLink = () =>
    setFooter("legalLinks", [
      ...(settings.footerConfig?.legalLinks || []),
      { label: "", href: "" },
    ]);

  const removeLegalLink = (index: number) =>
    setFooter(
      "legalLinks",
      (settings.footerConfig?.legalLinks || []).filter((_, i) => i !== index),
    );

  // Default Technical Specifications state & handlers
  const [newSpecLabel, setNewSpecLabel] = useState("");
  const [newSpecDefaultValue, setNewSpecDefaultValue] = useState("");
  const [draggedSpecIndex, setDraggedSpecIndex] = useState<number | null>(null);

  const defaultSpecs = settings.defaultSpecs || [];

  const handleAddDefaultSpec = (labelToAdd?: string, valueToAdd?: string) => {
    const label = (labelToAdd ?? newSpecLabel).trim();
    const defaultValue = (valueToAdd ?? newSpecDefaultValue).trim();
    if (!label) return;

    const exists = defaultSpecs.some(
      (s) => s.label.toLowerCase() === label.toLowerCase()
    );
    if (exists) {
      if (onShowToast) onShowToast(`La especificación "${label}" ya existe en la lista.`, "error");
      return;
    }

    const updated = [...defaultSpecs, { label, defaultValue }];
    set("defaultSpecs", updated);
    if (!labelToAdd) {
      setNewSpecLabel("");
      setNewSpecDefaultValue("");
    }
  };

  const handleRemoveDefaultSpec = (index: number) => {
    const updated = defaultSpecs.filter((_, idx) => idx !== index);
    set("defaultSpecs", updated);
  };

  const handleUpdateDefaultSpec = (index: number, field: "label" | "defaultValue", value: string) => {
    const updated = [...defaultSpecs];
    updated[index] = { ...updated[index], [field]: value };
    set("defaultSpecs", updated);
  };

  const handleMoveDefaultSpec = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= defaultSpecs.length || fromIndex === toIndex) return;
    const updated = [...defaultSpecs];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    set("defaultSpecs", updated);
  };

  const handleSpecDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSpecIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleSpecDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleSpecDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedSpecIndex === null || draggedSpecIndex === targetIndex) return;
    handleMoveDefaultSpec(draggedSpecIndex, targetIndex);
    setDraggedSpecIndex(null);
  };

  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMsg(
        "Selecciona un archivo de imagen válido (PNG, JPG, WEBP, SVG).",
      );
      return;
    }
    setPendingLogoFile(file);
    setErrorMsg("");
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setLogoPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    if (logoFileInputRef.current) logoFileInputRef.current.value = "";
  };

  if (loading) {
    return (
      <div
        id="settings-manager"
        className="flex items-center justify-center py-20"
      >
        <RefreshCw className="w-6 h-6 text-[#E60012] animate-spin" />
      </div>
    );
  }

  return (
    <div id="settings-manager" className="space-y-6 w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E60012] to-red-700 text-white flex items-center justify-center font-black shadow-md shadow-red-500/20">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 font-display">
              Configuración de la Tienda
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Datos generales, impuestos, devoluciones y footer de la tienda.
            </p>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SUBTABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all border cursor-pointer ${
                isActive
                  ? "bg-[#E60012] text-white border-[#E60012] shadow-sm shadow-red-500/20"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6"
      >
        {savedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Configuración guardada y actualizada exitosamente.</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {activeSubTab === "general" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-slate-400" />
                  Nombre de la Tienda
                </label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => set("storeName", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012] text-sm font-sans text-slate-900"
                  placeholder="Nombre de la tienda"
                />
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  Nombre comercial usado en encabezados y branding de la tienda.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-slate-400" />
                  Subtítulo (Tagline)
                </label>
                <input
                  type="text"
                  value={settings.storeTagline}
                  onChange={(e) => set("storeTagline", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012] text-sm font-sans text-slate-900"
                  placeholder="Subtítulo corto de la tienda"
                />
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  Texto corto bajo el nombre en el encabezado y el footer.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Correo de Contacto
                </label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => set("contactEmail", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012] text-sm font-sans text-slate-900"
                  placeholder="contacto@suzukiparts.com.co"
                />
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  Canal de soporte y notificaciones a clientes.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Número de WhatsApp
                </label>
                <input
                  type="text"
                  value={settings.whatsappNumber}
                  onChange={(e) => set("whatsappNumber", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012] text-sm font-mono font-bold text-slate-900"
                  placeholder="573001234567"
                />
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  Con código de país, sin espacios ni &quot;+&quot;. Se usa en
                  los botones de consulta.
                </p>
              </div>
            </div>

            <div className="sm:col-span-2 p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Image className="w-4 h-4 text-[#E60012]" />
                Logo de la Tienda
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 shrink-0 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                  {(logoPreviewUrl || settings.storeLogo.trim()) ? (
                    <img
                      src={logoPreviewUrl || settings.storeLogo}
                      alt="Logo de la tienda"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="w-7 h-7 text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={logoFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-60"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Seleccionar Logo</span>
                    </button>
                    {pendingLogoFile && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                        Pendiente por guardar
                      </span>
                    )}
                    {(logoPreviewUrl || settings.storeLogo.trim()) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPendingLogoFile(null);
                          setLogoPreviewUrl(null);
                          set("storeLogo", "");
                        }}
                        className="px-3 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-sans">
                    Selecciona una imagen desde tu equipo para ver la vista previa. La imagen se subirá al almacenamiento únicamente cuando hagas clic en &quot;Guardar Configuración&quot;. Si no hay logo se usa el logo por defecto.
                  </p>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Dirección de la Tienda
              </label>
              <input
                type="text"
                value={settings.storeAddress}
                onChange={(e) => set("storeAddress", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012] text-sm font-sans text-slate-900"
                placeholder="Av. Las Américas # 50-15, Bogotá"
              />
              <p className="text-[11px] text-slate-500 mt-1 font-sans">
                Se muestra en el footer y en la página de contacto.
              </p>
            </div>

            <div className="sm:col-span-2 p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
              <span className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-[#E60012]" />
                Redes Sociales
              </span>
              <p className="text-[11px] text-slate-500 font-sans">
                URLs opcionales. Las redes sin URL no se muestran en el footer ni
                en la página de contacto.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-mono">
                    <FaFacebookF className="w-3.5 h-3.5 text-blue-600" />
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={settings.socialLinks?.facebook || ""}
                    onChange={(e) => setSocial("facebook", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900"
                    placeholder="https://facebook.com/tutienda"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-mono">
                    <FaInstagram className="w-3.5 h-3.5 text-pink-600" />
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={settings.socialLinks?.instagram || ""}
                    onChange={(e) => setSocial("instagram", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900"
                    placeholder="https://instagram.com/tutienda"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-mono">
                    <Music2 className="w-3.5 h-3.5 text-slate-900" />
                    TikTok
                  </label>
                  <input
                    type="url"
                    value={settings.socialLinks?.tiktok || ""}
                    onChange={(e) => setSocial("tiktok", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900"
                    placeholder="https://tiktok.com/@tutienda"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-mono">
                    <FaYoutube className="w-3.5 h-3.5 text-red-600" />
                    YouTube
                  </label>
                  <input
                    type="url"
                    value={settings.socialLinks?.youtube || ""}
                    onChange={(e) => setSocial("youtube", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900"
                    placeholder="https://youtube.com/@tutienda"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-mono">
                    <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                    WhatsApp
                  </label>
                  <input
                    type="url"
                    value={settings.socialLinks?.whatsapp || ""}
                    onChange={(e) => setSocial("whatsapp", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900"
                    placeholder="https://wa.me/573001234567"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <span className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#E60012]" />
                Ubicación por Defecto
              </span>
              <LocationSelector
                country={settings.defaultCountry}
                department={settings.defaultDepartment}
                city={settings.defaultCity}
                citiesList={citiesList}
                onChange={(loc) => {
                  set("defaultCountry", loc.country);
                  set("defaultDepartment", loc.department);
                  set("defaultCity", loc.city);
                }}
                required={false}
              />
              <p className="text-[11px] text-slate-500 font-sans">
                País, departamento y ciudad precargados en pedidos y perfiles de
                usuario. Se eligen desde las ciudades registradas en la BD.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Mostrar Imágenes de Producto */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className="text-xs font-extrabold text-slate-900 font-display flex items-center gap-1.5">
                      <Image className="w-4 h-4 text-[#E60012]" />
                      Mostrar Imágenes de Producto
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={settings.showProductImages}
                        onChange={(e) => set("showProductImages", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E60012]"></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                    Si está desactivado, las imágenes de producto se ocultan en catálogo, carrito y checkout.
                  </p>
                </div>
              </div>

              {/* Elemento Principal en Detalle */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3">
                <div>
                  <label
                    htmlFor="detail-primary"
                    className="text-xs font-extrabold text-slate-900 block font-display flex items-center gap-1.5 mb-1"
                  >
                    <Layers className="w-4 h-4 text-[#E60012]" />
                    Elemento Principal en Detalle
                  </label>
                  <p className="text-[11px] text-slate-500 font-sans leading-relaxed mb-3">
                    Prioridad en ficha de producto: diagrama técnico o fotos del repuesto.
                  </p>
                  <select
                    id="detail-primary"
                    value={settings.detailPrimary || "despiece"}
                    onChange={(e) =>
                      set(
                        "detailPrimary",
                        e.target.value === "images" ? "images" : "despiece",
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012] text-xs font-semibold font-sans text-slate-900 bg-white"
                  >
                    <option value="despiece">Despiece técnico</option>
                    <option value="images">Imágenes del producto</option>
                  </select>
                </div>
              </div>

              {/* Mostrar Despiece con Hotspot en Card de Producto */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className="text-xs font-extrabold text-slate-900 font-display flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#E60012]" />
                      Despiece con Hotspot en Card
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={settings.showPartSchematicOnCard || false}
                        onChange={(e) => set("showPartSchematicOnCard", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E60012]"></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                    Si está activado, la tarjeta del producto en el catálogo muestra el despiece con el hotspot (punto técnico) de la pieza destacada.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "shipping" && (() => {
          // Compute live delivery previews
          const mode = (settings.shippingWorkingDaysMode as any) || 'mon_fri';
          const modeLabel = mode === 'mon_fri' ? 'días hábiles' : mode === 'mon_sat' ? 'días (Lun-Sáb)' : 'días calendario';

          function addWD(days: number): Date {
            const d = new Date(); d.setHours(0,0,0,0);
            let n = 0;
            while (n < days) {
              d.setDate(d.getDate() + 1);
              const dow = d.getDay();
              if (mode === 'mon_fri' && (dow === 0 || dow === 6)) continue;
              if (mode === 'mon_sat' && dow === 0) continue;
              n++;
            }
            return d;
          }
          function fmtDate(d: Date) {
            return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
          }

          const inStockMin = settings.shippingInStockMinDays ?? 2;
          const inStockMax = settings.shippingInStockMaxDays ?? 4;
          const intlMin = settings.shippingInternationalMinDays ?? 10;
          const intlMax = settings.shippingInternationalMaxDays ?? 20;
          const orderMin = settings.shippingOnOrderMinDays ?? 15;
          const orderMax = settings.shippingOnOrderMaxDays ?? 30;

          const inStockLabel = `${inStockMin}-${inStockMax} ${modeLabel}`;
          const intlLabel = `${intlMin}-${intlMax} ${modeLabel}`;
          const orderLabel = `${orderMin}-${orderMax} ${modeLabel}`;

          const inStockPreview = `${fmtDate(addWD(inStockMin))} – ${fmtDate(addWD(inStockMax))}`;
          const intlPreview = `${fmtDate(addWD(intlMin))} – ${fmtDate(addWD(intlMax))}`;
          const orderPreview = `${fmtDate(addWD(orderMin))} – ${fmtDate(addWD(orderMax))}`;

          return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 font-display flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#E60012]" />
                  Tiempos de Entrega &amp; Políticas de Despacho
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Define los rangos de días por tipo de disponibilidad. El sistema calculará y mostrará las fechas exactas al cliente.
                </p>
              </div>
            </div>

            {/* Modo de días laborables */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-900 font-display flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#E60012]" />
                Modo de Cálculo de Días Laborables
              </span>
              <p className="text-xs text-slate-500 font-sans">
                Define qué días se cuentan para avanzar en el conteo de entrega.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { value: 'mon_fri', label: 'Lunes a Viernes', sub: 'Días hábiles estándar' },
                  { value: 'mon_sat', label: 'Lunes a Sábado', sub: 'Comercio / envíos 6 días' },
                  { value: 'all_days', label: 'Domingo a Domingo', sub: 'Días calendario continuos' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('shippingWorkingDaysMode', opt.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      mode === opt.value
                        ? 'border-[#E60012] bg-red-50'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <p className={`text-xs font-bold font-mono ${ mode === opt.value ? 'text-[#E60012]' : 'text-slate-800'}`}>{opt.label}</p>
                    <p className="text-[10px] text-slate-500 font-sans mt-0.5">{opt.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de 3 tarjetas de Disponibilidad */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* 1. En Stock / Nacional */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-emerald-600" />
                      En Stock (Nacional)
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                      {inStockLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 font-mono">Mínimo (días)</label>
                      <input
                        type="number" min={1} max={365}
                        value={inStockMin}
                        onChange={(e) => set('shippingInStockMinDays', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 font-mono">Máximo (días)</label>
                      <input
                        type="number" min={1} max={365}
                        value={inStockMax}
                        onChange={(e) => set('shippingInStockMaxDays', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012]"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-mono font-bold mt-2 bg-emerald-50 px-2 py-1 rounded-lg">
                    📅 Hoy llegaría: {inStockPreview}
                  </p>
                  <p className="text-[11px] text-slate-500 font-sans mt-1 leading-relaxed">
                    Aplica a repuestos con inventario disponible en bodega nacional.
                  </p>
                </div>
              </div>

              {/* 2. Envío Internacional */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-blue-600" />
                      Internacional
                    </span>
                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                      {intlLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 font-mono">Mínimo (días)</label>
                      <input
                        type="number" min={1} max={365}
                        value={intlMin}
                        onChange={(e) => set('shippingInternationalMinDays', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 font-mono">Máximo (días)</label>
                      <input
                        type="number" min={1} max={365}
                        value={intlMax}
                        onChange={(e) => set('shippingInternationalMaxDays', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012]"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-blue-700 font-mono font-bold mt-2 bg-blue-50 px-2 py-1 rounded-lg">
                    📅 Hoy llegaría: {intlPreview}
                  </p>
                  <p className="text-[11px] text-slate-500 font-sans mt-1 leading-relaxed">
                    Piezas originales importadas desde bodegas autorizadas Suzuki.
                  </p>
                </div>
              </div>

              {/* 3. Bajo Pedido */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Bajo Pedido
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                      {orderLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 font-mono">Mínimo (días)</label>
                      <input
                        type="number" min={1} max={365}
                        value={orderMin}
                        onChange={(e) => set('shippingOnOrderMinDays', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 font-mono">Máximo (días)</label>
                      <input
                        type="number" min={1} max={365}
                        value={orderMax}
                        onChange={(e) => set('shippingOnOrderMaxDays', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012]"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-700 font-mono font-bold mt-2 bg-amber-50 px-2 py-1 rounded-lg">
                    📅 Hoy llegaría: {orderPreview}
                  </p>
                  <p className="text-[11px] text-slate-500 font-sans mt-1 leading-relaxed">
                    Piezas especiales de baja rotación, directamente desde fábrica.
                  </p>
                </div>
              </div>
            </div>

            {/* Política de Envíos Mixtos */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 font-display flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#E60012]" />
                  Aviso para Pedidos Mixtos (Local + Internacional / Bajo Pedido)
                </span>
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  Envío Consolidado
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans">
                Este mensaje aparece en el carrito y checkout cuando hay productos locales mezclados con internacionales o bajo pedido.
              </p>
              <textarea
                rows={3}
                value={settings.shippingMixedPolicy || ""}
                onChange={(e) => set("shippingMixedPolicy", e.target.value)}
                placeholder="Ej. Envío consolidado: Tu pedido se despachará en un solo paquete una vez arriben todas las piezas importadas."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012] text-xs font-sans text-slate-900 resize-none"
              />
            </div>

            {/* Previsualización en Vivo */}
            <div className="p-5 bg-white border border-emerald-200 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 font-mono flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Previsualización (Cómo lo ve el Cliente)
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  Simulación en vivo
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block font-mono">En Stock:</span>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-mono font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Llega entre el {inStockPreview}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">{inStockLabel}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block font-mono">Internacional:</span>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 border border-blue-300 text-xs font-mono font-bold">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Llega entre el {intlPreview}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">{intlLabel}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block font-mono">Bajo Pedido:</span>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 text-xs font-mono font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Llega entre el {orderPreview}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">{orderLabel}</p>
                </div>
              </div>

              {/* Banner Mixto */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                <Truck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[11px] font-extrabold text-blue-800 font-mono">Aviso en Carrito / Checkout (Pedido Mixto):</span>
                  <p className="text-xs text-slate-700 font-sans leading-relaxed">
                    {settings.shippingMixedPolicy || "Envío consolidado: Tu pedido se despachará en un solo paquete una vez arriben todas las piezas importadas."}
                  </p>
                  <span className="inline-block text-[10px] font-mono text-emerald-700 font-bold mt-1">
                    ⏱️ Estimado total: {orderPreview} ({orderLabel})
                  </span>
                </div>
              </div>
            </div>
          </div>
          );
        })()}


        {activeSubTab === "specs" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 font-display flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#E60012]" />
                  Especificaciones Técnicas por Defecto
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Define las especificaciones que se precargarán automáticamente al crear repuestos. Puedes reordenarlas arrastrándolas o usando las flechas.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-xl border border-slate-200 shrink-0 self-start sm:self-auto">
                {defaultSpecs.length} {defaultSpecs.length === 1 ? "plantilla" : "plantillas"}
              </span>
            </div>

            {/* Presets rápidos */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Plantillas Sugeridas Rápidas:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Origen", defaultValue: "Japón (OEM)" },
                  { label: "Garantía", defaultValue: "6 Meses" },
                  { label: "Material", defaultValue: "" },
                  { label: "Posición", defaultValue: "" },
                  { label: "Diámetro", defaultValue: "" },
                  { label: "Peso", defaultValue: "" },
                  { label: "Tipo de Repuesto", defaultValue: "Original Suzuki" },
                  { label: "Acabado / Color", defaultValue: "" },
                ].map((preset) => {
                  const alreadyAdded = defaultSpecs.some(
                    (s) => s.label.toLowerCase() === preset.label.toLowerCase()
                  );
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => handleAddDefaultSpec(preset.label, preset.defaultValue)}
                      className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                        alreadyAdded
                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
                          : "bg-white text-slate-700 border-slate-300 hover:border-red-500 hover:text-[#E60012] shadow-2xs"
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{preset.label}</span>
                      {alreadyAdded && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Formulario para agregar nueva especificación */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
              <span className="block text-xs font-bold text-slate-800 font-sans uppercase tracking-wider">
                Crear Nueva Especificación por Defecto
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_2fr_auto] gap-3 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 font-mono">
                    Nombre / Etiqueta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSpecLabel}
                    onChange={(e) => setNewSpecLabel(e.target.value)}
                    placeholder="Ej. Material, Diámetro, Rosca..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#E60012] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 font-mono">
                    Valor Sugerido Opcional (se puede cambiar por repuesto)
                  </label>
                  <input
                    type="text"
                    value={newSpecDefaultValue}
                    onChange={(e) => setNewSpecDefaultValue(e.target.value)}
                    placeholder="Ej. Acero cromado (opcional)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#E60012] focus:bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddDefaultSpec()}
                  disabled={!newSpecLabel.trim()}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs uppercase tracking-wider font-sans"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar</span>
                </button>
              </div>
            </div>

            {/* Lista reordenable de especificaciones por defecto */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-700 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#E60012]" />
                  Orden de Plantillas ({defaultSpecs.length})
                </span>
                <span className="text-[11px] text-slate-400 font-sans">
                  Arrastra o usa las flechas para ordenar
                </span>
              </div>

              {defaultSpecs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                  <Sliders className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No hay especificaciones por defecto configuradas.</p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    Agrega etiquetas arriba o haz clic en las plantillas sugeridas para que los nuevos repuestos se creen automáticamente con estas propiedades.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {defaultSpecs.map((spec, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => handleSpecDragStart(e, index)}
                      onDragOver={handleSpecDragOver}
                      onDrop={(e) => handleSpecDrop(e, index)}
                      className={`flex items-center gap-2 p-3 bg-white border rounded-2xl shadow-2xs transition-all ${
                        draggedSpecIndex === index
                          ? "opacity-50 border-dashed border-[#E60012] bg-red-50/30 scale-[0.99]"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {/* Drag Grip Handle */}
                      <div
                        className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Arrastrar para reordenar"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Number Badge */}
                      <span className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-600 flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      {/* Spec Label Input */}
                      <div className="w-1/3 min-w-[130px]">
                        <input
                          type="text"
                          value={spec.label}
                          onChange={(e) => handleUpdateDefaultSpec(index, "label", e.target.value)}
                          placeholder="Nombre (ej. Origen)"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E60012] focus:bg-white"
                        />
                      </div>

                      {/* Spec Default Value Input */}
                      <div className="flex-1 min-w-[150px]">
                        <input
                          type="text"
                          value={spec.defaultValue || ""}
                          onChange={(e) => handleUpdateDefaultSpec(index, "defaultValue", e.target.value)}
                          placeholder="Valor sugerido (opcional)"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans text-slate-800 focus:outline-none focus:border-[#E60012] focus:bg-white"
                        />
                      </div>

                      {/* Move Up / Down Buttons */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveDefaultSpec(index, index - 1)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="Mover arriba"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === defaultSpecs.length - 1}
                          onClick={() => handleMoveDefaultSpec(index, index + 1)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="Mover abajo"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveDefaultSpec(index)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                        title="Eliminar plantilla"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === "taxes" && (
          <div className="space-y-5">
            <p className="text-xs text-slate-600 font-sans">
              Tasa de impuesto aplicada a los repuestos y la facturación del
              checkout.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                  Nombre del Impuesto
                </label>
                <input
                  type="text"
                  value={settings.taxName}
                  onChange={(e) => set("taxName", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012] text-sm font-sans text-slate-900"
                  placeholder="Nombre del impuesto"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                  Porcentaje (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={settings.taxRate}
                  onChange={(e) =>
                    set("taxRate", parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012] text-sm font-mono font-bold text-slate-900"
                  placeholder="19"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-slate-900 block font-display">
                  Aplicar Impuesto en el Checkout
                </span>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Si está desactivado, el monto de impuesto será $0.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.taxActive}
                  onChange={(e) => set("taxActive", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E60012]"></div>
              </label>
            </div>
          </div>
        )}

        {activeSubTab === "reservations" && (
          <div className="space-y-8">
            {/* Header / Intro */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div>
                <h3 className="text-sm font-black text-slate-900 font-display flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#E60012]" />
                  Retención Temporal de Stock & Expiración (TTL)
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Aparta el inventario al crear pedidos pendientes y libera automáticamente el stock retenido si el pago no se completa.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={reservationConfig.enabled}
                  onChange={(e) =>
                    setReservationConfig((prev) => ({
                      ...prev,
                      enabled: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E60012]"></div>
                <span className="ml-3 text-xs font-extrabold text-slate-900 uppercase font-mono">
                  {reservationConfig.enabled ? "Activado" : "Desactivado"}
                </span>
              </label>
            </div>

            {/* TTL Configurations */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                <Timer className="w-4 h-4 text-slate-500" />
                Tiempos de Retención (TTL) por Método de Pago
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Transferencia Bancaria */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs font-display">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Transferencia / Consignación</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Bancolombia, Davivienda, etc.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min="5"
                      value={reservationConfig.paymentMethodTtl.transferencia ?? 720}
                      onChange={(e) =>
                        setReservationConfig((prev) => ({
                          ...prev,
                          paymentMethodTtl: {
                            ...prev.paymentMethodTtl,
                            transferencia: parseInt(e.target.value, 10) || 60,
                          },
                        }))
                      }
                      className="w-20 px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900"
                    />
                    <span className="text-xs font-bold text-slate-600 font-mono">
                      minutos (
                      {Math.round(
                        (reservationConfig.paymentMethodTtl.transferencia ?? 720) / 60
                      )}
                      h)
                    </span>
                  </div>
                </div>

                {/* Billeteras Digitales */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs font-display">
                    <Smartphone className="w-4 h-4 text-purple-600" />
                    <span>Nequi / Daviplata</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Pagos móviles inmediatos
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min="5"
                      value={reservationConfig.paymentMethodTtl.nequi ?? 120}
                      onChange={(e) =>
                        setReservationConfig((prev) => ({
                          ...prev,
                          paymentMethodTtl: {
                            ...prev.paymentMethodTtl,
                            nequi: parseInt(e.target.value, 10) || 60,
                            daviplata: parseInt(e.target.value, 10) || 60,
                          },
                        }))
                      }
                      className="w-20 px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900"
                    />
                    <span className="text-xs font-bold text-slate-600 font-mono">
                      minutos (
                      {Math.round(
                        (reservationConfig.paymentMethodTtl.nequi ?? 120) / 60
                      )}
                      h)
                    </span>
                  </div>
                </div>

                {/* Pasarelas Online */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs font-display">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Tarjetas / PSE / Wompi</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Procesamiento en línea instantáneo
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min="5"
                      value={reservationConfig.paymentMethodTtl.wompi ?? 30}
                      onChange={(e) =>
                        setReservationConfig((prev) => ({
                          ...prev,
                          paymentMethodTtl: {
                            ...prev.paymentMethodTtl,
                            wompi: parseInt(e.target.value, 10) || 30,
                            tarjeta: parseInt(e.target.value, 10) || 30,
                            pse: parseInt(e.target.value, 10) || 30,
                          },
                        }))
                      }
                      className="w-20 px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900"
                    />
                    <span className="text-xs font-bold text-slate-600 font-mono">
                      minutos
                    </span>
                  </div>
                </div>

                {/* Contraentrega */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs font-display">
                    <PackageCheck className="w-4 h-4 text-amber-600" />
                    <span>Pago Contraentrega</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Confirmación telefónica previa
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min="5"
                      value={reservationConfig.paymentMethodTtl.contraentrega ?? 1440}
                      onChange={(e) =>
                        setReservationConfig((prev) => ({
                          ...prev,
                          paymentMethodTtl: {
                            ...prev.paymentMethodTtl,
                            contraentrega: parseInt(e.target.value, 10) || 1440,
                          },
                        }))
                      }
                      className="w-20 px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900"
                    />
                    <span className="text-xs font-bold text-slate-600 font-mono">
                      minutos (
                      {Math.round(
                        (reservationConfig.paymentMethodTtl.contraentrega ?? 1440) / 60
                      )}
                      h)
                    </span>
                  </div>
                </div>
              </div>

              {/* TTL General y Acción de Expiración */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                    TTL General por Defecto (Minutos)
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={reservationConfig.defaultTtlMinutes}
                    onChange={(e) =>
                      setReservationConfig((prev) => ({
                        ...prev,
                        defaultTtlMinutes: parseInt(e.target.value, 10) || 60,
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 font-sans">
                    Tiempo de retención fallback para métodos de pago no especificados.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                    Estado Asignado al Expirar la Reserva
                  </label>
                  <select
                    value={reservationConfig.expiryAction}
                    onChange={(e) =>
                      setReservationConfig((prev) => ({
                        ...prev,
                        expiryAction: e.target.value as "cancel" | "expire",
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-sans font-bold text-slate-900"
                  >
                    <option value="cancel">Marcar como &quot;Cancelado&quot;</option>
                    <option value="expire">Marcar como &quot;Expirado&quot;</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1 font-sans">
                    Estado al que pasa la orden automáticamente al vencer el tiempo sin pago.
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics & Manual Action Bar */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Hourglass className="w-4 h-4 text-[#E60012]" />
                  Monitor en Vivo de Reservas de Stock
                </h4>
                <button
                  type="button"
                  onClick={handleCleanOverdueReservations}
                  disabled={isCleaningReservations}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-60"
                >
                  <Zap className={`w-3.5 h-3.5 text-amber-400 ${isCleaningReservations ? "animate-spin" : ""}`} />
                  <span>{isCleaningReservations ? "Procesando..." : "Liberar Reservas Vencidas Ahora"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-amber-900 uppercase font-mono">
                      Reservas Activas
                    </p>
                    <p className="text-xl font-black text-amber-950 font-display">
                      {reservationStats.totalActive}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0A3088] text-white flex items-center justify-center font-black">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-blue-900 uppercase font-mono">
                      Unidades Retenidas
                    </p>
                    <p className="text-xl font-black text-blue-950 font-display">
                      {reservationStats.totalReservedUnits}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-400 text-white flex items-center justify-center font-black">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-700 uppercase font-mono">
                      Expiradas / Liberadas
                    </p>
                    <p className="text-xl font-black text-slate-900 font-display">
                      {reservationStats.totalExpired}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reservations Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Pedido / Cliente</th>
                      <th className="py-3 px-4">Repuesto Reservado</th>
                      <th className="py-3 px-4">Cantidad</th>
                      <th className="py-3 px-4">Método</th>
                      <th className="py-3 px-4">Expiración / Restante</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reservations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                          No hay reservas de stock registradas actualmente.
                        </td>
                      </tr>
                    ) : (
                      reservations.map((res) => {
                        const remainingSec = res.remainingSeconds ?? 0;
                        const hours = Math.floor(remainingSec / 3600);
                        const mins = Math.floor((remainingSec % 3600) / 60);
                        const secs = remainingSec % 60;
                        const isExpired = res.isExpired || res.status === "expired";
                        const isActive = res.status === "active" && !isExpired;

                        return (
                          <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-extrabold text-slate-900 font-mono">
                                {res.orderDocumentNumber}
                              </p>
                              <p className="text-[11px] text-slate-500 font-sans">
                                {res.customerName}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900 font-display line-clamp-1">
                                {res.partName}
                              </p>
                              {res.partSku && (
                                <p className="text-[10px] text-slate-400 font-mono">
                                  SKU: {res.partSku}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono font-black text-slate-800">
                                {res.quantity} {res.quantity === 1 ? "ud" : "uds"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="capitalize text-slate-700 font-mono text-[11px] font-bold">
                                {res.paymentMethod}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {isActive ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black font-mono animate-pulse">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    {String(hours).padStart(2, "0")}:{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                                  </span>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    Vence: {formatOrderDate(res.expiresAt)}
                                  </p>
                                </div>
                              ) : res.status === "consumed" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold font-mono">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Pago Aprobado (Venta)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold font-mono">
                                  <AlertCircle className="w-3 h-3 text-red-500" />
                                  Expirada / Liberada
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isActive && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setExtendingOrder(res);
                                        setExtendMinutes(60);
                                        setExtendReason("Prórroga concedida a solicitud del cliente");
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-[10px] transition-colors cursor-pointer"
                                      title="Extender tiempo de reserva para este pedido"
                                    >
                                      + Extender
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleReleaseSingleReservation(res)}
                                      className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-[10px] transition-colors cursor-pointer"
                                      title="Liberar reserva inmediatamente"
                                    >
                                      Liberar
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "returns" && (
          <div className="space-y-5">
            <p className="text-xs text-slate-600 font-sans">
              Política de devoluciones y garantía de la tienda.
            </p>
            <div className="p-5 bg-amber-50/60 border border-amber-200 rounded-2xl">
              <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-2 font-mono flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                Plazo Máximo para Devoluciones (Días)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.returnMaxDays}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    set("returnMaxDays", Number.isNaN(n) ? 0 : n);
                  }}
                  className="w-32 px-4 py-2.5 bg-white rounded-xl border border-amber-300 focus:ring-2 focus:ring-[#E60012] text-sm font-mono font-bold text-slate-900"
                />
                <span className="text-xs font-bold text-slate-700 font-sans">
                  días después de la entrega del pedido
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-1 font-sans">
                Los clientes verán la opción de solicitar devolución/garantía en
                sus pedidos durante este período máximo.
              </p>
            </div>
          </div>
        )}

        {activeSubTab === "documents" && (
          <div className="space-y-5">
            <p className="text-xs text-slate-600 font-sans">
              Prefijos usados en la numeración de los documentos de pedidos y
              devoluciones (RMA). Cada nuevo documento se genera con el prefijo
              correspondiente seguido del número consecutivo.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#E60012]" />
                  Prefijo de Pedidos
                </label>
                <input
                  type="text"
                  value={settings.orderPrefix}
                  onChange={(e) => set("orderPrefix", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012] text-sm font-mono font-bold text-slate-900 uppercase"
                  placeholder="SZ-ORD"
                />
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  Ejemplo de resultado:{" "}
                  <span className="font-mono font-bold text-slate-700">
                    {settings.orderPrefix || "SZ-ORD"}-000123
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  Prefijo de Devoluciones (RMA)
                </label>
                <input
                  type="text"
                  value={settings.returnPrefix}
                  onChange={(e) => set("returnPrefix", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012] text-sm font-mono font-bold text-slate-900 uppercase"
                  placeholder="SZ-RET"
                />
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  Ejemplo de resultado:{" "}
                  <span className="font-mono font-bold text-slate-700">
                    {settings.returnPrefix || "SZ-RET"}-000123
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "footer" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 font-display flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#E60012]" />
                Footer de la Tienda
              </h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Contenido que se muestra al pie de la tienda: subtítulo,
                descripción, copyright y links legales.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                  Subtítulo (Tagline)
                </label>
                <input
                  type="text"
                  value={settings.footerConfig?.tagline || ""}
                  onChange={(e) => setFooter("tagline", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012] text-sm font-sans text-slate-900"
                  placeholder="Subtítulo del footer"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                  Copyright
                </label>
                <input
                  type="text"
                  value={settings.footerConfig?.copyright || ""}
                  onChange={(e) => setFooter("copyright", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012] text-sm font-sans text-slate-900"
                  placeholder="Texto de copyright"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                Descripción
              </label>
              <textarea
                rows={3}
                value={settings.footerConfig?.description || ""}
                onChange={(e) => setFooter("description", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012] text-sm font-sans text-slate-900 resize-none"
                placeholder="Descripción de la tienda"
              />
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider font-mono">
                  Links Legales
                </span>
                <button
                  type="button"
                  onClick={addLegalLink}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E60012] hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar Link
                </button>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Los links sin URL (o sin etiqueta) se omiten del footer. Usa
                &quot;#tutorial&quot; para que el link abra el tutorial técnico.
              </p>
              {(settings.footerConfig?.legalLinks || []).map((link, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-2 items-center"
                >
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) =>
                      setLegalLink(index, "label", e.target.value)
                    }
                    className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-300 text-sm font-sans text-slate-900"
                    placeholder="Etiqueta del link"
                  />
                  <input
                    type="text"
                    value={link.href}
                    onChange={(e) =>
                      setLegalLink(index, "href", e.target.value)
                    }
                    className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-300 text-sm font-mono text-slate-900"
                    placeholder="https://... o #tutorial"
                  />
                  <button
                    type="button"
                    onClick={() => removeLegalLink(index)}
                    className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                    title="Eliminar link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {(settings.footerConfig?.legalLinks || []).length === 0 && (
                <p className="text-xs text-slate-400 font-sans">
                  No hay links legales configurados.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3.5 bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Configuración</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Extension Modal Dialog */}
      {extendingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-display">
                    Extender Tiempo de Reserva
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {extendingOrder.orderDocumentNumber} ({extendingOrder.customerName})
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmExtend} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                  Opciones Rápidas de Prórroga
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "+30 Minutos", mins: 30 },
                    { label: "+2 Horas", mins: 120 },
                    { label: "+12 Horas", mins: 720 },
                    { label: "+24 Horas", mins: 1440 },
                    { label: "+48 Horas", mins: 2880 },
                    { label: "+72 Horas", mins: 4320 },
                  ].map((opt) => (
                    <button
                      key={opt.mins}
                      type="button"
                      onClick={() => setExtendMinutes(opt.mins)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-mono font-bold transition-all border cursor-pointer ${
                        extendMinutes === opt.mins
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                  Tiempo Adicional Personalizado (Minutos)
                </label>
                <input
                  type="number"
                  min="5"
                  value={extendMinutes}
                  onChange={(e) => setExtendMinutes(parseInt(e.target.value, 10) || 30)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                  Motivo de la Prórroga (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-sans text-slate-900 resize-none"
                  placeholder="Ej: Cliente solicita plazo para realizar transferencia bancaria"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExtendingOrder(null)}
                  disabled={isExtending}
                  className="px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isExtending}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {isExtending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Extendiendo...</span>
                    </>
                  ) : (
                    <span>Confirmar Prórroga</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
