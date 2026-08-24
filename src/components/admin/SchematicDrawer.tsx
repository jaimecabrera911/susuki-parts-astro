import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Layers,
  Plus,
  Trash2,
  AlertCircle,
  Image as ImageIcon,
  Crosshair,
  Package,
  CheckCircle2,
  Eye,
  Edit,
  Move,
  UploadCloud,
  Check,
  Clipboard,
  Link2,
  Sparkles,
  RefreshCw,
  FileImage,
} from "lucide-react";
import type { ExplodedDiagram, SuzukiPart, SuzukiModel, Category } from "../../types";
import { SearchableModelMultiSelect } from "./SearchableModelMultiSelect";
import { SearchablePartSelect } from "./SearchablePartSelect";
import { PartDrawer } from "./PartDrawer";
import { UPLOAD_IMAGE } from "../../services/api";

interface SchematicDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schematic: ExplodedDiagram) => void;
  schematicToEdit: ExplodedDiagram | null;
  models: SuzukiModel[];
  parts: SuzukiPart[];
  categories?: Category[];
  onSavePart?: (part: SuzukiPart) => Promise<void> | void;
}

export const SchematicDrawer: React.FC<SchematicDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  schematicToEdit,
  models,
  parts,
  categories = [],
  onSavePart,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"form" | "canvas">("form");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [section, setSection] = useState("");
  const [isCustomSection, setIsCustomSection] = useState(false);
  const [sectionOptions, setSectionOptions] = useState<string[]>([]);
  const [applicableModelIds, setApplicableModelIds] = useState<string[]>([]);
  const [modelTarget, setModelTarget] = useState("");
  const [diagramImage, setDiagramImage] = useState("");
  const [pendingDiagramFile, setPendingDiagramFile] = useState<File | null>(null);
  const [uploadingDiagram, setUploadingDiagram] = useState(false);
  const [description, setDescription] = useState("");
  const [hotspots, setHotspots] = useState<ExplodedDiagram["hotspots"]>([]);
  const [hotspotSortMode, setHotspotSortMode] = useState<"item" | "alpha">("item");

  const sortedHotspotsWithIndex = useMemo(() => {
    const list = hotspots.map((hs, originalIndex) => {
      const part = parts.find((p) => p.id === hs.partId);
      const name = (hs.label || part?.name || "").trim();
      return { hs, originalIndex, name, part };
    });

    if (hotspotSortMode === "item") {
      // Ordena por el número/texto alfanumérico del hotspot (#1, #2, #2A, #3, ...)
      return list.sort((a, b) => {
        const itemComp = String(a.hs.itemNumber).localeCompare(String(b.hs.itemNumber), "es", {
          numeric: true,
          sensitivity: "base",
        });
        if (itemComp !== 0) return itemComp;
        return a.name.localeCompare(b.name, "es", { sensitivity: "base", numeric: true });
      });
    }

    // Orden alfabético por nombre del repuesto (A-Z)
    return list.sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base", numeric: true })
    );
  }, [hotspots, hotspotSortMode, parts]);

  // Paste & URL Image states
  const [pasteFeedback, setPasteFeedback] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isReadingClipboard, setIsReadingClipboard] = useState(false);

  // Zoom & Pin Size Mode State
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pinSizeMode, setPinSizeMode] = useState<
    "normal" | "compact" | "micro"
  >("compact");

  // Hotspot Creation & Editing State
  const [pendingHotspot, setPendingHotspot] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [editingHotspotIndex, setEditingHotspotIndex] = useState<number | null>(
    null,
  );
  const [itemNumberInput, setItemNumberInput] = useState<string>("1");
  const [labelInput, setLabelInput] = useState("");
  const [partIdInput, setPartIdInput] = useState("");

  // Local synced parts & Create Part Modal State
  const [localParts, setLocalParts] = useState<SuzukiPart[]>(parts);
  const [isCreatePartOpen, setIsCreatePartOpen] = useState(false);
  const [initialPartData, setInitialPartData] = useState<Partial<SuzukiPart> | null>(null);

  useEffect(() => {
    setLocalParts(parts);
  }, [parts]);

  const handleOpenCreatePart = (query?: string) => {
    const rawCategory = (category || section || "").trim();
    const matchedCategory = categories.find(
      c => c.slug.toLowerCase() === rawCategory.toLowerCase() ||
           c.name.toLowerCase() === rawCategory.toLowerCase()
    );
    setInitialPartData({
      name: query?.trim() || labelInput?.trim() || "",
      category: matchedCategory?.slug || categories[0]?.slug || "motor",
      compatibility: applicableModelIds.map(mId => ({ modelId: mId })),
    });
    setIsCreatePartOpen(true);
  };

  const handleSaveNewPart = async (newPart: SuzukiPart) => {
    setLocalParts(prev => [newPart, ...prev.filter(p => p.id !== newPart.id)]);
    setPartIdInput(newPart.id);
    setLabelInput(newPart.name);
    setIsCreatePartOpen(false);
    if (onSavePart) {
      await onSavePart(newPart);
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  // Hotspot Drag-to-move State
  const [draggingHotspotIndex, setDraggingHotspotIndex] = useState<number | null>(null);
  const [isDraggingPendingHotspot, setIsDraggingPendingHotspot] = useState(false);
  const [hasDraggedHotspot, setHasDraggedHotspot] = useState(false);
  const dragStartPosRef = useRef<{
    clientX: number;
    clientY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File, sourceLabel?: string) => {
    if (!file.type.startsWith("image/")) {
      setError(
        "Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP, SVG, GIF).",
      );
      return;
    }
    setError("");
    setPendingDiagramFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setDiagramImage(e.target.result as string);
        if (sourceLabel === "clipboard") {
          setPasteFeedback("¡Plano pegado desde el portapapeles con éxito!");
          setTimeout(() => setPasteFeedback(null), 3500);
        } else if (sourceLabel === "file") {
          setPasteFeedback("¡Archivo de plano adjuntado con éxito!");
          setTimeout(() => setPasteFeedback(null), 3500);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0], "file");
    }
  };

  const handlePasteFromClipboardButton = async () => {
    setError("");
    setIsReadingClipboard(true);
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith("image/"));
          if (imageType) {
            const blob = await item.getType(imageType);
            const ext = imageType.split("/")[1]?.replace("jpeg", "jpg") || "png";
            const file = new File(
              [blob],
              `despiece-clipboard-${Date.now()}.${ext}`,
              { type: imageType },
            );
            handleFileSelect(file, "clipboard");
            setIsReadingClipboard(false);
            return;
          }
        }
      }

      // Fallback: check text in clipboard in case user copied image URL
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        const cleanText = text.trim();
        if (
          cleanText.startsWith("data:image/") ||
          /^https?:\/\/.+\.(png|jpe?g|webp|svg|gif)(\?.*)?$/i.test(cleanText) ||
          /^https?:\/\/.+/i.test(cleanText)
        ) {
          setDiagramImage(cleanText);
          setPendingDiagramFile(null);
          setPasteFeedback("¡Enlace de imagen pegado con éxito!");
          setTimeout(() => setPasteFeedback(null), 3500);
          setIsReadingClipboard(false);
          return;
        }
      }

      setError(
        "No se encontró una imagen en el portapapeles. Copia una imagen (ej. captura con Win+Shift+S) y vuelve a intentar.",
      );
    } catch (err: any) {
      console.warn("Clipboard access error:", err);
      setError(
        "No se pudo acceder automáticamente al portapapeles. Por favor presiona Ctrl+V para pegar directamente.",
      );
    } finally {
      setIsReadingClipboard(false);
    }
  };

  const handleApplyImageUrl = (urlToApply?: string) => {
    const target = (urlToApply || urlInput).trim();
    if (!target) {
      setError("Por favor ingresa una URL válida de imagen.");
      return;
    }
    if (
      !target.startsWith("http://") &&
      !target.startsWith("https://") &&
      !target.startsWith("data:image/") &&
      !target.startsWith("/")
    ) {
      setError("La URL debe comenzar con http://, https:// o data:image/");
      return;
    }
    setError("");
    setDiagramImage(target);
    setPendingDiagramFile(null);
    setUrlInput("");
    setShowUrlInput(false);
    setPasteFeedback("¡Imagen de despiece asignada por URL!");
    setTimeout(() => setPasteFeedback(null), 3500);
  };

  // Global paste listener (Ctrl+V anywhere in the modal)
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalPaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      const isTypingText =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT") &&
        (activeEl as HTMLElement).id !== "diagram-url-input";

      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith("image/")) {
            e.preventDefault();
            const blob = item.getAsFile();
            if (blob) {
              const ext =
                item.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
              const file = new File(
                [blob],
                `despiece-clipboard-${Date.now()}.${ext}`,
                { type: item.type },
              );
              handleFileSelect(file, "clipboard");
              return;
            }
          }
        }
      }

      // If not typing in another input and pasted text is an image URL
      if (!isTypingText) {
        const text = e.clipboardData?.getData("text")?.trim();
        if (
          text &&
          (text.startsWith("data:image/") ||
            /^https?:\/\/.+\.(png|jpe?g|webp|svg|gif)(\?.*)?$/i.test(text))
        ) {
          e.preventDefault();
          handleApplyImageUrl(text);
        }
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [isOpen]);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const prevZoomRef = useRef(zoomLevel);
  const prevHasPendingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/schematic-sections")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const names = ((json?.data) || []).map((s: any) => s.name);
        setSectionOptions(names);
      })
      .catch(() => {
        if (!cancelled) setSectionOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Once sections are known: default an empty section to the first DB option
  // and mark the section as "custom" if it is not part of the catalog.
  useEffect(() => {
    if (sectionOptions.length === 0) {
      setIsCustomSection(Boolean(section));
      return;
    }
    if (!section) {
      setSection(sectionOptions[0]);
      setIsCustomSection(false);
      return;
    }
    setIsCustomSection(!sectionOptions.includes(section));
  }, [sectionOptions]);

  useEffect(() => {
    if (schematicToEdit) {
      setTitle(schematicToEdit.title || "");
      setCategory(schematicToEdit.category || "");
      setSection(schematicToEdit.section || "");
      setApplicableModelIds(schematicToEdit.applicableModelIds || []);
      setModelTarget(schematicToEdit.modelTarget || "");
      setDiagramImage(schematicToEdit.diagramImage || "");
      setPendingDiagramFile(null);
      setDescription(schematicToEdit.description || "");
      setHotspots(schematicToEdit.hotspots || []);
    } else {
      setTitle("");
      setCategory("");
      setSection("");
      setIsCustomSection(false);
      setApplicableModelIds([]);
      setModelTarget("");
      setDiagramImage("");
      setPendingDiagramFile(null);
      setDescription("");
      setHotspots([]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setActiveSubTab("form");
    setZoomLevel(1);
    setPendingHotspot(null);
    setEditingHotspotIndex(null);
    setDraggingHotspotIndex(null);
    setIsDraggingPendingHotspot(false);
    setHasDraggedHotspot(false);
    setPasteFeedback(null);
    setShowUrlInput(false);
    setUrlInput("");
    setIsReadingClipboard(false);
    setError("");
  }, [schematicToEdit, isOpen]);

  // Global drag listener for repositioning hotspots on the canvas by holding click with relative delta smoothing
  useEffect(() => {
    if (draggingHotspotIndex === null && !isDraggingPendingHotspot) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const targetElement = imageRef.current;
      if (!targetElement || !dragStartPosRef.current) return;

      const { clientX: startX, clientY: startY, initialX, initialY } = dragStartPosRef.current;
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (dist > 3) {
        setHasDraggedHotspot(true);
      }

      const rect = targetElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const deltaXPercent = ((e.clientX - startX) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - startY) / rect.height) * 100;

      // Ultra-smooth sub-pixel precision (rounded to 1 decimal place e.g. 45.3%)
      let x = Math.round((initialX + deltaXPercent) * 10) / 10;
      let y = Math.round((initialY + deltaYPercent) * 10) / 10;

      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));

      if (isDraggingPendingHotspot) {
        setPendingHotspot({ x, y });
      } else if (draggingHotspotIndex !== null) {
        setHotspots((prev) =>
          prev.map((hs, i) => (i === draggingHotspotIndex ? { ...hs, x, y } : hs))
        );
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const targetElement = imageRef.current;
      if (!targetElement || !dragStartPosRef.current) return;

      const { clientX: startX, clientY: startY, initialX, initialY } = dragStartPosRef.current;
      const dist = Math.hypot(touch.clientX - startX, touch.clientY - startY);
      if (dist > 3) {
        setHasDraggedHotspot(true);
      }

      const rect = targetElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const deltaXPercent = ((touch.clientX - startX) / rect.width) * 100;
      const deltaYPercent = ((touch.clientY - startY) / rect.height) * 100;

      let x = Math.round((initialX + deltaXPercent) * 10) / 10;
      let y = Math.round((initialY + deltaYPercent) * 10) / 10;

      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));

      if (isDraggingPendingHotspot) {
        setPendingHotspot({ x, y });
      } else if (draggingHotspotIndex !== null) {
        setHotspots((prev) =>
          prev.map((hs, i) => (i === draggingHotspotIndex ? { ...hs, x, y } : hs))
        );
      }
    };

    const handleGlobalMouseUp = () => {
      setDraggingHotspotIndex(null);
      setIsDraggingPendingHotspot(false);
      dragStartPosRef.current = null;
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("touchmove", handleGlobalTouchMove, { passive: false });
    window.addEventListener("touchend", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
      window.removeEventListener("touchend", handleGlobalMouseUp);
    };
  }, [draggingHotspotIndex, isDraggingPendingHotspot]);

  // Keyboard micro-adjustments with arrow keys for microscopic precision
  useEffect(() => {
    if (activeSubTab !== "canvas") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;

      e.preventDefault();
      const step = e.shiftKey ? 1.0 : 0.2; // 0.2% fine step, 1.0% with shift

      let dx = 0;
      let dy = 0;
      if (e.key === "ArrowLeft") dx = -step;
      if (e.key === "ArrowRight") dx = step;
      if (e.key === "ArrowUp") dy = -step;
      if (e.key === "ArrowDown") dy = step;

      if (editingHotspotIndex !== null && hotspots[editingHotspotIndex]) {
        setHotspots((prev) =>
          prev.map((hs, i) => {
            if (i === editingHotspotIndex) {
              const x = Math.max(0, Math.min(100, Math.round((hs.x + dx) * 10) / 10));
              const y = Math.max(0, Math.min(100, Math.round((hs.y + dy) * 10) / 10));
              return { ...hs, x, y };
            }
            return hs;
          })
        );
      } else if (pendingHotspot) {
        setPendingHotspot((prev) => {
          if (!prev) return null;
          const x = Math.max(0, Math.min(100, Math.round((prev.x + dx) * 10) / 10));
          const y = Math.max(0, Math.min(100, Math.round((prev.y + dy) * 10) / 10));
          return { x, y };
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSubTab, editingHotspotIndex, pendingHotspot, hotspots]);

  // Helper to center the canvas viewport either on the selected hotspot or in the middle of the diagram
  const centerCanvasViewport = (smooth = false) => {
    const container = canvasViewportRef.current;
    if (!container || zoomLevel <= 1) return;

    requestAnimationFrame(() => {
      if (!container) return;
      const { scrollWidth, scrollHeight, clientWidth, clientHeight } = container;
      if (scrollWidth <= clientWidth && scrollHeight <= clientHeight) return;

      const targetSpot =
        editingHotspotIndex !== null
          ? hotspots[editingHotspotIndex]
          : pendingHotspot
            ? pendingHotspot
            : null;

      let targetLeft: number;
      let targetTop: number;

      if (targetSpot) {
        // Center directly on the hotspot coordinates
        targetLeft = (targetSpot.x / 100) * scrollWidth - clientWidth / 2;
        targetTop = (targetSpot.y / 100) * scrollHeight - clientHeight / 2;
      } else {
        // Center on the middle of the diagram
        targetLeft = (scrollWidth - clientWidth) / 2;
        targetTop = (scrollHeight - clientHeight) / 2;
      }

      container.scrollTo({
        left: Math.max(0, targetLeft),
        top: Math.max(0, targetTop),
        behavior: smooth ? "smooth" : "auto",
      });
    });
  };

  const hasPendingHotspot = Boolean(pendingHotspot);

  // Center on zoom change, selecting an existing hotspot, or initially placing a pending hotspot in the editor
  useEffect(() => {
    if (activeSubTab === "canvas" && zoomLevel > 1) {
      const zoomChanged = prevZoomRef.current !== zoomLevel;
      const justCreatedPending = hasPendingHotspot && !prevHasPendingRef.current;
      centerCanvasViewport(!zoomChanged && !justCreatedPending);
    }
    prevZoomRef.current = zoomLevel;
    prevHasPendingRef.current = hasPendingHotspot;
  }, [zoomLevel, editingHotspotIndex, hasPendingHotspot, activeSubTab]);

  if (!isOpen) return null;

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If the user just dragged a hotspot, do not create a new hotspot on release
    if (hasDraggedHotspot || draggingHotspotIndex !== null || isDraggingPendingHotspot) {
      setHasDraggedHotspot(false);
      return;
    }
    // Target the rendered image bounds or container
    const targetElement = imageRef.current || imageContainerRef.current;
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Calculate exact percentage coordinates relative to image bounds
    let x = Math.round(((clickX / rect.width) * 100) * 10) / 10;
    let y = Math.round(((clickY / rect.height) * 100) * 10) / 10;

    // Clamp coordinates strictly between 0% and 100%
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    // If currently editing an existing hotspot, update its position on click
    if (editingHotspotIndex !== null) {
      setHotspots(
        hotspots.map((hs, i) =>
          i === editingHotspotIndex ? { ...hs, x, y } : hs,
        ),
      );
      return;
    }

    // Otherwise create a new hotspot
    let nextItem = "1";
    if (hotspots.length > 0) {
      const numericItems = hotspots
        .map((h) => parseInt(String(h.itemNumber), 10))
        .filter((n) => !isNaN(n));
      if (numericItems.length > 0) {
        nextItem = String(Math.max(...numericItems) + 1);
      } else {
        nextItem = String(hotspots.length + 1);
      }
    }
    setItemNumberInput(nextItem);
    setPendingHotspot({ x, y });

    if (parts.length > 0) {
      setPartIdInput(parts[0].id);
      setLabelInput(parts[0].name);
    }
  };

  const handleConfirmNewHotspot = () => {
    if (!pendingHotspot) return;
    if (!labelInput.trim()) {
      setError("Debes ingresar una etiqueta para el punto hotspot.");
      return;
    }

    const newHotspot = {
      partId: partIdInput || parts[0]?.id || "",
      itemNumber: String(itemNumberInput).trim() || "1",
      x: pendingHotspot.x,
      y: pendingHotspot.y,
      label: labelInput.trim(),
    };

    setHotspots([...hotspots, newHotspot]);
    setPendingHotspot(null);
    setLabelInput("");
    setError("");
  };

  const handleStartEditHotspot = (index: number) => {
    const hs = hotspots[index];
    if (!hs) return;
    setEditingHotspotIndex(index);
    setPendingHotspot(null);
    setItemNumberInput(String(hs.itemNumber));
    setLabelInput(hs.label);
    setPartIdInput(hs.partId);
    setError("");
  };

  const handleSaveEditedHotspot = () => {
    if (editingHotspotIndex === null) return;
    if (!labelInput.trim()) {
      setError("Debes ingresar una etiqueta para el punto.");
      return;
    }

    setHotspots(
      hotspots.map((hs, i) => {
        if (i === editingHotspotIndex) {
          return {
            ...hs,
            itemNumber: String(itemNumberInput).trim() || "1",
            partId: partIdInput || hs.partId,
            label: labelInput.trim(),
          };
        }
        return hs;
      }),
    );

    setEditingHotspotIndex(null);
    setLabelInput("");
    setError("");
  };

  const handleRemoveHotspot = (index: number) => {
    setHotspots(hotspots.filter((_, i) => i !== index));
    if (editingHotspotIndex === index) {
      setEditingHotspotIndex(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("El título del despiece es obligatorio.");
      return;
    }

    let finalDiagramImage = diagramImage.trim();

    if (pendingDiagramFile) {
      setUploadingDiagram(true);
      try {
        const result = await UPLOAD_IMAGE(pendingDiagramFile, "schematics");
        finalDiagramImage = result.url;
      } catch (err: any) {
        console.warn("Cloud upload no disponible, usando plano cargado localmente:", err);
        // Si falla la nube, mantenemos la imagen local/data URL para no perder el trabajo
        if (!finalDiagramImage) {
          setError(
            err?.message || "No se pudo procesar la imagen del despiece.",
          );
          setUploadingDiagram(false);
          return;
        }
      }
      setUploadingDiagram(false);
    } else if (finalDiagramImage.startsWith("data:")) {
      setUploadingDiagram(true);
      try {
        const res = await fetch(finalDiagramImage);
        const blob = await res.blob();
        const extMatch = finalDiagramImage.match(/^data:image\/(\w+);/);
        const ext = extMatch ? extMatch[1].replace("jpeg", "jpg") : "png";
        const file = new File(
          [blob],
          `schematic-${Date.now()}.${ext}`,
          { type: blob.type || "image/png" }
        );
        const result = await UPLOAD_IMAGE(file, "schematics");
        finalDiagramImage = result.url;
      } catch (err: any) {
        console.warn("Cloud upload no disponible para data URL, conservando en memoria:", err);
      }
      setUploadingDiagram(false);
    }

    const schematicId = schematicToEdit
      ? schematicToEdit.id
      : crypto.randomUUID();

    const newSchematic: ExplodedDiagram = {
      id: schematicId,
      tenantId: schematicToEdit?.tenantId,
      title: title.trim(),
      category: category.trim(),
      section,
      applicableModelIds,
      modelTarget: modelTarget.trim(),
      diagramImage: finalDiagramImage,
      description: description.trim(),
      hotspots,
    };

    onSave(newSchematic);
    onClose();
  };

  return (
    <div id="schematic-drawer" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-[95vw] md:max-w-4xl lg:max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 md:px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-[#d97706] border border-amber-200 flex items-center justify-center shadow-xs">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 font-display">
                {schematicToEdit
                  ? "Editar Despiece Explosión"
                  : "Nuevo Despiece Explosión"}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {schematicToEdit
                  ? `ID: ${schematicToEdit.id}`
                  : "Diagrama interactivo de repuestos"}
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

        {/* Subtab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 md:px-8 pt-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab("form")}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 font-mono transition-all ${
              activeSubTab === "form"
                ? "border-[#E60012] text-[#E60012] bg-white rounded-t-2xl border-t border-x border-slate-200 shadow-xs"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            1. Datos del Diagrama
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("canvas")}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 font-mono transition-all flex items-center gap-2 ${
              activeSubTab === "canvas"
                ? "border-[#E60012] text-[#E60012] bg-white rounded-t-2xl border-t border-x border-slate-200 shadow-xs"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>2. Lienzo Interactivo Hotspots ({hotspots.length})</span>
          </button>
        </div>

        {/* Body Content */}
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

          {activeSubTab === "form" && (
            <div className="space-y-5">
              {/* Title & Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                    Título del Despiece *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Despiece Bloque Motor & Inyección"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono">
                      Sección Técnica *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomSection(!isCustomSection);
                        if (!isCustomSection) setSection("");
                        else setSection(sectionOptions[0] || "");
                      }}
                      className="text-[11px] font-bold text-[#E60012] hover:underline flex items-center gap-1"
                    >
                      {isCustomSection
                        ? "← Seleccionar de lista"
                        : "+ Nueva Sección"}
                    </button>
                  </div>

                  {isCustomSection ? (
                    <input
                      type="text"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      placeholder="Ej. Suspensión & Dirección..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium"
                    />
                  ) : (
                    <select
                      value={section}
                      onChange={(e) => {
                        if (e.target.value === "__NEW__") {
                          setIsCustomSection(true);
                          setSection("");
                        } else {
                          setSection(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium"
                    >
                      {sectionOptions.length === 0 && (
                        <option value="" disabled>
                          Cargando secciones...
                        </option>
                      )}
                      {sectionOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                      <option value="__NEW__">
                        + Escribir nueva sección...
                      </option>
                    </select>
                  )}
                </div>
              </div>

              {/* Category & Model Target */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                    Categoría de Despiece
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ej. Motor & Admisión"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                    Etiqueta de Motocicleta Objetivo
                  </label>
                  <input
                    type="text"
                    value={modelTarget}
                    onChange={(e) => setModelTarget(e.target.value)}
                    placeholder="Ej. Gixxer 150 FI (2018-2024)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium"
                  />
                </div>
              </div>

              {/* Applicable Models Autocomplete MultiSelect */}
              <SearchableModelMultiSelect
                models={models}
                selectedModelIds={applicableModelIds}
                onChange={setApplicableModelIds}
                label="Modelos de Moto Aplicables (Búsqueda & Autocomplete)"
                placeholder="Escribe para buscar entre todos los modelos registrados..."
              />

              {/* Diagram Image File Attachment & Clipboard Paste Dropzone */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono">
                    Imagen / Plano del Despiece *
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#E60012]" />
                    Soporta Ctrl+V para pegar
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0], "file");
                    }
                  }}
                  className="hidden"
                />

                {/* Paste Feedback Banner */}
                {pasteFeedback && (
                  <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-[#059669] text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                      <span>{pasteFeedback}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPasteFeedback(null)}
                      className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {diagramImage ? (
                  <div className="relative p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-36 h-28 rounded-xl bg-white border border-slate-200 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      <img
                        src={diagramImage}
                        alt="Vista previa del diagrama"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
                      <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                        <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600" />
                          Plano Adjuntado Correctamente
                        </p>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {diagramImage.startsWith("data:")
                            ? "Portapapeles / Local"
                            : "Almacenamiento Cloud"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono truncate">
                        {diagramImage.startsWith("data:")
                          ? "Imagen cargada en memoria (se subirá a la nube al guardar)"
                          : diagramImage}
                      </p>
                      <div className="pt-2 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-xs"
                          title="Seleccionar otro archivo del equipo"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-[#E60012]" />
                          <span>Subir Archivo</span>
                        </button>
                        <button
                          type="button"
                          onClick={handlePasteFromClipboardButton}
                          disabled={isReadingClipboard}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-xs"
                          title="Pegar imagen desde el portapapeles (Ctrl+V)"
                        >
                          <Clipboard className="w-3.5 h-3.5 text-[#0A3088]" />
                          <span>{isReadingClipboard ? "Leyendo..." : "Pegar Portapapeles"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(!showUrlInput)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-xs"
                          title="Pegar enlace o URL"
                        >
                          <Link2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>URL</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDiagramImage("");
                            setPendingDiagramFile(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Quitar</span>
                        </button>
                      </div>

                      {showUrlInput && (
                        <div className="pt-2 flex items-center gap-2">
                          <input
                            id="diagram-url-input"
                            type="text"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://ejemplo.com/plano-despiece.png"
                            className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012]"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyImageUrl()}
                            className="px-3 py-1.5 bg-[#0A3088] text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors shrink-0"
                          >
                            Cargar URL
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-3 ${
                        isDragging
                          ? "border-[#E60012] bg-[#E60012]/10 scale-[0.99]"
                          : "border-slate-300 hover:border-[#E60012] bg-slate-50/70"
                      }`}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs text-slate-500">
                        <UploadCloud className="w-7 h-7 text-[#E60012]" />
                      </div>
                      <div className="max-w-md">
                        <p className="text-sm font-extrabold text-slate-900">
                          Arrastra tu imagen aquí, sube un archivo o pega con <kbd className="px-1.5 py-0.5 rounded bg-slate-200 border border-slate-300 font-mono text-xs text-slate-800">Ctrl + V</kbd>
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono mt-1">
                          Formatos compatibles: PNG, JPG, WEBP, SVG, GIF (capturas de pantalla y portapapeles soportados)
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-[#E60012] text-white text-xs font-bold uppercase tracking-wider shadow-xs hover:bg-[#b5000b] transition-colors flex items-center gap-2"
                        >
                          <UploadCloud className="w-4 h-4" />
                          <span>Subir Archivo</span>
                        </button>
                        <button
                          type="button"
                          onClick={handlePasteFromClipboardButton}
                          disabled={isReadingClipboard}
                          className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-100 hover:border-slate-400 transition-colors flex items-center gap-2 shadow-xs"
                          title="Pegar imagen copiada en el portapapeles"
                        >
                          <Clipboard className="w-4 h-4 text-[#0A3088]" />
                          <span>{isReadingClipboard ? "Leyendo portapapeles..." : "Pegar Portapapeles"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(!showUrlInput)}
                          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                          title="Ingresar enlace URL de la imagen"
                        >
                          <Link2 className="w-4 h-4 text-slate-500" />
                          <span>Pegar URL</span>
                        </button>
                      </div>
                    </div>

                    {showUrlInput && (
                      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-in fade-in">
                        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                          <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
                          <input
                            id="diagram-url-input"
                            type="text"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://ejemplo.com/imagen-despiece.png o data:image/..."
                            className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleApplyImageUrl();
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => handleApplyImageUrl()}
                            className="px-4 py-2 rounded-xl bg-[#0A3088] text-white text-xs font-bold hover:bg-blue-900 transition-colors shadow-xs"
                          >
                            Cargar URL
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowUrlInput(false)}
                            className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-bold"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                  Descripción Técnica
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles sobre las partes ensambladas en este esquema despiece..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium resize-none"
                />
              </div>
            </div>
          )}

          {activeSubTab === "canvas" && (
            <div className="space-y-5">
              {/* Controls bar: Banner + Zoom Controls + Pin Size selector */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[#0A3088] text-xs flex flex-wrap items-center justify-between gap-3 font-medium">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-[#0A3088] shrink-0" />
                  <span>
                    {editingHotspotIndex !== null
                      ? `Modo Edición: Haz clic o arrastra el Punto #${itemNumberInput} para reubicarlo.`
                      : "Haz clic para crear un punto o mantén presionado y arrastra cualquier punto para moverlo libremente."}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 bg-white border border-blue-200 p-1 rounded-lg">
                    <span className="text-[10px] font-mono font-bold text-slate-500 px-1 uppercase">
                      Zoom:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setZoomLevel((prev) => Math.max(1, prev - 0.5))
                      }
                      disabled={zoomLevel <= 1}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700"
                      title="Alejar zoom"
                    >
                      -
                    </button>
                    <span className="px-1 text-[10px] font-mono font-bold text-slate-900">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setZoomLevel((prev) => Math.min(2.5, prev + 0.5))
                      }
                      disabled={zoomLevel >= 2.5}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700"
                      title="Acercar zoom"
                    >
                      +
                    </button>
                    {zoomLevel > 1 && (
                      <button
                        type="button"
                        onClick={() => setZoomLevel(1)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-[#E60012] hover:underline"
                        title="Restablecer zoom"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Pin Size Selector */}
                  <div className="flex items-center gap-1 bg-white border border-blue-200 p-1 rounded-lg">
                    <span className="text-[10px] font-mono font-bold text-slate-500 px-1 uppercase">
                      Tamaño Puntos:
                    </span>
                    <button
                      type="button"
                      onClick={() => setPinSizeMode("normal")}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                        pinSizeMode === "normal"
                          ? "bg-[#E60012] text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Normal (28px)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPinSizeMode("compact")}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                        pinSizeMode === "compact"
                          ? "bg-[#E60012] text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Compacto (20px)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPinSizeMode("micro")}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                        pinSizeMode === "micro"
                          ? "bg-[#E60012] text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Micro-Dot (12px)
                    </button>
                  </div>

                  {/* Quick Image Replacement button on Canvas Toolbar */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-blue-200 text-[#0A3088] hover:bg-blue-50 text-[11px] font-bold font-mono flex items-center gap-1.5 shadow-xs transition-colors"
                      title="Subir archivo de plano"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-[#E60012]" />
                      <span>Subir</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePasteFromClipboardButton}
                      disabled={isReadingClipboard}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-blue-200 text-[#0A3088] hover:bg-blue-50 text-[11px] font-bold font-mono flex items-center gap-1.5 shadow-xs transition-colors"
                      title="Pegar imagen copiada en el portapapeles (o presiona Ctrl+V)"
                    >
                      <Clipboard className="w-3.5 h-3.5 text-[#0A3088]" />
                      <span>{isReadingClipboard ? "Pegando..." : "Pegar (Ctrl+V)"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Paste Feedback Banner inside Canvas view if triggered */}
              {pasteFeedback && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-[#059669] text-xs font-bold flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                    <span>{pasteFeedback}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPasteFeedback(null)}
                    className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Interactive Canvas Viewport (Scrollable with Zoom Container) */}
              <div
                ref={canvasViewportRef}
                className="relative border border-slate-200 rounded-2xl overflow-auto bg-slate-50 shadow-xs max-h-[520px] custom-scrollbar select-none"
              >
                <div
                  ref={imageContainerRef}
                  className={`p-4 bg-white flex min-h-[340px] select-none ${
                    zoomLevel > 1 ? "items-start justify-start" : "items-center justify-center"
                  }`}
                >
                  {diagramImage ? (
                    <div
                      onClick={handleCanvasClick}
                      className="relative cursor-crosshair select-none"
                      style={
                        zoomLevel > 1
                          ? {
                              width: `${zoomLevel * 100}%`,
                              minWidth: `${zoomLevel * 100}%`,
                            }
                          : {
                              maxWidth: "100%",
                              display: "inline-block",
                            }
                      }
                    >
                      <img
                        ref={imageRef}
                        src={diagramImage}
                        alt="Diagrama despiece"
                        className={`${
                          zoomLevel > 1
                            ? "w-full h-auto"
                            : "max-w-full max-h-[480px] w-auto h-auto"
                        } object-contain pointer-events-none select-none block mx-auto`}
                      />

                      {/* Render Existing Hotspot Pins inside tight image bounds */}
                      {hotspots.map((hs, idx) => {
                        const isCurrentlyEditing = editingHotspotIndex === idx;
                        const isCurrentlyDragging = draggingHotspotIndex === idx;
                        const pinSizeClasses =
                          pinSizeMode === "normal"
                            ? "w-8 h-8 font-mono text-xs font-black"
                            : pinSizeMode === "compact"
                              ? "w-6 h-6 font-mono text-[10px] font-black"
                              : "w-3.5 h-3.5 text-[0px] ring-2 ring-white shadow-lg";

                        return (
                          <div
                            key={idx}
                            style={{
                              left: `${hs.x}%`,
                              top: `${hs.y}%`,
                              transform: `translate(-50%, -50%) scale(${1 + (zoomLevel - 1) * 0.25})`,
                            }}
                            className={`absolute z-10 group ${
                              isCurrentlyDragging ? "cursor-grabbing z-40" : "cursor-grab"
                            }`}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setDraggingHotspotIndex(idx);
                              setHasDraggedHotspot(false);
                              dragStartPosRef.current = {
                                clientX: e.clientX,
                                clientY: e.clientY,
                                initialX: hs.x,
                                initialY: hs.y,
                              };
                            }}
                            onTouchStart={(e) => {
                              if (e.touches.length !== 1) return;
                              e.stopPropagation();
                              setDraggingHotspotIndex(idx);
                              setHasDraggedHotspot(false);
                              dragStartPosRef.current = {
                                clientX: e.touches[0].clientX,
                                clientY: e.touches[0].clientY,
                                initialX: hs.x,
                                initialY: hs.y,
                              };
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!hasDraggedHotspot) {
                                handleStartEditHotspot(idx);
                              }
                            }}
                          >
                            <div
                              className={`rounded-full text-white border-2 shadow-md flex items-center justify-center transition-transform select-none ${
                                isCurrentlyDragging
                                  ? "bg-amber-500 border-white ring-4 ring-amber-400/70 scale-125 z-40 shadow-2xl"
                                  : isCurrentlyEditing
                                    ? "bg-blue-600 border-yellow-300 ring-4 ring-blue-400/50 scale-125 z-30"
                                    : "bg-[#E60012] border-white group-hover:scale-110"
                              } ${pinSizeClasses}`}
                            >
                              {pinSizeMode !== "micro" && hs.itemNumber}
                            </div>

                            {/* Live coordinate badge during drag */}
                            {isCurrentlyDragging && (
                              <div className="absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-0.5 rounded-md bg-slate-900 text-amber-400 text-[10px] font-mono font-bold whitespace-nowrap shadow-xl border border-amber-400/40 pointer-events-none z-50">
                                X: {hs.x}% Y: {hs.y}%
                              </div>
                            )}

                            {/* Hover Actions: Editar & Eliminar (only when not dragging) */}
                            {!isCurrentlyDragging && (
                              <div className="hidden group-hover:flex absolute left-1/2 -translate-x-1/2 bottom-full pb-2 w-44 z-40 flex-col items-center text-center">
                                <div className="w-full bg-slate-900 text-white text-[11px] rounded-xl p-2 shadow-2xl flex flex-col items-center text-center">
                                  <span className="font-bold font-mono text-emerald-400">
                                    Punto #{hs.itemNumber}
                                  </span>
                                  <span className="truncate w-full font-medium text-slate-200 text-[10px]">
                                    {hs.label}
                                  </span>
                                  <div className="text-[9px] text-amber-300 font-mono mt-0.5">
                                    Sostén y arrastra para mover
                                  </div>
                                  <div className="flex items-center justify-center gap-2 mt-1.5 w-full">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartEditHotspot(idx);
                                      }}
                                      className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center cursor-pointer"
                                      title="Editar este punto"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveHotspot(idx);
                                      }}
                                      className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center cursor-pointer"
                                      title="Eliminar este punto"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Render Pending Hotspot Pointer with exact assigned size & ring preview */}
                      {pendingHotspot &&
                        (() => {
                          const pendingPinSizeClasses =
                            pinSizeMode === "normal"
                              ? "w-8 h-8 font-mono text-xs font-black"
                              : pinSizeMode === "compact"
                                ? "w-6 h-6 font-mono text-[10px] font-black"
                                : "w-3.5 h-3.5 text-[0px] ring-2 ring-white shadow-lg";

                          return (
                            <div
                              style={{
                                left: `${pendingHotspot.x}%`,
                                top: `${pendingHotspot.y}%`,
                                transform: `translate(-50%, -50%) scale(${1 + (zoomLevel - 1) * 0.25})`,
                              }}
                              className={`absolute z-20 ${
                                isDraggingPendingHotspot ? "cursor-grabbing z-40" : "cursor-grab"
                              }`}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setIsDraggingPendingHotspot(true);
                                setHasDraggedHotspot(false);
                                dragStartPosRef.current = {
                                  clientX: e.clientX,
                                  clientY: e.clientY,
                                  initialX: pendingHotspot.x,
                                  initialY: pendingHotspot.y,
                                };
                              }}
                              onTouchStart={(e) => {
                                if (e.touches.length !== 1) return;
                                e.stopPropagation();
                                setIsDraggingPendingHotspot(true);
                                setHasDraggedHotspot(false);
                                dragStartPosRef.current = {
                                  clientX: e.touches[0].clientX,
                                  clientY: e.touches[0].clientY,
                                  initialX: pendingHotspot.x,
                                  initialY: pendingHotspot.y,
                                };
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div
                                className={`rounded-full bg-emerald-500 text-white border-2 border-white ring-4 ring-emerald-400/60 shadow-xl flex items-center justify-center select-none transition-transform ${
                                  isDraggingPendingHotspot ? "scale-125 shadow-2xl" : "hover:scale-110"
                                } ${pendingPinSizeClasses}`}
                              >
                                {pinSizeMode !== "micro" && itemNumberInput}
                              </div>

                              {/* Live coordinate badge during drag */}
                              {isDraggingPendingHotspot && (
                                <div className="absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-0.5 rounded-md bg-slate-900 text-emerald-400 text-[10px] font-mono font-bold whitespace-nowrap shadow-xl border border-emerald-400/40 pointer-events-none z-50">
                                  X: {pendingHotspot.x}% Y: {pendingHotspot.y}%
                                </div>
                              )}
                            </div>
                          );
                        })()}
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className="w-full max-w-xl mx-auto py-12 px-6 text-center flex flex-col items-center justify-center gap-3.5 border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50/70 hover:border-[#E60012] transition-all"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs text-slate-400">
                        <FileImage className="w-8 h-8 text-[#E60012]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 font-display">
                          Aún no has cargado un plano para este despiece
                        </h4>
                        <p className="text-xs text-slate-500 font-mono mt-1 max-w-md">
                          Sube un archivo, arrástralo aquí o presiona <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-[11px] text-slate-800 font-bold shadow-xs">Ctrl + V</kbd> para pegar directamente desde tu portapapeles.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-[#E60012] text-white text-xs font-bold uppercase tracking-wider shadow-xs hover:bg-[#b5000b] transition-colors flex items-center gap-2"
                        >
                          <UploadCloud className="w-4 h-4" />
                          <span>Subir Plano</span>
                        </button>
                        <button
                          type="button"
                          onClick={handlePasteFromClipboardButton}
                          disabled={isReadingClipboard}
                          className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-100 hover:border-slate-400 transition-colors flex items-center gap-2 shadow-xs"
                          title="Pegar imagen del portapapeles (Ctrl+V)"
                        >
                          <Clipboard className="w-4 h-4 text-[#0A3088]" />
                          <span>{isReadingClipboard ? "Leyendo..." : "Pegar Portapapeles (Ctrl+V)"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSubTab("form");
                            setShowUrlInput(true);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                        >
                          <Link2 className="w-4 h-4 text-slate-500" />
                          <span>Pegar URL</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Editing Hotspot Panel */}
              {editingHotspotIndex !== null && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-3 animate-in fade-in zoom-in-95 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0A3088] font-mono uppercase flex items-center gap-1.5">
                      <Edit className="w-4 h-4 text-[#0A3088]" />
                      Editando Punto #{itemNumberInput} (X:{" "}
                      {hotspots[editingHotspotIndex]?.x}%, Y:{" "}
                      {hotspots[editingHotspotIndex]?.y}%)
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingHotspotIndex(null)}
                      className="text-slate-400 hover:text-slate-700 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600 italic">
                    💡 Tip: Haz clic en cualquier parte de la imagen superior
                    para mover la ubicación de este punto.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-600 mb-1">
                        Número de Ítem / Código #
                      </label>
                      <input
                        type="text"
                        value={itemNumberInput}
                        onChange={(e) => setItemNumberInput(e.target.value)}
                        placeholder="Ej: 1, 2A, 12-1..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <SearchablePartSelect
                        parts={localParts}
                        selectedPartId={partIdInput}
                        onSelectPart={(p) => {
                          setPartIdInput(p.id);
                          setLabelInput(p.name);
                        }}
                        onCreateNewPart={handleOpenCreatePart}
                        label="Re-Asignar Producto del Catálogo"
                        placeholder="Buscar producto por nombre o referencia OEM..."
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-mono font-bold text-slate-600 mb-1">
                        Etiqueta del Punto
                      </label>
                      <input
                        type="text"
                        value={labelInput}
                        onChange={(e) => setLabelInput(e.target.value)}
                        placeholder="Nombre de la pieza..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingHotspotIndex(null)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEditedHotspot}
                      className="px-4 py-2 bg-[#0A3088] hover:bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Guardar Cambios del Punto</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Pending New Hotspot Form Popover */}
              {pendingHotspot && editingHotspotIndex === null && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in fade-in zoom-in-95 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#059669] font-mono uppercase">
                      Nuevo Punto Hotspot (Coordenadas X: {pendingHotspot.x}%,
                      Y: {pendingHotspot.y}%)
                    </span>
                    <button
                      type="button"
                      onClick={() => setPendingHotspot(null)}
                      className="text-slate-400 hover:text-slate-700 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-600 mb-1">
                        Número de Ítem / Código #
                      </label>
                      <input
                        type="text"
                        value={itemNumberInput}
                        onChange={(e) => setItemNumberInput(e.target.value)}
                        placeholder="Ej: 1, 2A, 12-1..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <SearchablePartSelect
                        parts={localParts}
                        selectedPartId={partIdInput}
                        onSelectPart={(p) => {
                          setPartIdInput(p.id);
                          setLabelInput(p.name);
                        }}
                        onCreateNewPart={handleOpenCreatePart}
                        label="Buscar y Seleccionar Producto"
                        placeholder="Escribe nombre o referencia OEM para buscar producto..."
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-mono font-bold text-slate-600 mb-1">
                        Etiqueta de Muestreo
                      </label>
                      <input
                        type="text"
                        value={labelInput}
                        onChange={(e) => setLabelInput(e.target.value)}
                        placeholder="Ej. Bujía Iridium NGK CPR8EA-9"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPendingHotspot(null)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmNewHotspot}
                      className="px-4 py-2 bg-[#059669] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirmar y Asignar Punto #{itemNumberInput}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* List of Current Hotspots with Edit & Remove Controls */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 font-mono uppercase">
                    Lista de Puntos Vinculados ({hotspots.length})
                  </span>
                  {hotspots.length > 1 && (
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold shadow-xs">
                      <button
                        type="button"
                        onClick={() => setHotspotSortMode("alpha")}
                        className={`px-2 py-1 rounded-md transition-colors ${
                          hotspotSortMode === "alpha"
                            ? "bg-[#0A3088] text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                        title="Ordenar alfabéticamente por nombre de repuesto (A-Z)"
                      >
                        A-Z (Alfabético)
                      </button>
                      <button
                        type="button"
                        onClick={() => setHotspotSortMode("item")}
                        className={`px-2 py-1 rounded-md transition-colors ${
                          hotspotSortMode === "item"
                            ? "bg-[#0A3088] text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                        title="Ordenar por número de ítem (#1, #2, ...)"
                      >
                        N° Ítem
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                  {sortedHotspotsWithIndex.map(({ hs, originalIndex, name, part }) => {
                    const isEditing = editingHotspotIndex === originalIndex;
                    return (
                      <div
                        key={originalIndex}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                          isEditing
                            ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <span className="w-6 h-6 rounded-full bg-[#E60012] text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0 shadow-xs">
                            {hs.itemNumber}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 font-display truncate">
                              {name || hs.label || "Sin nombre"}
                            </p>
                            <p className="text-[10px] font-mono text-slate-500 font-bold truncate">
                              OEM: {part ? part.oemNumbers[0] : "N/A"} • (X:{" "}
                              {hs.x}%, Y: {hs.y}%)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditHotspot(originalIndex)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar este punto"
                          >
                            <Edit className="w-3.5 h-3.5 text-[#0A3088]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveHotspot(originalIndex)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Eliminar este punto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {hotspots.length === 0 && (
                    <p className="text-xs text-slate-400 font-medium text-center py-3">
                      No hay puntos hotspot agregados todavía. Haz clic en la
                      imagen superior para añadir el primero.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
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
            disabled={uploadingDiagram}
            className="px-6 py-2.5 rounded-xl bg-[#E60012] hover:bg-[#b5000b] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all flex items-center gap-2"
          >
            {uploadingDiagram ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Subiendo plano...</span>
              </>
            ) : (
              schematicToEdit ? "Guardar Cambios" : "Crear Despiece"
            )}
          </button>
        </div>
      </div>

      {/* Quick Part Creation Modal / Drawer within Schematic Editor */}
      <PartDrawer
        isOpen={isCreatePartOpen}
        onClose={() => setIsCreatePartOpen(false)}
        onSave={handleSaveNewPart}
        partToEdit={null}
        initialData={initialPartData}
        models={models}
        categories={categories}
        zIndex="z-[70]"
      />
    </div>
  );
};
