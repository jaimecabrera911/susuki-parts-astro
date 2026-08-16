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

type SettingsTab = "general" | "taxes" | "returns" | "footer";

const SUBTABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "taxes", label: "Impuestos (IVA)", icon: Percent },
  { id: "returns", label: "Devoluciones", icon: RotateCcw },
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
  taxName: "",
  taxRate: 0,
  taxActive: false,
  returnMaxDays: 0,
  orderPrefix: "",
  returnPrefix: "",
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
    <div id="settings-manager" className="space-y-6 max-w-4xl">
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

              <div className="sm:col-span-2">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="sm:col-span-2">
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

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-slate-900 block font-display flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-[#E60012]" />
                  Mostrar Imágenes de Producto
                </span>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Si está desactivado, las imágenes se ocultan en catálogo,
                  carrito y checkout.
                </p>
              </div>
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

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label
                htmlFor="detail-primary"
                className="text-xs font-extrabold text-slate-900 block font-display flex items-center gap-1.5 mb-1"
              >
                <Layers className="w-4 h-4 text-[#E60012]" />
                Elemento Principal en el Detalle de Producto
              </label>
              <p className="text-xs text-slate-500 font-sans mt-0.5 mb-3">
                Controla qué se muestra como principal en el detalle de
                producto: el despiece técnico o las imágenes del repuesto. El
                otro elemento aparece debajo en versión compacta.
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
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012] text-sm font-sans text-slate-900 bg-white"
              >
                <option value="despiece">Despiece técnico</option>
                <option value="images">Imágenes del producto</option>
              </select>
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
