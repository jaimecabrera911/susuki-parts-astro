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
} from "lucide-react";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import type {
  SiteSettings,
  FooterConfig,
  FooterLink,
  CityRecord,
  SocialLinks,
} from "../../types";
import {
  GET_SETTINGS,
  POST_SETTINGS,
  UPLOAD_IMAGE,
  fetchCities,
} from "../../services/api";
import { LocationSelector } from "../LocationSelector";

type SettingsTab = "general" | "specs" | "taxes" | "returns" | "documents" | "footer";

const SUBTABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "specs", label: "Especificaciones", icon: Sliders },
  { id: "taxes", label: "Impuestos (IVA)", icon: Percent },
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
    </div>
  );
};
