import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Package,
  Plus,
  Trash2,
  Layers,
  AlertCircle,
  Wrench,
  UploadCloud,
  Percent,
  ArrowUp,
  ArrowDown,
  Star,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Sliders,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import type {
  SuzukiPart,
  SuzukiModel,
  AvailabilityStatus,
  TechnicalSpec,
  CompatibilityRule,
  Category,
} from "../../types";
import { SearchableModelSelect } from "../SearchableModelSelect";
import { UPLOAD_IMAGE } from "../../services/api";
import { useSiteSettings } from "../SiteSettingsProvider";
import { formatThousands } from "../../utils/formatCurrency";

interface PartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (part: SuzukiPart) => void;
  partToEdit: SuzukiPart | null;
  models: SuzukiModel[];
  categories: Category[];
}

export const PartDrawer: React.FC<PartDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  partToEdit,
  models,
  categories,
}) => {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [primaryOem, setPrimaryOem] = useState("");
  const [secondaryOems, setSecondaryOems] = useState<string[]>([]);
  const [secondaryOemInput, setSecondaryOemInput] = useState("");
  const [category, setCategory] = useState<string>("");
  const [price, setPrice] = useState<number>(50000);
  const [taxable, setTaxable] = useState<boolean>(true);
  const [priceIncludesTax, setPriceIncludesTax] = useState<boolean>(false);
  const [stock, setStock] = useState<number>(10);
  const [priceInput, setPriceInput] = useState<string>(formatThousands(50000));
  const [stockInput, setStockInput] = useState<string>(formatThousands(10));
  const [availability, setAvailability] =
    useState<AvailabilityStatus>("in_stock");
  const [gallery, setGallery] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const MAX_IMAGES = 8;
  const { settings } = useSiteSettings();
  const configuredDefaultSpecs = settings.defaultSpecs || [];

  // Technical Specs List
  const [specs, setSpecs] = useState<TechnicalSpec[]>([]);
  const [specLabel, setSpecLabel] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [draggedSpecIdx, setDraggedSpecIdx] = useState<number | null>(null);

  // Compatibility Rules List
  const [compatibility, setCompatibility] = useState<CompatibilityRule[]>([]);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [yearStart, setYearStart] = useState<number>();
  const [yearEnd, setYearEnd] = useState<number>();
  const [versionNote, setVersionNote] = useState("");

  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(
        "Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP, SVG).",
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Cada imagen no puede superar 5 MB.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setGallery((prev) => {
          if (prev.length >= MAX_IMAGES) {
            setError(`Máximo ${MAX_IMAGES} imágenes por repuesto.`);
            return prev;
          }
          return [...prev, e.target!.result as string];
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFilesSelect = (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    if (gallery.length + arr.length > MAX_IMAGES) {
      setError(`Máximo ${MAX_IMAGES} imágenes por repuesto.`);
      return;
    }
    arr.forEach(handleFileSelect);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files);
    }
  };

  const handleReorder = (index: number, dir: -1 | 1) => {
    setGallery((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSetPrimary = (index: number) => {
    setGallery((prev) => {
      if (index === 0) return prev;
      const next = [...prev];
      const [img] = next.splice(index, 1);
      next.unshift(img);
      return next;
    });
  };

  const handleRemoveImage = (index: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (models.length > 0 && !selectedModelId) {
      setSelectedModelId(models[0].id);
    }
  }, [models]);

  useEffect(() => {
    if (partToEdit) {
      setSku(partToEdit.sku || "");
      setName(partToEdit.name || "");
      const [p, ...sec] = partToEdit.oemNumbers || [];
      setPrimaryOem(p || "");
      setSecondaryOems(sec || []);
      setSecondaryOemInput("");
      setCategory(partToEdit.category || "");
      setPrice(partToEdit.price);
      setTaxable(partToEdit.taxable !== false);
      setPriceIncludesTax(partToEdit.priceIncludesTax === true);
      setStock(partToEdit.stock);
      setAvailability(
        partToEdit.availability ||
          (partToEdit.stock > 0 ? "in_stock" : "on_order"),
      );
      setGallery(
        partToEdit.images && partToEdit.images.length > 0
          ? partToEdit.images
          : partToEdit.image
            ? [partToEdit.image]
            : [],
      );
      setDescription(partToEdit.description || "");
      setSpecs(partToEdit.specs || []);
      setCompatibility(partToEdit.compatibility || []);
    } else {
      setSku("");
      setName("");
      setPrimaryOem("");
      setSecondaryOems([]);
      setSecondaryOemInput("");
      const defaultSlug = categories[0]?.slug || "";
      setCategory(defaultSlug);
      setPrice(0);
      setTaxable(true);
      setPriceIncludesTax(false);
      setStock(0);
      setAvailability("in_stock");
      setGallery([]);
      setDescription("");
      const initialSpecs = configuredDefaultSpecs.length > 0
        ? configuredDefaultSpecs.map((d) => ({
            label: d.label,
            value: d.defaultValue || "",
          }))
        : [];
      setSpecs(initialSpecs);
      setCompatibility([]);
    }
    setError("");
  }, [partToEdit, isOpen, configuredDefaultSpecs.length, categories]);

  useEffect(() => {
    setPriceInput(formatThousands(price));
  }, [price]);

  useEffect(() => {
    setStockInput(formatThousands(stock));
  }, [stock]);

  const commitPrice = () => {
    const digits = priceInput.replace(/\D/g, "");
    if (digits === "") {
      setPriceInput(formatThousands(price));
      return;
    }
    setPrice(Math.max(0, Number(digits)));
  };

  const commitStock = () => {
    const digits = stockInput.replace(/\D/g, "");
    if (digits === "") {
      setStockInput(formatThousands(stock));
      return;
    }
    setStock(Math.max(0, Number(digits)));
  };

  if (!isOpen) return null;

  const handleAddSecondaryOem = () => {
    const trimmed = secondaryOemInput.trim().toUpperCase();
    if (trimmed && !secondaryOems.includes(trimmed)) {
      setSecondaryOems([...secondaryOems, trimmed]);
      setSecondaryOemInput("");
    }
  };

  const handleRemoveSecondaryOem = (oemToRemove: string) => {
    setSecondaryOems(secondaryOems.filter((o) => o !== oemToRemove));
  };

  const handleAddSpec = (labelToAdd?: string, valueToAdd?: string) => {
    const l = (labelToAdd ?? specLabel).trim();
    const v = (valueToAdd ?? specValue).trim();
    if (l || v) {
      setSpecs([
        ...specs,
        { label: l, value: v },
      ]);
      if (!labelToAdd) {
        setSpecLabel("");
        setSpecValue("");
      }
    }
  };

  const handleResetToDefaultSpecs = () => {
    if (!configuredDefaultSpecs.length) return;
    const defaults = configuredDefaultSpecs.map((s) => ({
      label: s.label,
      value: s.defaultValue || "",
    }));
    setSpecs(defaults);
  };

  const handleMoveSpec = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= specs.length || fromIndex === toIndex) return;
    const updated = [...specs];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setSpecs(updated);
  };

  const handleSpecDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSpecIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleSpecDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleSpecDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedSpecIdx === null || draggedSpecIdx === targetIndex) return;
    handleMoveSpec(draggedSpecIdx, targetIndex);
    setDraggedSpecIdx(null);
  };

  const handleUpdateSpec = (
    index: number,
    field: "label" | "value",
    val: string,
  ) => {
    const updated = [...specs];
    updated[index] = { ...updated[index], [field]: val };
    setSpecs(updated);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleAddCompatibility = () => {
    if (!selectedModelId) return;
    const rule: CompatibilityRule = {
      modelId: selectedModelId,
      yearStart,
      yearEnd,
      note: versionNote.trim() || undefined,
    };
    setCompatibility([...compatibility, rule]);
    setVersionNote("");
  };

  const handleRemoveCompatibility = (index: number) => {
    setCompatibility(compatibility.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del repuesto es obligatorio.");
      return;
    }

    if (!sku.trim()) {
      setError("El Código Interno / SKU es obligatorio.");
      return;
    }

    if (!primaryOem.trim()) {
      setError("La referencia OEM principal es obligatoria.");
      return;
    }

    const oemNumbers = [
      primaryOem.trim().toUpperCase(),
      ...secondaryOems
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    ];

    const partId = partToEdit
      ? partToEdit.id
      : crypto.randomUUID();

    // Clean up specs with empty label or value
    const cleanedSpecs = specs
      .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
      .filter((s) => s.label || s.value);

    let finalImages = [...gallery];
    if (finalImages.length > MAX_IMAGES) {
      setError(`Máximo ${MAX_IMAGES} imágenes por repuesto.`);
      return;
    }

    setUploading(true);
    setError("");
    try {
      const uploaded = await Promise.all(
        finalImages.map(async (img) => {
          if (img.startsWith("data:")) {
            const dataUrl = img;
            const file = await (async () => {
              const res = await fetch(dataUrl);
              const blob = await res.blob();
              const extMatch = dataUrl.match(/^data:image\/(\w+);/);
              const ext = extMatch ? extMatch[1].replace("jpeg", "jpg") : "png";
              return new File([blob], `part-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`, { type: blob.type });
            })();
            const result = await UPLOAD_IMAGE(file, "parts");
            return result.url;
          }
          return img;
        }),
      );

      const newPart: SuzukiPart = {
        id: partId,
        sku: sku.trim().toUpperCase(),
        oemNumbers,
        name: name.trim(),
        category,
        price,
        taxable,
        priceIncludesTax,
        stock,
        availability,
        image: uploaded[0] || "",
        images: uploaded,
        description: description.trim(),
        specs: cleanedSpecs,
        compatibility,
      };

      onSave(newPart);
      onClose();
    } catch (err: any) {
      setError(err?.message || "No se pudieron subir las imágenes.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div id="part-drawer" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-[95vw] md:max-w-4xl lg:max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 md:px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 font-display">
                {partToEdit ? "Editar Repuesto OEM" : "Nuevo Repuesto OEM"}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {partToEdit
                  ? `ID: ${partToEdit.id}`
                  : "Catálogo de Repuestos"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar"
        >
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#dc2626] text-xs flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Part Name & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Nombre del Repuesto *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Filtro de Aceite Genuino Cartucho"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Categoría *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium"
              >
                {categories.map((c) => (
                  <React.Fragment key={c.id}>
                    <option value={c.slug} className="font-extrabold text-slate-900">
                      {c.name}
                    </option>
                    {c.subcategories?.map((sub) => (
                      <option key={sub.id} value={sub.slug} className="text-slate-600">
                        {"\u00A0\u00A0\u00A0\u00A0— " + sub.name}
                      </option>
                    ))}
                  </React.Fragment>
                ))}
              </select>
            </div>
          </div>

          {/* OEM References & SKU (Geist Mono) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 font-mono">
              <Wrench className="w-4 h-4 text-[#E60012]" />
              <span>CÓDIGO INTERNO Y REFERENCIAS OEM</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1 font-mono">
                  Código Interno / SKU *
                </label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Ej. SKU-GN125-01"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono font-bold uppercase placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1 font-mono">
                  OEM Principal *
                </label>
                <input
                  type="text"
                  required
                  value={primaryOem}
                  onChange={(e) => setPrimaryOem(e.target.value)}
                  placeholder="Ej. 16510-05240-000"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono font-bold uppercase placeholder-slate-400"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[11px] text-slate-500 mb-1 font-mono">
                  OEMs Secundarias / Alternativas (Cross-Reference)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={secondaryOemInput}
                    onChange={(e) => setSecondaryOemInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSecondaryOem();
                      }
                    }}
                    placeholder="Ej. 16510-05240, 16510-06B00"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono font-bold uppercase placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddSecondaryOem}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Tag</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2.5">
                  {secondaryOems.map((oem) => (
                    <span
                      key={oem}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono font-bold shadow-2xs"
                    >
                      <span>{oem}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSecondaryOem(oem)}
                        className="text-slate-400 hover:text-red-600 font-bold ml-1"
                        title="Eliminar OEM secundaria"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {secondaryOems.length === 0 && (
                    <span className="text-[11px] text-slate-400 font-mono italic">
                      No hay referencias secundarias agregadas.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Price, Stock & Availability */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Precio (COP) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value.replace(/\D/g, ""))}
                onFocus={(e) => setPriceInput(e.target.value.replace(/\D/g, ""))}
                onBlur={commitPrice}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Stock Físico *
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={stockInput}
                onChange={(e) => setStockInput(e.target.value.replace(/\D/g, ""))}
                onFocus={(e) => setStockInput(e.target.value.replace(/\D/g, ""))}
                onBlur={commitStock}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Estado Disponibilidad
              </label>
              <select
                value={availability}
                onChange={(e) =>
                  setAvailability(e.target.value as AvailabilityStatus)
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium"
              >
                <option value="in_stock">Disponible (En Stock)</option>
                <option value="international">Envío Internacional</option>
                <option value="on_order">Bajo Pedido</option>
              </select>
            </div>
          </div>

          {/* Tax Configuration & Live Calculation Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 font-mono">
              <Percent className="w-4 h-4 text-[#E60012]" />
              <span>CONFIGURACIÓN DE IMPUESTO (IVA 19%)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Switch 1: Taxable */}
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    ¿Aplica Impuesto (IVA 19%)?
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Si está activo, genera impuesto legal
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={taxable}
                    onChange={(e) => setTaxable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E60012]"></div>
                </label>
              </div>

              {/* Switch 2: Price Includes Tax */}
              <div
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  !taxable
                    ? "opacity-50 pointer-events-none bg-slate-100 border-slate-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    ¿El Precio YA Incluye Impuesto?
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {priceIncludesTax
                      ? "Impuesto Incluido (Fórmula /1.19)"
                      : "Impuesto Adicional (+19% al total)"}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    disabled={!taxable}
                    checked={priceIncludesTax}
                    onChange={(e) => setPriceIncludesTax(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E60012]"></div>
                </label>
              </div>
            </div>

            {/* Live Calculation Preview Card */}
            <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-xl text-xs font-mono grid grid-cols-3 gap-2">
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-bold block">
                  BASE GRAVABLE:
                </span>
                <span className="font-bold text-slate-900">
                  $
                  {taxable
                    ? (priceIncludesTax
                        ? Math.round(price / 1.19)
                        : price
                      ).toLocaleString("es-CO")
                    : price.toLocaleString("es-CO")}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-bold block">
                  IVA 19%:
                </span>
                <span className="font-bold text-emerald-600">
                  {taxable
                    ? priceIncludesTax
                      ? `$${(price - Math.round(price / 1.19)).toLocaleString("es-CO")}`
                      : `+$${Math.round(price * 0.19).toLocaleString("es-CO")}`
                    : "$0 (EXENTO)"}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-bold block">
                  TOTAL CLIENTE:
                </span>
                <span className="font-black text-amber-600">
                  $
                  {taxable
                    ? priceIncludesTax
                      ? price.toLocaleString("es-CO")
                      : Math.round(price * 1.19).toLocaleString("es-CO")
                    : price.toLocaleString("es-CO")}
                </span>
              </div>
            </div>
          </div>

          {/* Image Gallery Dropzone */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono">
                Galería de Imágenes del Repuesto
              </label>
              <span className="text-[11px] font-mono text-slate-500 font-bold">
                {gallery.length}/{MAX_IMAGES}
              </span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFilesSelect(e.target.files);
                  e.target.value = "";
                }
              }}
              className="hidden"
            />

            {gallery.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {gallery.map((img, idx) => (
                  <div
                    key={idx}
                    className={`relative rounded-2xl border-2 overflow-hidden bg-slate-50 group ${
                      idx === 0
                        ? "border-[#E60012] ring-2 ring-[#E60012]/15"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="aspect-square w-full overflow-hidden">
                      <img
                        src={img}
                        alt={`Imagen ${idx + 1} del repuesto`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-[#E60012] text-white text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        Principal
                      </span>
                    )}

                    <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleReorder(idx, -1)}
                        disabled={idx === 0}
                        className="w-6 h-6 rounded-lg bg-white/95 border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center shadow-xs disabled:opacity-40"
                        title="Mover a la izquierda"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorder(idx, 1)}
                        disabled={idx === gallery.length - 1}
                        className="w-6 h-6 rounded-lg bg-white/95 border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center shadow-xs disabled:opacity-40"
                        title="Mover a la derecha"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(idx)}
                          className="w-6 h-6 rounded-lg bg-white/95 border border-slate-200 text-amber-600 hover:bg-amber-50 flex items-center justify-center shadow-xs"
                          title="Marcar como principal"
                        >
                          <Star className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="w-6 h-6 rounded-lg bg-white/95 border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center shadow-xs"
                        title="Eliminar imagen"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {gallery.length < MAX_IMAGES && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2.5 ${
                  isDragging
                    ? "border-[#E60012] bg-[#E60012]/5 scale-[0.99]"
                    : "border-slate-300 hover:border-[#E60012] hover:bg-slate-50/80 bg-slate-50/50"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs text-slate-500">
                  <UploadCloud className="w-6 h-6 text-[#E60012]" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">
                    {gallery.length === 0
                      ? "Haz clic o arrastra las fotos del repuesto aquí"
                      : "Agregar más imágenes"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    PNG, JPG, WEBP, SVG · Máx {MAX_IMAGES} imágenes · La primera
                    es la principal
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-[#E60012] text-white text-[11px] font-bold uppercase tracking-wider shadow-xs hover:bg-[#b5000b] transition-colors">
                  {gallery.length === 0 ? "Adjuntar Imágenes" : "Agregar Imágenes"}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
              Descripción del Repuesto
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles de aplicación, mantenimiento o especificaciones de fábrica..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium resize-none"
            />
          </div>

          {/* Technical Specs Builder */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-900 font-mono uppercase flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#E60012]" />
                  Especificaciones Técnicas
                </span>
                <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                  Precargadas desde configuración. Puedes editar valores, ordenar o agregar personalizadas solo para este repuesto.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[11px] font-mono text-slate-500 font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                  {specs.length} {specs.length === 1 ? "propiedad" : "propiedades"}
                </span>
                {configuredDefaultSpecs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetToDefaultSpecs}
                    className="text-[10px] font-mono font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    title="Restablecer a las especificaciones por defecto de la configuración"
                  >
                    <RotateCcw className="w-3 h-3 text-[#E60012]" />
                    <span>Cargar Plantillas</span>
                  </button>
                )}
              </div>
            </div>

            {/* Chips sugeridos rápidos de configuración que aún no están en este repuesto */}
            {configuredDefaultSpecs.length > 0 && (
              (() => {
                const missingDefaults = configuredDefaultSpecs.filter(
                  (def) => !specs.some((s) => s.label.toLowerCase() === def.label.toLowerCase())
                );
                if (missingDefaults.length === 0) return null;
                return (
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 font-sans">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Sugeridas de Configuración (pendientes por agregar):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {missingDefaults.map((def) => (
                        <button
                          key={def.label}
                          type="button"
                          onClick={() => handleAddSpec(def.label, def.defaultValue || "")}
                          className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:border-red-500 hover:text-[#E60012] hover:bg-red-50/50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title={`Agregar ${def.label} con valor sugerido "${def.defaultValue || 'Vacío'}"`}
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>{def.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()
            )}

            {/* Formulario para agregar una especificación personalizada a este repuesto */}
            <div className="flex gap-2">
              <input
                type="text"
                value={specLabel}
                onChange={(e) => setSpecLabel(e.target.value)}
                placeholder="Propiedad personalizada (ej. Material, Diámetro)"
                className="w-1/3 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#E60012]"
              />
              <input
                type="text"
                value={specValue}
                onChange={(e) => setSpecValue(e.target.value)}
                placeholder="Valor (ej. Sintético viscoso)"
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#E60012]"
              />
              <button
                type="button"
                onClick={() => handleAddSpec()}
                disabled={!specLabel.trim() && !specValue.trim()}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                title="Agregar especificación personalizada a este repuesto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Agregar</span>
              </button>
            </div>

            {/* Lista de especificaciones del repuesto con drag & drop y reorden */}
            <div className="space-y-1.5 pt-1">
              {specs.length === 0 ? (
                <div className="p-4 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  Sin especificaciones técnicas asignadas para este repuesto.
                </div>
              ) : (
                specs.map((sp, idx) => {
                  const isDefaultTemplate = configuredDefaultSpecs.some(
                    (d) => d.label.toLowerCase() === sp.label.toLowerCase()
                  );

                  return (
                    <div
                      key={idx}
                      draggable
                      onDragStart={(e) => handleSpecDragStart(e, idx)}
                      onDragOver={handleSpecDragOver}
                      onDrop={(e) => handleSpecDrop(e, idx)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl bg-white border text-xs shadow-2xs transition-all ${
                        draggedSpecIdx === idx
                          ? "opacity-50 border-dashed border-[#E60012] bg-red-50/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {/* Grip */}
                      <div
                        className="cursor-grab active:cursor-grabbing p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                        title="Arrastrar para reordenar"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>

                      {/* Number index */}
                      <span className="text-[10px] font-mono text-slate-400 font-bold w-4 text-center shrink-0">
                        {idx + 1}
                      </span>

                      {/* Label */}
                      <div className="w-1/3 relative">
                        <input
                          type="text"
                          value={sp.label}
                          onChange={(e) =>
                            handleUpdateSpec(idx, "label", e.target.value)
                          }
                          placeholder="Propiedad (ej. Origen)"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-[#E60012]"
                        />
                        {isDefaultTemplate && (
                          <span className="absolute right-1.5 top-2 w-1.5 h-1.5 rounded-full bg-emerald-500" title="Plantilla por defecto" />
                        )}
                      </div>

                      {/* Value */}
                      <div className="flex-1">
                        <input
                          type="text"
                          value={sp.value}
                          onChange={(e) =>
                            handleUpdateSpec(idx, "value", e.target.value)
                          }
                          placeholder="Valor (ej. Genuine Suzuki Parts - Japan)"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#E60012]"
                        />
                      </div>

                      {/* Move Up/Down Buttons */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSpec(idx, idx - 1)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="Mover arriba"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === specs.length - 1}
                          onClick={() => handleMoveSpec(idx, idx + 1)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="Mover abajo"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(idx)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                        title="Eliminar especificación de este repuesto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Model Compatibility Matrix Builder */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 font-mono">
                <Layers className="w-4 h-4 text-[#059669]" />
                <span>MATRIZ DE COMPATIBILIDAD CON MOTOS</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 font-bold">
                {compatibility.length} modelos vinculados
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-slate-200">
              <div className="sm:col-span-2">
                <SearchableModelSelect
                  models={models}
                  selectedModelId={selectedModelId}
                  onSelectModel={setSelectedModelId}
                  label="MODELO DE MOTO"
                  placeholder="Buscar modelo por nombre..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 mb-1">
                  Año Inicio
                </label>
                <input
                  type="number"
                  value={yearStart}
                  onChange={(e) => setYearStart(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 mb-1">
                  Año Fin
                </label>
                <input
                  type="number"
                  value={yearEnd}
                  onChange={(e) => setYearEnd(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={versionNote}
                  onChange={(e) => setVersionNote(e.target.value)}
                  placeholder="Nota de versión opcional (ej. Solo versión ABS)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900"
                />
              </div>

              <button
                type="button"
                onClick={handleAddCompatibility}
                className="w-full bg-[#059669] hover:bg-emerald-700 text-white rounded-lg text-xs font-bold py-1 flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Vincular
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              {compatibility.map((c, idx) => {
                const model = models.find((m) => m.id === c.modelId);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-display">
                        {model?.name || c.modelId}
                      </span>
                      <span className="font-mono text-slate-500 font-bold">
                        ({c.yearStart} - {c.yearEnd})
                      </span>
                      {c.note && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono">
                          {c.note}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCompatibility(idx)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 md:px-8 py-5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading}
            className="px-6 py-2.5 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading
              ? "Subiendo imágenes..."
              : partToEdit
                ? "Guardar Cambios"
                : "Crear Repuesto"}
          </button>
        </div>
      </div>
    </div>
  );
};
