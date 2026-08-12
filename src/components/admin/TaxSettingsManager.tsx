import React, { useState, useEffect } from "react";
import {
  Percent,
  Save,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import type { TaxConfig } from "../../types";
import { DEFAULT_TAX_CONFIG } from "../../data/taxCouponsData";

export const TaxSettingsManager: React.FC = () => {
  const [taxConfig, setTaxConfig] = useState<TaxConfig>(() => {
    const saved = localStorage.getItem("sz_tax_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_TAX_CONFIG;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadTaxConfig() {
      try {
        const res = await fetch("/api/settings")
          .then((r) => r.json())
          .catch(() => null);
        if (res?.success && res.data) {
          setTaxConfig(res.data);
          localStorage.setItem("sz_tax_config", JSON.stringify(res.data));
        }
      } catch (e) {
        console.error("Error cargando configuración de impuestos:", e);
      }
    }
    loadTaxConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      localStorage.setItem("sz_tax_config", JSON.stringify(taxConfig));
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taxConfig),
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Error guardando impuestos:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E60012] to-red-700 text-white flex items-center justify-center font-black shadow-md shadow-red-500/20">
            <Percent className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 font-display">
              Configuración de Impuestos (IVA)
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Administra la tasa de impuesto oficial aplicada a los repuestos y
              facturación en el checkout.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span
            className={`px-3 py-1 rounded-full font-bold uppercase ${
              taxConfig.active
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            {taxConfig.active ? "Impuesto Activo" : "Impuesto Desactivado"}
          </span>
        </div>
      </div>

      {/* Main Form */}
      <form
        onSubmit={handleSave}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6"
      >
        {savedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              ¡Configuración de impuestos guardada y actualizada exitosamente!
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Tax Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
              Nombre del Impuesto / Tasa
            </label>
            <input
              type="text"
              value={taxConfig.taxName}
              onChange={(e) =>
                setTaxConfig({ ...taxConfig, taxName: e.target.value })
              }
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012] text-sm font-semibold text-slate-900"
              placeholder="Ej. IVA Impuesto Nacional"
            />
            <p className="text-[11px] text-slate-500 mt-1 font-sans">
              Nombre que aparecerá en los comprobantes y desgloses de compra.
            </p>
          </div>

          {/* Tax Rate Percentage */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
              Porcentaje de Impuesto (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={taxConfig.taxRate}
                onChange={(e) =>
                  setTaxConfig({
                    ...taxConfig,
                    taxRate: parseFloat(e.target.value) || 0,
                  })
                }
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#E60012] focus:border-[#E60012] text-sm font-mono font-bold text-slate-900 pr-10"
                placeholder="19"
              />
              <span className="absolute right-4 top-3.5 text-slate-400 font-mono font-bold text-sm">
                %
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-sans">
              Tasa por defecto en Colombia es 19% IVA.
            </p>
          </div>
        </div>

        {/* Return Days Limit Configuration */}
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
              value={(taxConfig as any).returnMaxDays !== undefined ? (taxConfig as any).returnMaxDays : 30}
              onChange={(e) =>
                setTaxConfig({
                  ...taxConfig,
                  returnMaxDays: parseInt(e.target.value) || 30,
                } as any)
              }
              required
              className="w-32 px-4 py-2.5 bg-white rounded-xl border border-amber-300 focus:ring-2 focus:ring-[#E60012] text-sm font-mono font-bold text-slate-900"
            />
            <span className="text-xs font-bold text-slate-700 font-sans">días después de la entrega del pedido</span>
          </div>
          <p className="text-[11px] text-amber-800 mt-1 font-sans">
            Los clientes verán la opción de solicitar devolución/garantía en sus pedidos durante este período máximo.
          </p>
        </div>

        {/* Active Toggle */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold text-slate-900 block font-display">
              Aplicar Impuesto en el Checkout
            </span>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Si está desactivado, el monto de impuesto en los pedidos se
              calculará como $0.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={taxConfig.active}
              onChange={(e) =>
                setTaxConfig({ ...taxConfig, active: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E60012]"></div>
          </label>
        </div>

        {/* Tax Example Calculation Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 font-mono text-xs space-y-2">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
            EJEMPLO DE CÁLCULO DE IMPUESTO EN VIVO
          </span>
          <div className="flex justify-between text-slate-300">
            <span>Subtotal Repuestos:</span>
            <span>$100.000 COP</span>
          </div>
          <div className="flex justify-between text-emerald-400">
            <span>
              {taxConfig.taxName} (
              {taxConfig.active ? `${taxConfig.taxRate}%` : "Desactivado"}):
            </span>
            <span>
              + $
              {taxConfig.active
                ? ((100000 * taxConfig.taxRate) / 100).toLocaleString("es-CO")
                : "0"}{" "}
              COP
            </span>
          </div>
          <div className="flex justify-between text-white font-black text-sm pt-2 border-t border-slate-800">
            <span>Subtotal con Impuesto:</span>
            <span className="text-[#E60012]">
              $
              {taxConfig.active
                ? (100000 + (100000 * taxConfig.taxRate) / 100).toLocaleString(
                    "es-CO",
                  )
                : "100.000"}{" "}
              COP
            </span>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3.5 bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-500/20 cursor-pointer flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Configuración de Impuestos</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
