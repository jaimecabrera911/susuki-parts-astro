import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Building2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  AlertCircle,
  Eye,
  Info,
  Lock,
  Key,
} from "lucide-react";
import type { PaymentSettings, BankAccount, WompiConfig } from "../../types";
import { fetchPaymentSettings, savePaymentSettingsApi } from "../../services/api";

const DEFAULT_SETTINGS: PaymentSettings = {
  bankTransfer: {
    enabled: true,
    accounts: [],
  },
  wompi: {
    enabled: false,
    environment: "sandbox",
    publicKey: "",
    privateKey: "",
    integritySecret: "",
    eventsSecret: "",
  },
};

const BANK_OPTIONS = [
  "Bancolombia",
  "Nequi",
  "Daviplata",
  "Davivienda",
  "Banco de Bogotá",
  "BBVA Colombia",
  "Banco de Occidente",
  "Scotiabank Colpatria",
  "Banco AV Villas",
  "Banco Popular",
  "Banco Caja Social",
  "Nu Colombia",
  "Lulo Bank",
  "Otro",
];

const ACCOUNT_TYPES = [
  "Cuenta de Ahorros",
  "Cuenta Corriente",
  "Billetera Digital / Celular",
  "Depósito de Bajo Monto",
];

export const PaymentsManager: React.FC = () => {
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"bank" | "wompi" | "preview">("bank");
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Bank Account Modal state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [accountFormData, setAccountFormData] = useState<Partial<BankAccount>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Webhook URL generator based on current origin
  const [webhookUrl, setWebhookUrl] = useState("/api/webhooks/wompi");
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/webhooks/wompi`);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchPaymentSettings();
      if (data) {
        setSettings({
          bankTransfer: {
            enabled:
              typeof data.bankTransfer?.enabled === "boolean"
                ? data.bankTransfer.enabled
                : true,
            accounts: Array.isArray(data.bankTransfer?.accounts)
              ? data.bankTransfer.accounts
              : DEFAULT_SETTINGS.bankTransfer.accounts,
          },
          wompi: {
            enabled:
              typeof data.wompi?.enabled === "boolean" ? data.wompi.enabled : false,
            environment:
              data.wompi?.environment === "production" ? "production" : "sandbox",
            publicKey: data.wompi?.publicKey || "",
            privateKey: data.wompi?.privateKey || "",
            integritySecret: data.wompi?.integritySecret || "",
            eventsSecret: data.wompi?.eventsSecret || "",
          },
        });
      }
    } catch (err) {
      console.error("Error cargando configuración de pagos:", err);
      showNotification("error", "Error cargando la configuración de pagos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (
    type: "success" | "error" | "info",
    message: string,
  ) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveAll = async (overrideSettings?: PaymentSettings) => {
    setIsSaving(true);
    try {
      const payload = overrideSettings || settings;
      const saved = await savePaymentSettingsApi(payload);
      if (saved) {
        setSettings(saved);
        showNotification("success", "Configuración de pagos guardada correctamente");
      }
    } catch (err: any) {
      console.error("Error guardando pagos:", err);
      showNotification(
        "error",
        err?.message || "Error guardando la configuración de pagos",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Open modal to add a new account
  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setAccountFormData({
      id: crypto.randomUUID(),
      bankName: "Bancolombia",
      accountType: "Cuenta de Ahorros",
      accountNumber: "",
      accountHolder: "",
      nit: "",
      instructions:
        "Usa el número de orden generado como referencia de pago al transferir.",
      active: true,
      isDefault: settings.bankTransfer.accounts.length === 0,
    });
    setIsAccountModalOpen(true);
  };

  // Open modal to edit an existing account
  const handleOpenEditAccount = (acc: BankAccount) => {
    setEditingAccount(acc);
    setAccountFormData({ ...acc });
    setIsAccountModalOpen(true);
  };

  // Save bank account from modal
  const handleSaveAccountModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountFormData.bankName || !accountFormData.accountNumber || !accountFormData.accountHolder) {
      showNotification("error", "Por favor completa el banco, número y titular de la cuenta");
      return;
    }

    const newAccount: BankAccount = {
      id: accountFormData.id || crypto.randomUUID(),
      bankName: accountFormData.bankName.trim(),
      accountType: accountFormData.accountType || "Cuenta de Ahorros",
      accountNumber: accountFormData.accountNumber.trim(),
      accountHolder: accountFormData.accountHolder.trim(),
      nit: (accountFormData.nit || "").trim(),
      instructions: (accountFormData.instructions || "").trim(),
      active: accountFormData.active !== undefined ? accountFormData.active : true,
      isDefault: Boolean(accountFormData.isDefault),
    };

    let updatedAccounts: BankAccount[] = [];
    if (editingAccount) {
      updatedAccounts = settings.bankTransfer.accounts.map((acc) =>
        acc.id === editingAccount.id ? newAccount : newAccount.isDefault ? { ...acc, isDefault: false } : acc,
      );
    } else {
      if (newAccount.isDefault) {
        updatedAccounts = settings.bankTransfer.accounts.map((acc) => ({ ...acc, isDefault: false }));
      } else {
        updatedAccounts = [...settings.bankTransfer.accounts];
      }
      updatedAccounts.push(newAccount);
    }

    const updatedSettings: PaymentSettings = {
      ...settings,
      bankTransfer: {
        ...settings.bankTransfer,
        accounts: updatedAccounts,
      },
    };

    setSettings(updatedSettings);
    setIsAccountModalOpen(false);
    handleSaveAll(updatedSettings);
  };

  // Toggle account active state directly
  const handleToggleAccountActive = (id: string) => {
    const updatedAccounts = settings.bankTransfer.accounts.map((acc) =>
      acc.id === id ? { ...acc, active: !acc.active } : acc,
    );
    const updatedSettings: PaymentSettings = {
      ...settings,
      bankTransfer: {
        ...settings.bankTransfer,
        accounts: updatedAccounts,
      },
    };
    setSettings(updatedSettings);
    handleSaveAll(updatedSettings);
  };

  // Set account as default
  const handleSetDefaultAccount = (id: string) => {
    const updatedAccounts = settings.bankTransfer.accounts.map((acc) => ({
      ...acc,
      isDefault: acc.id === id,
    }));
    const updatedSettings: PaymentSettings = {
      ...settings,
      bankTransfer: {
        ...settings.bankTransfer,
        accounts: updatedAccounts,
      },
    };
    setSettings(updatedSettings);
    handleSaveAll(updatedSettings);
  };

  // Delete bank account
  const handleDeleteAccount = (id: string) => {
    const updatedAccounts = settings.bankTransfer.accounts.filter((acc) => acc.id !== id);
    const updatedSettings: PaymentSettings = {
      ...settings,
      bankTransfer: {
        ...settings.bankTransfer,
        accounts: updatedAccounts,
      },
    };
    setSettings(updatedSettings);
    setDeleteConfirmId(null);
    handleSaveAll(updatedSettings);
  };

  // Copy webhook URL
  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    showNotification("info", "URL del webhook copiada al portapapeles");
    setTimeout(() => setCopiedWebhook(false), 3000);
  };

  if (loading) {
    return (
      <div
        id="payments-manager"
        className="p-8 flex flex-col items-center justify-center min-h-[400px] text-slate-500"
      >
        <RefreshCw className="w-8 h-8 animate-spin text-[#E60012] mb-3" />
        <p className="font-semibold text-sm">Cargando medios de pago...</p>
      </div>
    );
  }

  return (
    <div id="payments-manager" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold animate-in fade-in slide-in-from-bottom-5 ${
            notification.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-950/20"
              : notification.type === "error"
              ? "bg-rose-600 text-white border-rose-500 shadow-rose-950/20"
              : "bg-slate-900 text-white border-slate-800 shadow-slate-950/20"
          }`}
        >
          {notification.type === "success" && <CheckCircle2 className="w-5 h-5 shrink-0" />}
          {notification.type === "error" && <XCircle className="w-5 h-5 shrink-0" />}
          {notification.type === "info" && <Info className="w-5 h-5 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-[#E60012] shrink-0 border border-red-100">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 font-display tracking-tight">
                Medios de Pago & Pasarelas
              </h1>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Administra las cuentas bancarias para transferencias y prepara la pasarela de pagos Wompi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSaveAll()}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#E60012] hover:bg-[#CC0010] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("bank")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === "bank"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Transferencias Bancarias
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              settings.bankTransfer.enabled
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-slate-700 text-slate-400"
            }`}
          >
            {settings.bankTransfer.enabled ? "Activo" : "Inactivo"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("wompi")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === "wompi"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          Pasarela Wompi (Bancolombia)
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              settings.wompi.enabled
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {settings.wompi.enabled ? "Activa" : "Desactivada"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === "preview"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Eye className="w-4 h-4" />
          Vista Previa Checkout
        </button>
      </div>

      {/* TAB 1: TRANSFERENCIAS BANCARIAS */}
      {activeTab === "bank" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Master Switch Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0 border border-amber-200">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 font-display">
                  Habilitar Transferencias Bancarias Directas
                </h2>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Permite a los clientes pagar mediante transferencia o consignación bancaria (Bancolombia, Nequi, etc.) y reportar el comprobante.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.bankTransfer.enabled}
                onChange={(e) => {
                  const updated: PaymentSettings = {
                    ...settings,
                    bankTransfer: {
                      ...settings.bankTransfer,
                      enabled: e.target.checked,
                    },
                  };
                  setSettings(updated);
                  handleSaveAll(updated);
                }}
                className="sr-only peer"
              />
              <div className="w-13 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Accounts List Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase font-display tracking-wider">
                  Cuentas Bancarias Registradas ({settings.bankTransfer.accounts.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Agrega y gestiona los datos de tus cuentas. Puedes tener varias activas para que el cliente elija.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddAccount}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Nueva Cuenta
              </button>
            </div>

            {settings.bankTransfer.accounts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">
                  No hay cuentas bancarias registradas
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Agrega una cuenta de Bancolombia, Nequi u otra entidad para que tus clientes puedan transferir en el checkout.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddAccount}
                  className="px-4 py-2 bg-[#E60012] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#CC0010]"
                >
                  Agregar Primera Cuenta
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.bankTransfer.accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      acc.active
                        ? "bg-slate-50/50 border-slate-200 hover:border-slate-300 shadow-xs"
                        : "bg-slate-100/60 border-slate-200 opacity-60"
                    }`}
                  >
                    <div>
                      {/* Top Row: Bank Badge + Default Status + Actions */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-black text-xs uppercase font-display tracking-wider">
                            {acc.bankName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold font-mono">
                            {acc.accountType}
                          </span>
                          {acc.isDefault && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black uppercase font-mono">
                              Principal
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditAccount(acc)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-2xs"
                            title="Editar cuenta"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(acc.id)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-2xs"
                            title="Eliminar cuenta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Account Details */}
                      <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200 text-xs font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Número de Cuenta:</span>
                          <strong className="text-slate-900 font-extrabold text-sm">
                            {acc.accountNumber}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Titular:</span>
                          <span className="text-slate-800 font-bold">
                            {acc.accountHolder}
                          </span>
                        </div>
                        {acc.nit && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">NIT / Cédula:</span>
                            <span className="text-slate-700">{acc.nit}</span>
                          </div>
                        )}
                      </div>

                      {acc.instructions && (
                        <p className="text-[11px] text-slate-500 mt-2.5 italic">
                          "{acc.instructions}"
                        </p>
                      )}
                    </div>

                    {/* Bottom Controls */}
                    <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleAccountActive(acc.id)}
                          className={`flex items-center gap-1 text-xs font-bold ${
                            acc.active ? "text-emerald-700" : "text-slate-500"
                          }`}
                        >
                          {acc.active ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-400" />
                          )}
                          {acc.active ? "Activa" : "Desactivada"}
                        </button>
                      </div>

                      {!acc.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAccount(acc.id)}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-900 underline"
                        >
                          Marcar como principal
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PASARELA WOMPI */}
      {activeTab === "wompi" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Master Switch Wompi */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0 border border-amber-200">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900 font-display">
                    Pasarela de Pagos Wompi (Bancolombia)
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      settings.wompi.enabled
                        ? settings.wompi.environment === "production"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {settings.wompi.enabled
                      ? settings.wompi.environment === "production"
                        ? "Producción Activa"
                        : "Sandbox (Pruebas)"
                      : "Desactivada"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Permite pagos automáticos con Tarjetas de Crédito/Débito, PSE, Nequi y Botón Bancolombia mediante el Widget de Wompi.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.wompi.enabled}
                onChange={(e) => {
                  const updated: PaymentSettings = {
                    ...settings,
                    wompi: {
                      ...settings.wompi,
                      enabled: e.target.checked,
                    },
                  };
                  setSettings(updated);
                  handleSaveAll(updated);
                }}
                className="sr-only peer"
              />
              <div className="w-13 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Credentials and Settings Form */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase font-display tracking-wider mb-1">
                Credenciales & Entorno de Wompi
              </h3>
              <p className="text-xs text-slate-500">
                Obtén tus llaves en tu panel de Wompi (
                <a
                  href="https://comercios.wompi.co"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#E60012] font-semibold hover:underline inline-flex items-center gap-1"
                >
                  comercios.wompi.co <ExternalLink className="w-3 h-3" />
                </a>
                ) en la sección Desarrolladores &gt; Llaves de integración.
              </p>
            </div>

            {/* Environment Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-xs uppercase text-slate-800 block">
                  Entorno de Operación
                </span>
                <span className="text-xs text-slate-500">
                  Usa Sandbox para hacer transacciones simuladas y Producción cuando estés listo para recibir dinero real.
                </span>
              </div>

              <div className="flex items-center bg-slate-200 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const updated = {
                      ...settings,
                      wompi: { ...settings.wompi, environment: "sandbox" as const },
                    };
                    setSettings(updated);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                    settings.wompi.environment === "sandbox"
                      ? "bg-amber-400 text-amber-950 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Sandbox (Pruebas)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = {
                      ...settings,
                      wompi: { ...settings.wompi, environment: "production" as const },
                    };
                    setSettings(updated);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                    settings.wompi.environment === "production"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Producción
                </button>
              </div>
            </div>

            {/* Keys Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Public Key */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-slate-700">
                  Llave Pública (Public Key){" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={settings.wompi.publicKey}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        wompi: { ...settings.wompi, publicKey: e.target.value },
                      })
                    }
                    placeholder={
                      settings.wompi.environment === "production"
                        ? "pub_prod_..."
                        : "pub_test_..."
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Utilizada en el navegador por el widget de pago para autenticar tu comercio.
                </p>
              </div>

              {/* Integrity Secret */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-slate-700">
                  Secreto de Integridad (Integrity Secret){" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={settings.wompi.integritySecret}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        wompi: { ...settings.wompi, integritySecret: e.target.value },
                      })
                    }
                    placeholder={
                      settings.wompi.environment === "production"
                        ? "prod_integrity_..."
                        : "test_integrity_..."
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Firma digital que protege los montos contra alteraciones o fraude.
                </p>
              </div>

              {/* Private Key */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-slate-700">
                  Llave Privada (Private Key)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={settings.wompi.privateKey}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        wompi: { ...settings.wompi, privateKey: e.target.value },
                      })
                    }
                    placeholder={
                      settings.wompi.environment === "production"
                        ? "prv_prod_..."
                        : "prv_test_..."
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Usada por el backend para consultas de transacciones y conciliaciones.
                </p>
              </div>

              {/* Events Secret */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-slate-700">
                  Secreto de Eventos (Webhooks Secret)
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={settings.wompi.eventsSecret || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        wompi: { ...settings.wompi, eventsSecret: e.target.value },
                      })
                    }
                    placeholder={
                      settings.wompi.environment === "production"
                        ? "prod_events_..."
                        : "test_events_..."
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Verifica que los webhooks enviados por Wompi provengan genuinamente de sus servidores.
                </p>
              </div>
            </div>

            {/* Webhook Configuration Box */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-700" />
                  <span className="font-bold text-xs text-blue-950 uppercase">
                    URL de Webhook para Eventos Wompi
                  </span>
                </div>
                <span className="text-[11px] font-mono text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  POST /api/webhooks/wompi
                </span>
              </div>

              <p className="text-xs text-blue-900/80">
                Pega esta URL en el panel de Wompi (sección <em>Eventos &gt; URL de eventos</em>) para recibir confirmaciones automáticas cuando un pago sea aprobado:
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 px-3.5 py-2 bg-white border border-blue-300 rounded-xl text-xs font-mono font-bold text-blue-950 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedWebhook ? "¡Copiado!" : "Copiar URL"}
                </button>
              </div>
            </div>

            {/* Save Button for Wompi */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => handleSaveAll()}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#E60012] hover:bg-[#CC0010] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Configuración de Wompi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VISTA PREVIA DEL CHECKOUT */}
      {activeTab === "preview" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-black text-slate-900 font-display">
                Vista Previa en Vivo: Cómo lo Verá el Cliente en el Checkout
              </h2>
              <p className="text-xs text-slate-500">
                Esta simulación muestra las opciones de pago que aparecerán según la configuración activa en este momento.
              </p>
            </div>

            <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900 font-display">
                  4. Selecciona tu Método de Pago
                </h3>
              </div>

              {/* Active options simulation */}
              <div className="space-y-3">
                {/* Wompi Option (if enabled) */}
                {settings.wompi.enabled && (
                  <div className="p-4 rounded-2xl bg-white border-2 border-emerald-500 shadow-xs flex items-start gap-3">
                    <input
                      type="radio"
                      name="previewPayment"
                      id="prev-wompi"
                      defaultChecked={!settings.bankTransfer.enabled}
                      className="mt-1 w-4 h-4 text-emerald-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">
                          Pago Online Seguro (Tarjetas, PSE, Nequi, Bancolombia)
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold uppercase">
                          Wompi {settings.wompi.environment === "sandbox" ? "(Sandbox)" : ""}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Acreditación inmediata de la orden con pasarela oficial Bancolombia.
                      </p>
                    </div>
                  </div>
                )}

                {/* Bank Transfer Option (if enabled) */}
                {settings.bankTransfer.enabled && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-400 shadow-xs flex items-start gap-3">
                    <input
                      type="radio"
                      name="previewPayment"
                      id="prev-bank"
                      defaultChecked
                      className="mt-1 w-4 h-4 text-[#E60012]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">
                          Transferencia Bancaria Directa
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-mono font-bold uppercase">
                          Recomendado
                        </span>
                      </div>

                      {/* Bank Accounts Render */}
                      <div className="mt-3 space-y-2">
                        {settings.bankTransfer.accounts
                          .filter((acc) => acc.active)
                          .map((acc) => (
                            <div
                              key={acc.id}
                              className="p-3 bg-white rounded-xl border border-amber-200 text-xs font-mono space-y-1"
                            >
                              <div className="flex items-center justify-between font-bold text-slate-900">
                                <span>{acc.bankName} - {acc.accountType}</span>
                                {acc.isDefault && (
                                  <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                    Principal
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-slate-700">
                                <span>No. Cuenta: <strong>{acc.accountNumber}</strong></span>
                                <span>Titular: <strong>{acc.accountHolder}</strong></span>
                              </div>
                              {acc.nit && (
                                <div className="text-slate-500 text-[11px]">
                                  NIT/CC: {acc.nit}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>

                      <p className="text-[11px] text-slate-600 mt-2">
                        Al completar el pedido, podrás enviar el comprobante de transferencia al WhatsApp de la tienda para despacho inmediato.
                      </p>
                    </div>
                  </div>
                )}

                {/* If none enabled */}
                {!settings.bankTransfer.enabled && !settings.wompi.enabled && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Atención: No tienes ningún medio de pago habilitado. Activa al menos las Transferencias Bancarias o Wompi.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT BANK ACCOUNT */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-[#E60012] flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 font-display">
                    {editingAccount ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Datos bancarios para transferencias directas
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccountModal} className="p-6 space-y-4 overflow-y-auto">
              {/* Bank Name */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Entidad Bancaria / Plataforma <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="bank-suggestions"
                  required
                  value={accountFormData.bankName || ""}
                  onChange={(e) =>
                    setAccountFormData({ ...accountFormData, bankName: e.target.value })
                  }
                  placeholder="Ej. Bancolombia, Nequi, Davivienda"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                />
                <datalist id="bank-suggestions">
                  {BANK_OPTIONS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Tipo de Cuenta <span className="text-red-500">*</span>
                </label>
                <select
                  value={accountFormData.accountType || "Cuenta de Ahorros"}
                  onChange={(e) =>
                    setAccountFormData({ ...accountFormData, accountType: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Número de Cuenta / Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accountFormData.accountNumber || ""}
                  onChange={(e) =>
                    setAccountFormData({ ...accountFormData, accountNumber: e.target.value })
                  }
                  placeholder="Ej. 123-456789-01 ó 3001234567"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                />
              </div>

              {/* Account Holder */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Nombre del Titular de la Cuenta <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accountFormData.accountHolder || ""}
                  onChange={(e) =>
                    setAccountFormData({ ...accountFormData, accountHolder: e.target.value })
                  }
                  placeholder="Ej. Nombre del Titular o Razón Social"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                />
              </div>

              {/* NIT or Cédula */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  NIT o Cédula del Titular
                </label>
                <input
                  type="text"
                  value={accountFormData.nit || ""}
                  onChange={(e) =>
                    setAccountFormData({ ...accountFormData, nit: e.target.value })
                  }
                  placeholder="Ej. 900.123.456-7"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Instrucciones Adicionales para el Cliente
                </label>
                <textarea
                  rows={2}
                  value={accountFormData.instructions || ""}
                  onChange={(e) =>
                    setAccountFormData({ ...accountFormData, instructions: e.target.value })
                  }
                  placeholder="Ej. Enviar comprobante al WhatsApp indicando el número de pedido..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                />
              </div>

              {/* Switches: Active & Default */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accountFormData.active !== false}
                    onChange={(e) =>
                      setAccountFormData({ ...accountFormData, active: e.target.checked })
                    }
                    className="w-4 h-4 text-[#E60012] rounded border-slate-300 focus:ring-[#E60012]"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Cuenta activa para recibir pagos en el checkout
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(accountFormData.isDefault)}
                    onChange={(e) =>
                      setAccountFormData({ ...accountFormData, isDefault: e.target.checked })
                    }
                    className="w-4 h-4 text-[#E60012] rounded border-slate-300 focus:ring-[#E60012]"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Marcar como cuenta principal recomendada
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E60012] hover:bg-[#CC0010] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-all"
                >
                  {editingAccount ? "Guardar Cambios" : "Crear Cuenta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 max-w-sm w-full space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-slate-900 font-display">
                ¿Eliminar cuenta bancaria?
              </h3>
              <p className="text-xs text-slate-500">
                Esta cuenta ya no aparecerá como opción de transferencia para los clientes.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAccount(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-colors"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
