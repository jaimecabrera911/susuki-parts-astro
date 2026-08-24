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
  Eye,
  EyeOff,
  Palette,
  Check,
  Image as ImageIcon,
  ArrowRightLeft,
  Ruler,
  ShieldCheck,
  Tag,
} from "lucide-react";
import type {
  SuzukiPart,
  SuzukiModel,
  AvailabilityStatus,
  TechnicalSpec,
  CompatibilityRule,
  Category,
  PartVariant,
  PartVariantType,
  VariantAttributeValue,
} from "../../types";
import { VARIANT_TYPE_LABELS, getVariantTypeLabel, formatVariantAttributes } from "../../types";
import { SearchableModelSelect } from "../SearchableModelSelect";
import { UPLOAD_IMAGE } from "../../services/api";
import { useSiteSettings } from "../SiteSettingsProvider";
import { formatThousands } from "../../utils/formatCurrency";

interface PartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (part: SuzukiPart) => Promise<any> | void;
  partToEdit: SuzukiPart | null;
  models: SuzukiModel[];
  categories: Category[];
  initialData?: Partial<SuzukiPart> | null;
  zIndex?: string;
}

interface VariantAxisDef {
  id: string;
  name: string;
  type: PartVariantType;
  options: Array<{ value: string; code?: string; hex?: string }>;
}

const extractAxesFromVariants = (
  vars: PartVariant[],
): VariantAxisDef[] => {
  const axesMap = new Map<
    string,
    {
      type: PartVariantType;
      optionsMap: Map<string, { value: string; code?: string; hex?: string }>;
    }
  >();

  for (const v of vars) {
    if (Array.isArray(v.attributes) && v.attributes.length > 0) {
      for (const attr of v.attributes) {
        if (!axesMap.has(attr.name)) {
          let aType: PartVariantType = "custom";
          const n = attr.name.toLowerCase();
          if (n.includes("color")) aType = "color";
          else if (n.includes("lado") || n.includes("posic")) aType = "side";
          else if (
            n.includes("medida") ||
            n.includes("calibre") ||
            n.includes("sobre")
          )
            aType = "size";
          else if (n.includes("material") || n.includes("compuesto"))
            aType = "material";
          else if (n.includes("acabado") || n.includes("tratamiento"))
            aType = "finish";

          axesMap.set(attr.name, { type: aType, optionsMap: new Map() });
        }
        const axis = axesMap.get(attr.name)!;
        if (!axis.optionsMap.has(attr.value)) {
          axis.optionsMap.set(attr.value, {
            value: attr.value,
            code: attr.code || undefined,
            hex: attr.hex || undefined,
          });
        }
      }
    }
  }

  if (axesMap.size === 0) {
    return [
      {
        id: "1",
        name: "Lado / Posición",
        type: "side",
        options: [
          { value: "Izquierdo (LH)", code: "LH" },
          { value: "Derecho (RH)", code: "RH" },
        ],
      },
      {
        id: "2",
        name: "Color OEM",
        type: "color",
        options: [
          { value: "Azul Suzuki Triton", code: "YSF", hex: "#0045A5" },
          { value: "Negro Sparkle Black", code: "YVB", hex: "#1C1D21" },
        ],
      },
    ];
  }

  return Array.from(axesMap.entries()).map(([name, data], idx) => ({
    id: String(idx + 1),
    name,
    type: data.type,
    options: Array.from(data.optionsMap.values()),
  }));
};

