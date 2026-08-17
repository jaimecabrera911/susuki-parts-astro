import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Layers,
  Calendar,
  Plus,
  AlertCircle,
  Link,
  Unlink,
  Tag,
  Edit,
  Eye,
  UploadCloud,
  Trash2,
  Check,
} from "lucide-react";
import { FaMotorcycle } from "react-icons/fa";
import type { Brand, SuzukiModel, ExplodedDiagram } from "../../types";
import { fetchModelCategories, UPLOAD_IMAGE } from "../../services/api";

interface ModelDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (model: SuzukiModel) => void;
  modelToEdit: SuzukiModel | null;
  brands: Brand[];
  schematics: ExplodedDiagram[];
  onLinkSchematic: (schematicId: string, modelId: string) => void;
  onUnlinkSchematic: (schematicId: string, modelId: string) => void;
  onCreateSchematicForModel: (
    model: SuzukiModel,
    presetCategory?: string,
  ) => void;
  onEditSchematic?: (schematic: ExplodedDiagram) => void;
  onViewSchematic?: (schematic: ExplodedDiagram) => void;
  initialTab?: "data" | "schematics";
}

export const ModelDrawer: React.FC<ModelDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  modelToEdit,
  brands,
  schematics,
  onLinkSchematic,
  onUnlinkSchematic,
  onCreateSchematicForModel,
  onEditSchematic,
  onViewSchematic,
  initialTab = "data",
}) => {
  const [activeTab, setActiveTab] = useState<"data" | "schematics">(initialTab);

  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState("suzuki");
  const [category, setCategory] = useState(categoryOptions[0]);
  const [image, setImage] = useState("");
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [yearStart, setYearStart] = useState<number>();
  const [yearEnd, setYearEnd] = useState<number>();
  const [versionInput, setVersionInput] = useState("");
  const [versions, setVersions] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState("");
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
    setError("");
    setPendingImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const [schematicToLinkSelect, setSchematicToLinkSelect] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchModelCategories()
      .then((rows) => {
        if (cancelled) return;
        const names = (rows || [])
          .filter((c: any) => c.active !== false)
          .map((c: any) => c.name);
        setCategoryOptions(names);
      })
      .catch(() => {
        if (!cancelled) setCategoryOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Once categories are loaded, default an empty category to the first DB option
  useEffect(() => {
    if (categoryOptions.length === 0) return;
    if (!category) setCategory(categoryOptions[0]);
  }, [categoryOptions]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (modelToEdit) {
      setName(modelToEdit.name);
      setBrandId(modelToEdit.brandId || "suzuki");
      setCategory(modelToEdit.category || categoryOptions[0]);
      setImage(modelToEdit.image || "");

      const yrs = modelToEdit.years || [2020];
      setYearStart(Math.min(...yrs));
      setYearEnd(Math.max(...yrs));

      setVersions(modelToEdit.versions || []);
      setActive(modelToEdit.active !== false);
      setNotes(modelToEdit.notes || "");
    } else {
      setName("");
      setBrandId("suzuki");
      setCategory(categoryOptions[0]);
      setImage("");
      setYearStart(2018);
      setYearEnd(2024);
      setVersions(["Standard"]);
      setActive(true);
      setNotes("Verificado con catálogo oficial OEM.");
    }
    setPendingImageFile(null);
    setUploadingImage(false);
    setError("");
  }, [modelToEdit, isOpen]);

  // Filter schematics linked to this model
  const currentModelId = modelToEdit?.id || "";
  const linkedSchematics = useMemo(() => {
    return schematics.filter(
      (s) =>
        s.applicableModelIds && s.applicableModelIds.includes(currentModelId),
    );
  }, [schematics, currentModelId]);

  const unlinkedSchematics = useMemo(() => {
    return schematics.filter(
      (s) =>
        !s.applicableModelIds || !s.applicableModelIds.includes(currentModelId),
    );
  }, [schematics, currentModelId]);

  // Group linked schematics by Category / Section
  const groupedLinkedSchematics = useMemo(() => {
    const map = new Map<string, ExplodedDiagram[]>();
    linkedSchematics.forEach((s) => {
      const cat = s.category || s.section || "";
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(s);
    });
    return Array.from(map.entries()).map(([catName, list]) => ({
      categoryName: catName,
      schematicsList: list,
    }));
  }, [linkedSchematics]);

  // Group unlinked schematics by Category for optgroup dropdown
  const groupedUnlinkedSchematics = useMemo(() => {
    const map = new Map<string, ExplodedDiagram[]>();
    unlinkedSchematics.forEach((s) => {
      const cat = s.category || s.section || "";
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(s);
    });
    return Array.from(map.entries());
  }, [unlinkedSchematics]);

  if (!isOpen) return null;

  const handleAddVersion = () => {
    const trimmed = versionInput.trim();
    if (trimmed && !versions.includes(trimmed)) {
      setVersions([...versions, trimmed]);
      setVersionInput("");
    }
  };

  const handleRemoveVersion = (ver: string) => {
    setVersions(versions.filter((v) => v !== ver));
  };

  const handleLinkSelectSubmit = () => {
    if (schematicToLinkSelect && currentModelId) {
      onLinkSchematic(schematicToLinkSelect, currentModelId);
      setSchematicToLinkSelect("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del modelo es obligatorio.");
      return;
    }

    if (!yearStart || !yearEnd) {
      setError("El año inicial y el año final son obligatorios.");
      return;
    }

    if (yearStart > yearEnd) {
      setError("El año inicial no puede ser mayor al año final.");
      return;
    }

    let finalImage = image.trim();
    if (pendingImageFile) {
      setUploadingImage(true);
      try {
        const result = await UPLOAD_IMAGE(pendingImageFile, "models");
        finalImage = result.url;
      } catch (err: any) {
        setError(
          err?.message || "No se pudo subir la foto del modelo al almacenamiento.",
        );
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

    const yearsArray: number[] = [];
    for (let y = yearStart; y <= yearEnd; y++) {
      yearsArray.push(y);
    }

    const modelId = modelToEdit
      ? modelToEdit.id
      : name
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");

    const newModel: SuzukiModel = {
      id: modelId,
      brandId,
      name: name.trim(),
      category,
      image:
        finalImage ||
        "https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/models/default.jpg",
      years: yearsArray,
      versions: versions.length > 0 ? versions : ["Standard"],
      active,
      notes: notes.trim(),
    };

    onSave(newModel);
    onClose();
  };

  return (
    <div id="model-drawer" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-[95vw] md:max-w-4xl lg:max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 md:px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#059669] border border-emerald-200 flex items-center justify-center shadow-xs">
              <FaMotorcycle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 font-display tracking-tight">
                {modelToEdit
                  ? `Modelo: ${modelToEdit.name}`
                  : "Nuevo Modelo de Moto"}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {modelToEdit
                  ? `ID: ${modelToEdit.id} • ${linkedSchematics.length} despieces vinculados`
                  : "Especificaciones de compatibilidad OEM"}
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

        {/* Multi-Tab Navigation Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 md:px-8 pt-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("data")}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 font-mono transition-all ${
              activeTab === "data"
                ? "border-[#E60012] text-[#E60012] bg-white rounded-t-2xl border-t border-x border-slate-200 shadow-xs"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            1. Datos del Modelo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("schematics")}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 font-mono transition-all flex items-center gap-2 ${
              activeTab === "schematics"
                ? "border-[#E60012] text-[#E60012] bg-white rounded-t-2xl border-t border-x border-slate-200 shadow-xs"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Despieces por Categoría ({linkedSchematics.length})</span>
          </button>
        </div>

        {/* Modal Body Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar"
        >
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-[#dc2626] text-xs flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-6">
              {/* Model Name & Brand */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                    Nombre del Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. GSX-R1000, V-Strom 650"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                    Marca Asignada *
                  </label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} {!b.active ? "(Inactiva)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                  Categoría de Motocicleta
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium"
                >
                  {categoryOptions.length === 0 && (
                    <option value="" disabled>
                      Cargando categorías...
                    </option>
                  )}
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Range */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 font-mono">
                  <Calendar className="w-4 h-4 text-[#059669]" />
                  <span>RANGO DE AÑOS COMPATIBLES</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-mono">
                      Año Inicial
                    </label>
                    <input
                      type="number"
                      min="1980"
                      max="2030"
                      value={yearStart}
                      onChange={(e) => setYearStart(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-mono">
                      Año Final
                    </label>
                    <input
                      type="number"
                      min="1980"
                      max="2030"
                      value={yearEnd}
                      onChange={(e) => setYearEnd(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Versions tags */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 font-mono">
                  <Layers className="w-4 h-4 text-[#059669]" />
                  <span>VERSIONES Y EDICIONES</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={versionInput}
                    onChange={(e) => setVersionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddVersion();
                      }
                    }}
                    placeholder="Ej. ABS Disco Doble, FI"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddVersion}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {versions.map((ver) => (
                    <span
                      key={ver}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-800 font-medium shadow-xs"
                    >
                      <span>{ver}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVersion(ver)}
                        className="text-slate-400 hover:text-red-600 font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Image File Attachment Dropzone */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                  Imagen de la Motocicleta
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {image ? (
                  <div className="relative p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-32 h-24 rounded-xl bg-white border border-slate-200 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      <img
                        src={image}
                        alt="Vista previa del modelo"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <p className="text-xs font-black text-slate-900 flex items-center gap-1.5 justify-center sm:justify-start">
                        <Check className="w-4 h-4 text-emerald-600" />
                        Imagen Adjuntada Correctamente
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                        {image.startsWith("data:")
                          ? "Archivo local adjuntado (Data URL)"
                          : image}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
                        >
                          Cambiar Imagen
                        </button>
                        <button
                          type="button"
                          onClick={() => setImage("")}
                          className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
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
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs text-slate-500 group-hover:text-[#E60012]">
                      <UploadCloud className="w-6 h-6 text-[#E60012]" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">
                        Haz clic o arrastra la foto de la moto aquí
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Formatos soportados: PNG, JPG, WEBP, SVG
                      </p>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-[#E60012] text-white text-[11px] font-bold uppercase tracking-wider shadow-xs hover:bg-[#b5000b] transition-colors">
                      Adjuntar Imagen
                    </span>
                  </div>
                )}
              </div>

              {/* Technical Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                  Notas Técnicas de Compatibilidad
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instrucciones para mecánicos y clientes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium resize-none"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Estado del Modelo
                  </p>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Activa o desactiva la selección en el selector de garaje.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                    active ? "bg-[#059669]" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      active ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SCHEMATICS GROUPED BY CATEGORIES FOR THIS MODEL */}
          {activeTab === "schematics" && (
            <div className="space-y-6">
              {/* Action Banner: Create New Schematic for this Model */}
              <div className="p-4 md:p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase font-mono tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#d97706]" />
                    ¿Necesitas un nuevo diagrama para {name || "este modelo"}?
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Crea un despiece desde cero en el lienzo interactivo con
                    este modelo asignado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (modelToEdit) {
                      onCreateSchematicForModel(modelToEdit);
                    } else {
                      setError(
                        "Primero debes guardar los datos del modelo antes de crearle despieces.",
                      );
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Nuevo Despiece</span>
                </button>
              </div>

              {/* Link Existing Schematics Control (Grouped by Category) */}
              {modelToEdit && unlinkedSchematics.length > 0 && (
                <div className="p-4 md:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 font-mono uppercase">
                    <Link className="w-4 h-4 text-[#0A3088]" />
                    <span>
                      Vincular Despiece Existente (Organizado por Categoría)
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={schematicToLinkSelect}
                      onChange={(e) => setSchematicToLinkSelect(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium"
                    >
                      <option value="">
                        Selecciona un despiece para vincular a {name}...
                      </option>
                      {groupedUnlinkedSchematics.map(([catGroup, items]) => (
                        <optgroup
                          key={catGroup}
                          label={`📁 ${catGroup.toUpperCase()}`}
                        >
                          {items.map((s) => (
                            <option key={s.id} value={s.id}>
                              [{s.section}] {s.title}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleLinkSelectSubmit}
                      disabled={!schematicToLinkSelect}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Vincular</span>
                    </button>
                  </div>
                </div>
              )}

              {/* List of Schematics Grouped by Categories */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 font-mono uppercase">
                    Despieces Asignados a {name || "este modelo"} (
                    {linkedSchematics.length})
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 font-bold">
                    Organizados en {groupedLinkedSchematics.length} categorías
                  </span>
                </div>

                {groupedLinkedSchematics.map(
                  ({ categoryName, schematicsList }) => (
                    <div
                      key={categoryName}
                      className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                    >
                      {/* Category Header with Add Schematic to Category Button */}
                      <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-100 gap-2">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-[#0A3088]" />
                          <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider font-mono">
                            {categoryName}
                          </h4>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0A3088] border border-blue-200">
                            {schematicsList.length}{" "}
                            {schematicsList.length === 1
                              ? "diagrama"
                              : "diagramas"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (modelToEdit) {
                              onCreateSchematicForModel(
                                modelToEdit,
                                categoryName,
                              );
                            }
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-50 text-[#E60012] border border-red-200 hover:bg-[#E60012] hover:text-white transition-all flex items-center gap-1 shadow-xs"
                          title={`Agregar nuevo despiece a ${categoryName}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar</span>
                        </button>
                      </div>

                      {/* Schematics Grid inside this Category */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {schematicsList.map((schematic) => (
                          <div
                            key={schematic.id}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0">
                                {schematic.diagramImage ? (
                                  <img
                                    src={schematic.diagramImage}
                                    alt={schematic.title}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <Layers className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-slate-900 text-xs truncate font-display">
                                  {schematic.title}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono font-bold text-slate-600 uppercase">
                                    {schematic.section}
                                  </span>
                                  <span className="text-[10px] font-mono text-emerald-700 font-bold">
                                    {schematic.hotspots?.length || 0} puntos
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {onEditSchematic && (
                                <button
                                  type="button"
                                  onClick={() => onEditSchematic(schematic)}
                                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl border border-slate-200 shadow-xs transition-colors"
                                  title="Editar despiece y gestionar puntos hotspot"
                                >
                                  <Edit className="w-4 h-4 text-[#0A3088]" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  if (onViewSchematic) {
                                    onViewSchematic(schematic);
                                  } else {
                                    window.open(
                                      `/despieces?schematic=${schematic.id}`,
                                      "_blank",
                                    );
                                  }
                                }}
                                className="p-2 text-slate-500 hover:text-[#059669] hover:bg-white rounded-xl border border-slate-200 shadow-xs transition-colors"
                                title="Ver despiece interactivo"
                              >
                                <Eye className="w-4 h-4 text-[#059669]" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (currentModelId) {
                                    onUnlinkSchematic(
                                      schematic.id,
                                      currentModelId,
                                    );
                                  }
                                }}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl border border-slate-200 shadow-xs transition-colors"
                                title="Desvincular de esta moto"
                              >
                                <Unlink className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}

                {linkedSchematics.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 p-6">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 text-xs">
                      No hay despieces asignados a este modelo
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Usa el selector superior para vincular despieces
                      existentes por categoría o crear uno nuevo.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer Actions */}
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
            disabled={uploadingImage}
            className="px-6 py-2.5 rounded-xl bg-[#E60012] hover:bg-[#b5000b] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all flex items-center gap-2"
          >
            {uploadingImage ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Subiendo foto...</span>
              </>
            ) : (
              modelToEdit ? "Guardar Cambios" : "Crear Modelo"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