export const PartDrawer: React.FC<PartDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  partToEdit,
  models,
  categories,
  initialData,
  zIndex,
}) => {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [primaryOem, setPrimaryOem] = useState("");
  const [secondaryOems, setSecondaryOems] = useState<string[]>([]);
  const [secondaryOemInput, setSecondaryOemInput] = useState("");
  const [category, setCategory] = useState<string>("");
  const [price, setPrice] = useState<number>(50000);
  const [cost, setCost] = useState<number>(0);
  const [taxable, setTaxable] = useState<boolean>(true);
  const [priceIncludesTax, setPriceIncludesTax] = useState<boolean>(false);
  const [stock, setStock] = useState<number>(10);
  const [priceInput, setPriceInput] = useState<string>(formatThousands(50000));
  const [costInput, setCostInput] = useState<string>(formatThousands(0));
  const [stockInput, setStockInput] = useState<string>(formatThousands(10));
  const [availability, setAvailability] =
    useState<AvailabilityStatus>("in_stock");
  const [leadTimeMinDays, setLeadTimeMinDays] = useState<number | ''>('');
  const [leadTimeMaxDays, setLeadTimeMaxDays] = useState<number | ''>('');
  const [active, setActive] = useState<boolean>(true);
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

  // Variants & Colors List (Optional)
  const [hasVariants, setHasVariants] = useState<boolean>(false);
  const [variantMode, setVariantMode] = useState<"simple" | "matrix">("simple");
  const [primaryVariantType, setPrimaryVariantType] = useState<PartVariantType>("color");
  const [variants, setVariants] = useState<PartVariant[]>([]);

  // Multi-Attribute Matrix Axes State
  const [axes, setAxes] = useState<
    Array<{
      id: string;
      name: string;
      type: PartVariantType;
      options: Array<{ value: string; code?: string; hex?: string }>;
    }>
  >([
    {
      id: "1",
      name: "Lado / Posición",
      type: "side",
      options: [
        { value: "Izquierdo (LH)", code: "LH" },
        { value: "Derecho (RH)", code: "RH" },
      ],
    },
    {
      id: "2",
      name: "Color OEM",
      type: "color",
      options: [
        { value: "Azul Suzuki Triton", code: "YSF", hex: "#0045A5" },
        { value: "Negro Sparkle Black", code: "YVB", hex: "#1C1D21" },
      ],
    },
  ]);
  const [axisInputs, setAxisInputs] = useState<Record<string, string>>({});

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
      setCost(partToEdit.cost || 0);
      setTaxable(partToEdit.taxable !== false);
      setPriceIncludesTax(partToEdit.priceIncludesTax === true);
      setStock(partToEdit.stock);
      setAvailability(
        partToEdit.availability ||
          (partToEdit.stock > 0 ? "in_stock" : "on_order"),
      );
      setLeadTimeMinDays(partToEdit.leadTimeMinDays ?? '');
      setLeadTimeMaxDays(partToEdit.leadTimeMaxDays ?? '');
      setActive(partToEdit.active !== false);
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
      const existingVariants = partToEdit.variants || [];
      setVariants(existingVariants);
      setHasVariants(existingVariants.length > 0);
      if (existingVariants.length > 0) {
        const isMulti = existingVariants.some(
          (v) => Array.isArray(v.attributes) && v.attributes.length > 1
        );
        if (isMulti) {
          setVariantMode("matrix");
          setAxes(extractAxesFromVariants(existingVariants));
        } else {
          setVariantMode("simple");
          setPrimaryVariantType(
            (existingVariants[0].variantType as PartVariantType) || "color"
          );
        }
      }
    } else if (initialData) {
      setSku(initialData.sku || "");
      setName(initialData.name || "");
      const [p, ...sec] = initialData.oemNumbers || [];
      setPrimaryOem(p || "");
      setSecondaryOems(sec || []);
      setSecondaryOemInput("");
      const defaultSlug = initialData.category || categories[0]?.slug || "";
      setCategory(defaultSlug);
      setPrice(initialData.price ?? 50000);
      setCost(initialData.cost ?? 0);
      setTaxable(initialData.taxable !== false);
      setPriceIncludesTax(initialData.priceIncludesTax === true);
      setStock(initialData.stock ?? 10);
      setAvailability(
        initialData.availability ||
          ((initialData.stock ?? 10) > 0 ? "in_stock" : "on_order"),
      );
      setLeadTimeMinDays(initialData.leadTimeMinDays ?? '');
      setLeadTimeMaxDays(initialData.leadTimeMaxDays ?? '');
      setActive(initialData.active !== false);
      setGallery(
        initialData.images && initialData.images.length > 0
          ? initialData.images
          : initialData.image
            ? [initialData.image]
            : [],
      );
      setDescription(initialData.description || "");
      const initialSpecs =
        initialData.specs && initialData.specs.length > 0
          ? initialData.specs
          : configuredDefaultSpecs.length > 0
            ? configuredDefaultSpecs.map((d) => ({
                label: d.label,
                value: d.defaultValue || "",
              }))
            : [];
      setSpecs(initialSpecs);
      setCompatibility(initialData.compatibility || []);
      const existingVariants = initialData.variants || [];
      setVariants(existingVariants);
      setHasVariants(existingVariants.length > 0);
      if (existingVariants.length > 0) {
        const isMulti = existingVariants.some(
          (v) => Array.isArray(v.attributes) && v.attributes.length > 1
        );
        if (isMulti) {
          setVariantMode("matrix");
          setAxes(extractAxesFromVariants(existingVariants));
        } else {
          setVariantMode("simple");
          setPrimaryVariantType(
            (existingVariants[0].variantType as PartVariantType) || "color"
          );
        }
      }
    } else {
      setSku("");
      setName("");
      setPrimaryOem("");
      setSecondaryOems([]);
      setSecondaryOemInput("");
      const defaultSlug = categories[0]?.slug || "";
      setCategory(defaultSlug);
      setPrice(0);
      setCost(0);
      setTaxable(true);
      setPriceIncludesTax(false);
      setStock(0);
      setAvailability("in_stock");
      setLeadTimeMinDays('');
      setLeadTimeMaxDays('');
      setActive(true);
      setGallery([]);
      setDescription("");
      const initialSpecs =
        configuredDefaultSpecs.length > 0
          ? configuredDefaultSpecs.map((d) => ({
              label: d.label,
              value: d.defaultValue || "",
            }))
          : [];
      setSpecs(initialSpecs);
      setCompatibility([]);
      setVariants([]);
      setHasVariants(false);
      setVariantMode("simple");
      setPrimaryVariantType("color");
    }
    setError("");
  }, [partToEdit, initialData, isOpen, configuredDefaultSpecs.length, categories]);

  useEffect(() => {
    setPriceInput(formatThousands(price));
  }, [price]);

  useEffect(() => {
    setCostInput(formatThousands(cost));
  }, [cost]);

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

  const commitCost = () => {
    const digits = costInput.replace(/\D/g, "");
    if (digits === "") {
      setCostInput(formatThousands(cost));
      return;
    }
    setCost(Math.max(0, Number(digits)));
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
      setSpecs([...specs, { label: l, value: v }]);
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

  const VARIANT_PRESETS: Record<
    string,
    {
      label: string;
      icon: any;
      prompt: string;
      items: Array<{ name: string; code?: string; hex?: string }>;
    }
  > = {
    color: {
      label: "Color / Pintura OEM",
      icon: Palette,
      prompt: "Colores OEM Suzuki Populares:",
      items: [
        { name: "Azul Suzuki Triton", code: "YSF", hex: "#0045A5" },
        { name: "Negro Sparkle Black", code: "YVB", hex: "#1C1D21" },
        { name: "Blanco Pearl Glacier", code: "YWW", hex: "#F0F2F5" },
        { name: "Rojo Candy Daring", code: "YYG", hex: "#BA0C2F" },
        { name: "Gris Metallic Mat", code: "QT8", hex: "#585C61" },
        { name: "Amarillo Champion", code: "YU1", hex: "#FFC72C" },
        { name: "Negro Mate Titan", code: "YKV", hex: "#2B2B2B" },
        { name: "Azul Pearl Vigor", code: "YBB", hex: "#002B49" },
      ],
    },
    side: {
      label: "Lado / Posición",
      icon: ArrowRightLeft,
      prompt: "Posiciones Habituales:",
      items: [
        { name: "Izquierdo (LH)", code: "LH" },
        { name: "Derecho (RH)", code: "RH" },
        { name: "Delantero (FR)", code: "FR" },
        { name: "Trasero (RR)", code: "RR" },
        { name: "Juego Par (L+R)", code: "PAIR" },
      ],
    },
    size: {
      label: "Medida / Sobremedida",
      icon: Ruler,
      prompt: "Calibres y Medidas (Pistón / Anillos / Guayas):",
      items: [
        { name: "Estándar (STD)", code: "STD" },
        { name: "Sobremedida +0.25 mm", code: "025" },
        { name: "Sobremedida +0.50 mm", code: "050" },
        { name: "Sobremedida +0.75 mm", code: "075" },
        { name: "Sobremedida +1.00 mm", code: "100" },
      ],
    },
    material: {
      label: "Material / Compuesto",
      icon: ShieldCheck,
      prompt: "Compuestos de Fricción y Empaques:",
      items: [
        { name: "Sinterizado / Cerámica", code: "SINT" },
        { name: "Semimetálico", code: "SMET" },
        { name: "Orgánico / Kevlar", code: "ORG" },
        { name: "Cobre / Grafito", code: "COPR" },
        { name: "Acero Inoxidable", code: "SS" },
        { name: "Fibra de Carbono", code: "CARB" },
      ],
    },
    finish: {
      label: "Acabado / Tratamiento",
      icon: Sparkles,
      prompt: "Acabados y Tratamientos:",
      items: [
        { name: "Negro Mate", code: "MAT", hex: "#2B2B2B" },
        { name: "Negro Brillante", code: "GLS", hex: "#111111" },
        { name: "Cromado Espejo", code: "CHR", hex: "#E2E8F0" },
        { name: "Aluminio Anodizado", code: "AND", hex: "#94A3B8" },
        { name: "Titanio Burned", code: "TIT", hex: "#475569" },
      ],
    },
    custom: {
      label: "Personalizado / Otro",
      icon: Tag,
      prompt: "Variación Libre:",
      items: [],
    },
  };

  const handleAddVariant = (custom?: Partial<PartVariant>) => {
    const vType = custom?.variantType || primaryVariantType || "color";
    const baseSku = primaryOem.trim() || sku.trim() || "VAR";
    const suffix = custom?.colorCode ? `-${custom.colorCode}` : "";
    const name = custom?.name || "";
    const attrs: VariantAttributeValue[] =
      custom?.attributes ||
      (name
        ? [
            {
              name: getVariantTypeLabel(vType),
              value: name,
              code: custom?.colorCode || null,
              hex: custom?.colorHex || null,
            },
          ]
        : []);

    const newVar: PartVariant = {
      id: crypto.randomUUID(),
      partId: partToEdit?.id || "",
      variantType: vType,
      name,
      colorCode: custom?.colorCode || null,
      colorHex: custom?.colorHex || (vType === "color" ? "#0045A5" : null),
      sku: custom?.sku || `${baseSku}${suffix}`,
      price: custom?.price !== undefined ? custom.price : null,
      cost: custom?.cost !== undefined ? custom.cost : 0,
      stock: custom?.stock !== undefined ? custom.stock : 5,
      stockReserved: 0,
      image: custom?.image || null,
      attributes: attrs,
      position: variants.length,
      active: custom?.active !== undefined ? custom.active : true,
    };
    setVariants((prev) => [...prev, newVar]);
  };

  const handleUpdateVariant = (
    index: number,
    field: keyof PartVariant,
    val: any,
  ) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveVariant = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= variants.length) return;
    setVariants((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy.map((v, i) => ({ ...v, position: i }));
    });
  };

  const handleVariantImageUpload = (index: number, file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Formato de imagen inválido.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        handleUpdateVariant(index, "image", e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Matrix Generator helpers
  const handleAddAxis = () => {
    const newId = String(axes.length + 1);
    setAxes([
      ...axes,
      {
        id: newId,
        name: `Atributo ${axes.length + 1}`,
        type: "custom",
        options: [],
      },
    ]);
  };

  const handleRemoveAxis = (axisId: string) => {
    if (axes.length <= 1) return;
    setAxes(axes.filter((a) => a.id !== axisId));
  };

  const handleUpdateAxis = (
    axisId: string,
    field: "name" | "type",
    val: any,
  ) => {
    setAxes(
      axes.map((a) => (a.id === axisId ? { ...a, [field]: val } : a)),
    );
  };

  const handleAddOptionToAxis = (
    axisId: string,
    opt: { value: string; code?: string; hex?: string },
  ) => {
    setAxes(
      axes.map((a) => {
        if (a.id === axisId) {
          const exists = a.options.some(
            (o) => o.value.toLowerCase() === opt.value.toLowerCase(),
          );
          if (exists) return a;
          return { ...a, options: [...a.options, opt] };
        }
        return a;
      }),
    );
  };

  const handleRemoveOptionFromAxis = (axisId: string, optIndex: number) => {
    setAxes(
      axes.map((a) => {
        if (a.id === axisId) {
          return {
            ...a,
            options: a.options.filter((_, i) => i !== optIndex),
          };
        }
        return a;
      }),
    );
  };

  const handleGenerateMatrixCombinations = () => {
    const validAxes = axes.filter(
      (a) => a.name.trim() && a.options.length > 0,
    );
    if (validAxes.length === 0) {
      setError("Configura al menos 1 eje con opciones para generar combinaciones.");
      return;
    }

    const helper = (
      depth: number,
      current: VariantAttributeValue[],
    ): Array<VariantAttributeValue[]> => {
      if (depth === validAxes.length) return [current];
      const axis = validAxes[depth];
      const result: Array<VariantAttributeValue[]> = [];
      for (const opt of axis.options) {
        result.push(
          ...helper(depth + 1, [
            ...current,
            {
              name: axis.name,
              value: opt.value,
              code: opt.code || null,
              hex: opt.hex || null,
            },
          ]),
        );
      }
      return result;
    };

    const combinations = helper(0, []);
    const baseSku = primaryOem.trim() || sku.trim() || "VAR";

    const newVariants: PartVariant[] = combinations.map((attrs, idx) => {
      const matchKey = attrs
        .map((a) => `${a.name}:${a.value}`)
        .sort()
        .join("|");

      const existing = variants.find((v) => {
        if (Array.isArray(v.attributes) && v.attributes.length > 0) {
          const vKey = v.attributes
            .map((a) => `${a.name}:${a.value}`)
            .sort()
            .join("|");
          return vKey === matchKey;
        }
        return false;
      });

      const comboName = attrs.map((a) => a.value).join(" - ");
      const codeSuffix = attrs
        .map((a) => a.code)
        .filter(Boolean)
        .join("-");
      const colorAttr = attrs.find((a) => a.hex);

      if (existing) {
        return {
          ...existing,
          name: comboName,
          attributes: attrs,
          position: idx,
          colorHex: colorAttr?.hex || existing.colorHex || null,
          colorCode: codeSuffix || existing.colorCode || null,
        };
      }

      return {
        id: crypto.randomUUID(),
        partId: partToEdit?.id || "",
        variantType: validAxes[0]?.type || "custom",
        name: comboName,
        colorCode: codeSuffix || null,
        colorHex: colorAttr?.hex || null,
        sku: `${baseSku}${codeSuffix ? `-${codeSuffix}` : `-${idx + 1}`}`,
        price: null,
        cost: 0,
        stock: 5,
        stockReserved: 0,
        image: null,
        attributes: attrs,
        position: idx,
        active: true,
      };
    });

    setVariants(newVariants);
    setError("");
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

    if (hasVariants && variants.length > 0) {
      const emptyVar = variants.find((v) => !v.name || !v.name.trim());
      if (emptyVar) {
        setError("Todas las variantes deben tener un nombre (ej. nombre del color).");
        return;
      }
    }

    const oemNumbers = [
      primaryOem.trim().toUpperCase(),
      ...secondaryOems.map((s) => s.trim().toUpperCase()).filter(Boolean),
    ];

    const partId = partToEdit ? partToEdit.id : crypto.randomUUID();

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
              return new File(
                [blob],
                `part-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`,
                { type: blob.type },
              );
            })();
            const result = await UPLOAD_IMAGE(file, "parts");
            return result.url;
          }
          return img;
        }),
      );

      // Upload any variant images if they are data URLs
      const processedVariants = hasVariants
        ? await Promise.all(
            variants.map(async (v) => {
              if (v.image && v.image.startsWith("data:")) {
                const dataUrl = v.image;
                const file = await (async () => {
                  const res = await fetch(dataUrl);
                  const blob = await res.blob();
                  const extMatch = dataUrl.match(/^data:image\/(\w+);/);
                  const ext = extMatch ? extMatch[1].replace("jpeg", "jpg") : "png";
                  return new File(
                    [blob],
                    `variant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`,
                    { type: blob.type },
                  );
                })();
                const result = await UPLOAD_IMAGE(file, "variants");
                return { ...v, image: result.url };
              }
              return v;
            })
          )
        : [];

      const newPart: SuzukiPart = {
        id: partId,
        sku: sku.trim().toUpperCase(),
        oemNumbers,
        name: name.trim(),
        category,
        price,
        cost,
        taxable,
        priceIncludesTax,
        stock,
        availability,
        leadTimeMinDays: leadTimeMinDays !== '' ? Number(leadTimeMinDays) : null,
        leadTimeMaxDays: leadTimeMaxDays !== '' ? Number(leadTimeMaxDays) : null,
        active,
        image: uploaded[0] || "",
        images: uploaded,
        description: description.trim(),
        specs: cleanedSpecs,
        compatibility,
        variants: processedVariants,
      };

      await onSave(newPart);
      onClose();
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar el repuesto.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      id="part-drawer"
      className={`fixed inset-0 ${zIndex || "z-50"} bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto`}
    >
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
                {partToEdit ? `ID: ${partToEdit.id}` : "Catálogo de Repuestos"}
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
                    <option
                      value={c.slug}
                      className="font-extrabold text-slate-900"
                    >
                      {c.name}
                    </option>
                    {c.subcategories?.map((sub) => (
                      <option
                        key={sub.id}
                        value={sub.slug}
                        className="text-slate-600"
                      >
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

          {/* Price, Cost, Stock & Availability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Precio Venta (COP) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={priceInput}
                onChange={(e) =>
                  setPriceInput(e.target.value.replace(/\D/g, ""))
                }
                onFocus={(e) =>
                  setPriceInput(e.target.value.replace(/\D/g, ""))
                }
                onBlur={commitPrice}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Costo Promedio (COP)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={costInput}
                onChange={(e) =>
                  setCostInput(e.target.value.replace(/\D/g, ""))
                }
                onFocus={(e) =>
                  setCostInput(e.target.value.replace(/\D/g, ""))
                }
                onBlur={commitCost}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
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
                onChange={(e) =>
                  setStockInput(e.target.value.replace(/\D/g, ""))
                }
                onFocus={(e) =>
                  setStockInput(e.target.value.replace(/\D/g, ""))
                }
                onBlur={commitStock}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Disponibilidad
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

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono flex items-center justify-between">
                <span>Tiempo de Despacho Específico (Opcional)</span>
                <span className="text-[10px] font-normal text-slate-400 font-sans">
                  Dejar vacío = usa config global de tienda
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 font-mono">Mínimo (días)</label>
                  <input
                    type="number" min={1} max={365}
                    value={leadTimeMinDays}
                    onChange={(e) => setLeadTimeMinDays(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ej. 5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 font-mono">Máximo (días)</label>
                  <input
                    type="number" min={1} max={365}
                    value={leadTimeMaxDays}
                    onChange={(e) => setLeadTimeMaxDays(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ej. 8"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-sans">
                Si se deja vacío, el repuesto usará automáticamente los días configurados en Ajustes &rarr; Envíos para {availability === 'in_stock' ? 'En Stock' : availability === 'international' ? 'Internacional' : 'Bajo Pedido'}.
              </p>
            </div>
          </div>

          {/* Visibility / Active Status Switch Card */}
          <div className={`p-4 rounded-2xl border transition-all ${active ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-100 border-slate-300'}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-300 text-slate-600'}`}>
                  {active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      ESTADO DEL REPUESTO:
                    </span>
                    <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-md ${active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                      {active ? 'Activo / Visible' : 'Inactivo / Oculto'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {active
                      ? 'El repuesto está visible para los clientes en el catálogo, buscador y compras públicas.'
                      : 'El repuesto está oculto del catálogo público y compras, pero permanece guardado en tu administración.'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
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
                  {gallery.length === 0
                    ? "Adjuntar Imágenes"
                    : "Agregar Imágenes"}
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
                  Precargadas desde configuración. Puedes editar valores,
                  ordenar o agregar personalizadas solo para este repuesto.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[11px] font-mono text-slate-500 font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                  {specs.length}{" "}
                  {specs.length === 1 ? "propiedad" : "propiedades"}
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
            {configuredDefaultSpecs.length > 0 &&
              (() => {
                const missingDefaults = configuredDefaultSpecs.filter(
                  (def) =>
                    !specs.some(
                      (s) => s.label.toLowerCase() === def.label.toLowerCase(),
                    ),
                );
                if (missingDefaults.length === 0) return null;
                return (
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 font-sans">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>
                        Sugeridas de Configuración (pendientes por agregar):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {missingDefaults.map((def) => (
                        <button
                          key={def.label}
                          type="button"
                          onClick={() =>
                            handleAddSpec(def.label, def.defaultValue || "")
                          }
                          className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:border-red-500 hover:text-[#E60012] hover:bg-red-50/50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title={`Agregar ${def.label} con valor sugerido "${def.defaultValue || "Vacío"}"`}
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>{def.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

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
                    (d) => d.label.toLowerCase() === sp.label.toLowerCase(),
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
                          <span
                            className="absolute right-1.5 top-2 w-1.5 h-1.5 rounded-full bg-emerald-500"
                            title="Plantilla por defecto"
                          />
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
                          placeholder="Valor (ej. Genuine Parts - Japan)"
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

          {/* Variants & Colors Section (Optional) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0A3088] flex items-center justify-center shrink-0">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      VARIACIONES Y COLORES (OPCIONAL)
                    </span>
                    {hasVariants && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-100 text-[#0A3088]">
                        {variants.length} {variants.length === 1 ? 'variante' : 'variantes'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                    Actívalo si esta pieza viene en diferentes colores, lados o medidas con stock o foto individual.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={hasVariants}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setHasVariants(checked);
                    if (checked && variants.length === 0) {
                      handleAddVariant({ name: 'Negro Sparkle Black', colorCode: 'YVB', colorHex: '#1C1D21' });
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0A3088]"></div>
              </label>
            </div>

            {hasVariants && (
              <div className="space-y-4 pt-2">
                {/* 0. Mode Switcher: Simple 1D vs Multi-Attribute Matrix */}
                <div className="flex items-center justify-between p-1 bg-slate-200/70 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setVariantMode("simple")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                      variantMode === "simple"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Variación Simple (1 Atributo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVariantMode("matrix")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      variantMode === "matrix"
                        ? "bg-[#0A3088] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Matriz Multi-Atributo (Lado + Color + ...)</span>
                  </button>
                </div>

                {variantMode === "simple" ? (
                  <>
                    {/* 1. Selector de Tipo Principal de Variante */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold font-mono text-slate-700 uppercase">
                          Tipo de Variación:
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Define el tipo de opción de este repuesto
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                        {(
                          [
                            { type: "color", label: "Color OEM", icon: Palette },
                            { type: "side", label: "Lado / Posición", icon: ArrowRightLeft },
                            { type: "size", label: "Medida (STD)", icon: Ruler },
                            { type: "material", label: "Material", icon: ShieldCheck },
                            { type: "finish", label: "Acabado", icon: Sparkles },
                            { type: "custom", label: "Personalizado", icon: Tag },
                          ] as const
                        ).map((t) => {
                          const IconComp = t.icon;
                          const isSelected = primaryVariantType === t.type;
                          return (
                            <button
                              key={t.type}
                              type="button"
                              onClick={() => {
                                setPrimaryVariantType(t.type);
                                if (variants.length > 0) {
                                  setVariants((prev) =>
                                    prev.map((v) => ({ ...v, variantType: t.type }))
                                  );
                                }
                              }}
                              className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer border ${
                                isSelected
                                  ? "bg-[#0A3088] text-white border-[#0A3088] shadow-xs"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                              }`}
                            >
                              <IconComp className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-500"}`} />
                              <span className="text-[11px] leading-tight text-center">{t.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Contextual Quick-Add Chips */}
                    {VARIANT_PRESETS[primaryVariantType]?.items.length > 0 && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 animate-in fade-in">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>{VARIANT_PRESETS[primaryVariantType].prompt} (Clic para agregar rápido):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {VARIANT_PRESETS[primaryVariantType].items.map((item) => {
                            const alreadyAdded = variants.some(
                              (v) =>
                                v.name.toLowerCase() === item.name.toLowerCase() ||
                                (item.code && (v.colorCode || "").toLowerCase() === item.code.toLowerCase())
                            );
                            return (
                              <button
                                key={item.name}
                                type="button"
                                disabled={alreadyAdded}
                                onClick={() =>
                                  handleAddVariant({
                                    variantType: primaryVariantType,
                                    name: item.name,
                                    colorCode: item.code,
                                    colorHex: item.hex || (primaryVariantType === "color" ? "#0045A5" : null),
                                  })
                                }
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                                  alreadyAdded
                                    ? "bg-slate-100 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed"
                                    : "bg-white text-slate-800 border-slate-300 hover:border-[#0A3088] hover:bg-blue-50/50 shadow-2xs"
                                }`}
                              >
                                {item.hex && (
                                  <span
                                    className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                                    style={{ backgroundColor: item.hex }}
                                  />
                                )}
                                <span>
                                  {item.name} {item.code ? `(${item.code})` : ""}
                                </span>
                                {alreadyAdded ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Plus className="w-3 h-3 text-slate-400" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* MATRIX BUILDER: Multi-Attribute Axes Definition */
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 font-display uppercase tracking-wider">
                          Ejes de Atributos para Combinar
                        </h4>
                        <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                          Define las dimensiones (ej. Eje 1 = Lado, Eje 2 = Color, Eje 3 = Acabado). El sistema generará todas las combinaciones automáticamente.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddAxis}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir Eje (3er / 4to Atributo)</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {axes.map((axis, axisIdx) => {
                        const currentInput = axisInputs[axis.id] || "";
                        return (
                          <div
                            key={axis.id}
                            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                <span className="w-5 h-5 rounded-full bg-[#0A3088] text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                                  {axisIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={axis.name}
                                  onChange={(e) =>
                                    handleUpdateAxis(axis.id, "name", e.target.value)
                                  }
                                  placeholder="Nombre del Atributo (ej. Lado, Color, Acabado)"
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold focus:border-[#0A3088] focus:outline-none"
                                />
                              </div>

                              <div className="flex items-center gap-2">
                                <select
                                  value={axis.type}
                                  onChange={(e) =>
                                    handleUpdateAxis(
                                      axis.id,
                                      "type",
                                      e.target.value as PartVariantType
                                    )
                                  }
                                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium focus:border-[#0A3088] focus:outline-none cursor-pointer"
                                >
                                  <option value="side">Lado / Posición</option>
                                  <option value="color">Color OEM</option>
                                  <option value="size">Medida / STD</option>
                                  <option value="material">Material</option>
                                  <option value="finish">Acabado</option>
                                  <option value="custom">Personalizado</option>
                                </select>

                                {axes.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAxis(axis.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Eliminar este eje de atributos"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Configured values tags */}
                            <div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
                              {axis.options.map((opt, optIdx) => (
                                <span
                                  key={optIdx}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 shadow-2xs"
                                >
                                  {opt.hex && (
                                    <span
                                      className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                                      style={{ backgroundColor: opt.hex }}
                                    />
                                  )}
                                  <span>
                                    {opt.value} {opt.code ? `(${opt.code})` : ""}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveOptionFromAxis(axis.id, optIdx)
                                    }
                                    className="text-slate-400 hover:text-red-500 ml-0.5"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}

                              {/* Inline add option */}
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={currentInput}
                                  onChange={(e) =>
                                    setAxisInputs((prev) => ({
                                      ...prev,
                                      [axis.id]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      if (currentInput.trim()) {
                                        handleAddOptionToAxis(axis.id, {
                                          value: currentInput.trim(),
                                        });
                                        setAxisInputs((prev) => ({
                                          ...prev,
                                          [axis.id]: "",
                                        }));
                                      }
                                    }
                                  }}
                                  placeholder="+ Nuevo valor (Enter)"
                                  className="bg-white border border-dashed border-slate-300 rounded-lg px-2 py-0.5 text-xs text-slate-700 w-36 focus:border-[#0A3088] focus:outline-none"
                                />
                                {currentInput.trim() && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleAddOptionToAxis(axis.id, {
                                        value: currentInput.trim(),
                                      });
                                      setAxisInputs((prev) => ({
                                        ...prev,
                                        [axis.id]: "",
                                      }));
                                    }}
                                    className="p-1 bg-[#0A3088] text-white rounded-md hover:bg-blue-800"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Preset chips for this axis */}
                            {VARIANT_PRESETS[axis.type]?.items.length > 0 && (
                              <div className="pt-1 flex flex-wrap gap-1 items-center">
                                <span className="text-[10px] text-slate-400 font-mono mr-1">
                                  Sugerencias rápidas:
                                </span>
                                {VARIANT_PRESETS[axis.type].items.map((item) => {
                                  const alreadyInAxis = axis.options.some(
                                    (o) =>
                                      o.value.toLowerCase() ===
                                      item.name.toLowerCase()
                                  );
                                  return (
                                    <button
                                      key={item.name}
                                      type="button"
                                      disabled={alreadyInAxis}
                                      onClick={() =>
                                        handleAddOptionToAxis(axis.id, {
                                          value: item.name,
                                          code: item.code,
                                          hex: item.hex,
                                        })
                                      }
                                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md border flex items-center gap-1 cursor-pointer transition-all ${
                                        alreadyInAxis
                                          ? "bg-slate-100 text-slate-400 border-slate-200 opacity-40 cursor-not-allowed"
                                          : "bg-white text-slate-700 border-slate-200 hover:border-[#0A3088] hover:bg-blue-50"
                                      }`}
                                    >
                                      {item.hex && (
                                        <span
                                          className="w-2 h-2 rounded-full border border-black/20 shrink-0"
                                          style={{ backgroundColor: item.hex }}
                                        />
                                      )}
                                      <span>
                                        {item.name} {item.code ? `(${item.code})` : ""}
                                      </span>
                                      {alreadyInAxis ? (
                                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                                      ) : (
                                        <Plus className="w-2.5 h-2.5 text-slate-400" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Generate Matrix CTA */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-600 font-mono">
                        Combinaciones posibles:{" "}
                        <strong className="text-[#0A3088] text-sm">
                          {axes.reduce(
                            (acc, a) =>
                              acc * Math.max(1, a.options.length),
                            1
                          )}{" "}
                          opciones
                        </strong>
                      </span>

                      <button
                        type="button"
                        onClick={handleGenerateMatrixCombinations}
                        className="px-4 py-2 bg-[#0A3088] hover:bg-blue-900 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>⚡ Generar Combinaciones (Matriz)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Variants Matrix Header */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold font-mono text-slate-700 uppercase">
                    Combinaciones Resultantes ({variants.length})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleAddVariant({ variantType: primaryVariantType })
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Fila Manual</span>
                  </button>
                </div>

                {/* 4. Variants Matrix Rows */}
                {variants.length === 0 ? (
                  <div className="p-6 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs">
                    No has agregado variantes. Haz clic en las sugerencias rápidas arriba o genera la matriz multidimensional.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {variants.map((v, idx) => {
                      const isColor =
                        v.variantType === "color" ||
                        primaryVariantType === "color" ||
                        Boolean(v.colorHex);
                      const hasMultiAttrs =
                        Array.isArray(v.attributes) && v.attributes.length > 0;

                      return (
                        <div
                          key={v.id || idx}
                          className={`p-3 rounded-2xl bg-white border transition-all space-y-3 ${
                            v.active
                              ? "border-slate-200 shadow-xs"
                              : "border-slate-200 opacity-60 bg-slate-50"
                          }`}
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                            {/* Visual Indicator & Name / Multi-Attribute Tags */}
                            <div className="sm:col-span-5 flex items-center gap-2">
                              {isColor ? (
                                <label
                                  className="relative cursor-pointer w-8 h-8 rounded-xl border-2 border-slate-300 overflow-hidden shrink-0 shadow-2xs"
                                  title="Seleccionar color visual"
                                >
                                  <input
                                    type="color"
                                    value={v.colorHex || "#0045A5"}
                                    onChange={(e) =>
                                      handleUpdateVariant(
                                        idx,
                                        "colorHex",
                                        e.target.value
                                      )
                                    }
                                    className="absolute -inset-2 w-12 h-12 cursor-pointer opacity-0"
                                  />
                                  <div
                                    className="w-full h-full"
                                    style={{
                                      backgroundColor: v.colorHex || "#0045A5",
                                    }}
                                  />
                                </label>
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs"
                                  title={getVariantTypeLabel(v.variantType)}
                                >
                                  {v.variantType === "side" ? (
                                    <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                                  ) : v.variantType === "size" ? (
                                    <Ruler className="w-4 h-4 text-amber-600" />
                                  ) : v.variantType === "material" ? (
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                  ) : v.variantType === "finish" ? (
                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                  ) : (
                                    <Tag className="w-4 h-4 text-slate-600" />
                                  )}
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                {hasMultiAttrs ? (
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap gap-1 items-center">
                                      {v.attributes!.map((attr, aIdx) => (
                                        <span
                                          key={aIdx}
                                          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 inline-flex items-center gap-1"
                                        >
                                          {attr.hex && (
                                            <span
                                              className="w-2 h-2 rounded-full border border-black/20 shrink-0"
                                              style={{
                                                backgroundColor: attr.hex,
                                              }}
                                            />
                                          )}
                                          <span>
                                            {attr.name}: {attr.value}
                                          </span>
                                        </span>
                                      ))}
                                    </div>
                                    <input
                                      type="text"
                                      value={v.name}
                                      onChange={(e) =>
                                        handleUpdateVariant(
                                          idx,
                                          "name",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Nombre descriptivo"
                                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-[#0A3088]"
                                    />
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    value={v.name}
                                    onChange={(e) =>
                                      handleUpdateVariant(
                                        idx,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    placeholder={
                                      isColor
                                        ? "Nombre (ej. Azul Triton)"
                                        : v.variantType === "side"
                                        ? "Lado (ej. Izquierdo LH)"
                                        : v.variantType === "size"
                                        ? "Medida (ej. STD o +0.25)"
                                        : v.variantType === "material"
                                        ? "Compuesto (ej. Sinterizado)"
                                        : "Nombre de variante"
                                    }
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-[#0A3088]"
                                  />
                                )}
                              </div>
                            </div>

                            {/* Suffix / Code & Specific SKU */}
                            <div className="sm:col-span-2 grid grid-cols-1 gap-1">
                              <input
                                type="text"
                                value={v.sku || ""}
                                onChange={(e) =>
                                  handleUpdateVariant(
                                    idx,
                                    "sku",
                                    e.target.value.toUpperCase()
                                  )
                                }
                                placeholder="OEM Variante"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-mono font-bold uppercase focus:bg-white focus:outline-none focus:border-[#0A3088]"
                                title="Código OEM específico de esta combinación"
                              />
                            </div>

                            {/* Stock & Custom Price */}
                            <div className="sm:col-span-3 grid grid-cols-2 gap-1.5">
                              <div>
                                <input
                                  type="number"
                                  min={0}
                                  value={v.stock}
                                  onChange={(e) =>
                                    handleUpdateVariant(
                                      idx,
                                      "stock",
                                      Math.max(
                                        0,
                                        parseInt(e.target.value) || 0
                                      )
                                    )
                                  }
                                  placeholder="Stock"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-[#0A3088]"
                                  title="Unidades disponibles de esta combinación"
                                />
                                <span className="text-[9px] text-slate-400 font-mono block pl-0.5">
                                  Stock Disp.
                                </span>
                              </div>
                              <div>
                                <input
                                  type="number"
                                  min={0}
                                  value={
                                    v.price !== null && v.price !== undefined
                                      ? v.price
                                      : ""
                                  }
                                  onChange={(e) =>
                                    handleUpdateVariant(
                                      idx,
                                      "price",
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value)
                                    )
                                  }
                                  placeholder={`$${price.toLocaleString("es-CO")}`}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-[#0A3088]"
                                  title="Precio opcional si difiere del precio base"
                                />
                                <span className="text-[9px] text-slate-400 font-mono block pl-0.5">
                                  Precio (Opc.)
                                </span>
                              </div>
                            </div>

                            {/* Controls & Image */}
                            <div className="sm:col-span-2 flex items-center justify-end gap-1">
                              {/* Variant image uploader */}
                              <label
                                className={`w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                                  v.image
                                    ? "border-[#0A3088] bg-blue-50"
                                    : "border-slate-300 hover:border-slate-400 bg-slate-100"
                                }`}
                                title={
                                  v.image
                                    ? "Foto cargada (clic para cambiar)"
                                    : "Cargar foto individual para esta variante"
                                }
                              >
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleVariantImageUpload(
                                        idx,
                                        e.target.files[0]
                                      );
                                      e.target.value = "";
                                    }
                                  }}
                                />
                                {v.image ? (
                                  <img
                                    src={v.image}
                                    alt={v.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                                )}
                              </label>

                              {/* Move Up/Down */}
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveVariant(idx, "up")}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                title="Mover arriba"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === variants.length - 1}
                                onClick={() => handleMoveVariant(idx, "down")}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                title="Mover abajo"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>

                              {/* Active switch */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateVariant(idx, "active", !v.active)
                                }
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                                  v.active
                                    ? "text-emerald-700 bg-emerald-50"
                                    : "text-slate-400 bg-slate-100"
                                }`}
                                title={
                                  v.active
                                    ? "Variante Activa"
                                    : "Variante Oculta"
                                }
                              >
                                {v.active ? "Act." : "Off"}
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(idx)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded"
                                title="Eliminar combinación"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
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
