import React, { useState, useEffect, useRef } from 'react';
import { X, Layers, Plus, Trash2, AlertCircle, Image as ImageIcon, Crosshair, Package, CheckCircle2, Eye, Edit, Move, UploadCloud, Check } from 'lucide-react';
import type { ExplodedDiagram, SuzukiPart, SuzukiModel } from '../../types';
import { DIAGRAM_SVGS } from '../../data/svgAssets';
import { SearchableModelMultiSelect } from './SearchableModelMultiSelect';
import { SearchablePartSelect } from './SearchablePartSelect';

interface SchematicDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schematic: ExplodedDiagram) => void;
  schematicToEdit: ExplodedDiagram | null;
  models: SuzukiModel[];
  parts: SuzukiPart[];
}

const DEFAULT_SECTION_OPTIONS = [
  'Motor',
  'Frenos',
  'Admisión y Combustible',
  'Transmisión y Kit de Arrastre',
  'Sistema de Refrigeración',
  'Chasis y Eléctrico',
  'Sistema de Escape',
  'Controles y Pedales',
  'Tablero e Instrumentos'
];

export const SchematicDrawer: React.FC<SchematicDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  schematicToEdit,
  models,
  parts
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'canvas'>('form');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Motor & Admisión');
  const [section, setSection] = useState(DEFAULT_SECTION_OPTIONS[0]);
  const [isCustomSection, setIsCustomSection] = useState(false);
  const [applicableModelIds, setApplicableModelIds] = useState<string[]>([]);
  const [modelTarget, setModelTarget] = useState('');
  const [diagramImage, setDiagramImage] = useState('');
  const [description, setDescription] = useState('');
  const [hotspots, setHotspots] = useState<ExplodedDiagram['hotspots']>([]);

  // Zoom & Pin Size Mode State
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pinSizeMode, setPinSizeMode] = useState<'normal' | 'compact' | 'micro'>('compact');

  // Hotspot Creation & Editing State
  const [pendingHotspot, setPendingHotspot] = useState<{ x: number; y: number } | null>(null);
  const [editingHotspotIndex, setEditingHotspotIndex] = useState<number | null>(null);

  const [itemNumberInput, setItemNumberInput] = useState<number>(1);
  const [labelInput, setLabelInput] = useState('');
  const [partIdInput, setPartIdInput] = useState('');

  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP, SVG).');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setDiagramImage(e.target.result as string);
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

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (schematicToEdit) {
      setTitle(schematicToEdit.title);
      setCategory(schematicToEdit.category);
      const sec = schematicToEdit.section || DEFAULT_SECTION_OPTIONS[0];
      setSection(sec);
      setIsCustomSection(!DEFAULT_SECTION_OPTIONS.includes(sec));
      setApplicableModelIds(schematicToEdit.applicableModelIds || []);
      setModelTarget(schematicToEdit.modelTarget || '');
      setDiagramImage(schematicToEdit.diagramImage || DIAGRAM_SVGS['diag-gixxer-engine']);
      setDescription(schematicToEdit.description || '');
      setHotspots(schematicToEdit.hotspots || []);
    } else {
      setTitle('');
      setCategory('Motor & Admisión');
      setSection(DEFAULT_SECTION_OPTIONS[0]);
      setIsCustomSection(false);
      setApplicableModelIds(models.slice(0, 1).map(m => m.id));
      setModelTarget('Suzuki GSX-R / V-Strom (2018-2024)');
      setDiagramImage(DIAGRAM_SVGS['diag-gixxer-engine']);
      setDescription('Diagrama despiece oficial Suzuki Genuine Parts.');
      setHotspots([]);
    }
    setZoomLevel(1);
    setPendingHotspot(null);
    setEditingHotspotIndex(null);
    setError('');
  }, [schematicToEdit, isOpen, models]);

  if (!isOpen) return null;

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Target the rendered image bounds or container
    const targetElement = imageRef.current || imageContainerRef.current;
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Calculate exact percentage coordinates relative to image bounds
    let x = Math.round((clickX / rect.width) * 100);
    let y = Math.round((clickY / rect.height) * 100);

    // Clamp coordinates strictly between 0% and 100%
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    // If currently editing an existing hotspot, update its position on click
    if (editingHotspotIndex !== null) {
      setHotspots(hotspots.map((hs, i) => i === editingHotspotIndex ? { ...hs, x, y } : hs));
      return;
    }

    // Otherwise create a new hotspot
    const nextItem = hotspots.length > 0 ? Math.max(...hotspots.map(h => h.itemNumber)) + 1 : 1;
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
      setError('Debes ingresar una etiqueta para el punto hotspot.');
      return;
    }

    const newHotspot = {
      partId: partIdInput || (parts[0]?.id || 'part-01'),
      itemNumber: itemNumberInput,
      x: pendingHotspot.x,
      y: pendingHotspot.y,
      label: labelInput.trim()
    };

    setHotspots([...hotspots, newHotspot]);
    setPendingHotspot(null);
    setLabelInput('');
    setError('');
  };

  const handleStartEditHotspot = (index: number) => {
    const hs = hotspots[index];
    if (!hs) return;
    setEditingHotspotIndex(index);
    setPendingHotspot(null);
    setItemNumberInput(hs.itemNumber);
    setLabelInput(hs.label);
    setPartIdInput(hs.partId);
    setError('');
  };

  const handleSaveEditedHotspot = () => {
    if (editingHotspotIndex === null) return;
    if (!labelInput.trim()) {
      setError('Debes ingresar una etiqueta para el punto.');
      return;
    }

    setHotspots(hotspots.map((hs, i) => {
      if (i === editingHotspotIndex) {
        return {
          ...hs,
          itemNumber: itemNumberInput,
          partId: partIdInput || hs.partId,
          label: labelInput.trim()
        };
      }
      return hs;
    }));

    setEditingHotspotIndex(null);
    setLabelInput('');
    setError('');
  };

  const handleRemoveHotspot = (index: number) => {
    setHotspots(hotspots.filter((_, i) => i !== index));
    if (editingHotspotIndex === index) {
      setEditingHotspotIndex(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El título del despiece es obligatorio.');
      return;
    }

    const schematicId = schematicToEdit
      ? schematicToEdit.id
      : `diag-${Date.now().toString().slice(-6)}`;

    const newSchematic: ExplodedDiagram = {
      id: schematicId,
      title: title.trim(),
      category: category.trim(),
      section,
      applicableModelIds,
      modelTarget: modelTarget.trim() || 'Aplica a modelos Suzuki',
      diagramImage: diagramImage.trim() || DIAGRAM_SVGS['diag-gixxer-engine'],
      description: description.trim(),
      hotspots
    };

    onSave(newSchematic);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-[95vw] md:max-w-4xl lg:max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 md:px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-[#d97706] border border-amber-200 flex items-center justify-center shadow-xs">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 font-display">
                {schematicToEdit ? 'Editar Despiece Explosión' : 'Nuevo Despiece Explosión'}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {schematicToEdit ? `ID: ${schematicToEdit.id}` : 'Diagrama interactivo de repuestos'}
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
            onClick={() => setActiveSubTab('form')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 font-mono transition-all ${
              activeSubTab === 'form'
                ? 'border-[#E60012] text-[#E60012] bg-white rounded-t-2xl border-t border-x border-slate-200 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            1. Datos del Diagrama
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('canvas')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 font-mono transition-all flex items-center gap-2 ${
              activeSubTab === 'canvas'
                ? 'border-[#E60012] text-[#E60012] bg-white rounded-t-2xl border-t border-x border-slate-200 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>2. Lienzo Interactivo Hotspots ({hotspots.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#dc2626] text-xs flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeSubTab === 'form' && (
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
                        if (!isCustomSection) setSection('');
                        else setSection(DEFAULT_SECTION_OPTIONS[0]);
                      }}
                      className="text-[11px] font-bold text-[#E60012] hover:underline flex items-center gap-1"
                    >
                      {isCustomSection ? '← Seleccionar de lista' : '+ Nueva Sección'}
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
                        if (e.target.value === '__NEW__') {
                          setIsCustomSection(true);
                          setSection('');
                        } else {
                          setSection(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium"
                    >
                      {DEFAULT_SECTION_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value="__NEW__">+ Escribir nueva sección...</option>
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

              {/* Diagram Image File Attachment Dropzone */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                  Imagen / Plano del Despiece
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

                {diagramImage ? (
                  <div className="relative p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-32 h-24 rounded-xl bg-white border border-slate-200 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      <img src={diagramImage} alt="Vista previa del diagrama" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <p className="text-xs font-black text-slate-900 flex items-center gap-1.5 justify-center sm:justify-start">
                        <Check className="w-4 h-4 text-emerald-600" />
                        Plano Adjuntado Correctamente
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                        {diagramImage.startsWith('data:') ? 'Archivo de plano local adjuntado (Data URL)' : diagramImage}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
                        >
                          Cambiar Plano
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiagramImage('')}
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
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2.5 ${
                      isDragging
                        ? 'border-[#E60012] bg-[#E60012]/5 scale-[0.99]'
                        : 'border-slate-300 hover:border-[#E60012] hover:bg-slate-50/80 bg-slate-50/50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs text-slate-500 group-hover:text-[#E60012]">
                      <UploadCloud className="w-6 h-6 text-[#E60012]" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">
                        Haz clic o arrastra la imagen o plano del despiece aquí
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Formatos soportados: PNG, JPG, WEBP, SVG
                      </p>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-[#E60012] text-white text-[11px] font-bold uppercase tracking-wider shadow-xs hover:bg-[#b5000b] transition-colors">
                      Adjuntar Plano / Diagrama
                    </span>
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

          {activeSubTab === 'canvas' && (
            <div className="space-y-5">
              {/* Controls bar: Banner + Zoom Controls + Pin Size selector */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[#0A3088] text-xs flex flex-wrap items-center justify-between gap-3 font-medium">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-[#0A3088] shrink-0" />
                  <span>
                    {editingHotspotIndex !== null
                      ? `Modo Edición: Haz clic en la imagen para reubicar el Punto #${itemNumberInput}.`
                      : 'Haz clic en cualquier punto del esquema para vincular un producto (funciona con y sin zoom).'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 bg-white border border-blue-200 p-1 rounded-lg">
                    <span className="text-[10px] font-mono font-bold text-slate-500 px-1 uppercase">Zoom:</span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.5))}
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
                      onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.5))}
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
                    <span className="text-[10px] font-mono font-bold text-slate-500 px-1 uppercase">Tamaño Puntos:</span>
                    <button
                      type="button"
                      onClick={() => setPinSizeMode('normal')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                        pinSizeMode === 'normal'
                          ? 'bg-[#E60012] text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Normal (28px)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPinSizeMode('compact')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                        pinSizeMode === 'compact'
                          ? 'bg-[#E60012] text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Compacto (20px)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPinSizeMode('micro')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                        pinSizeMode === 'micro'
                          ? 'bg-[#E60012] text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Micro-Dot (12px)
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Canvas Viewport (Scrollable with Zoom Container) */}
              <div className="relative border border-slate-200 rounded-2xl overflow-auto bg-slate-50 shadow-xs max-h-[520px] custom-scrollbar">
                <div
                  ref={imageContainerRef}
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'top left',
                    width: zoomLevel > 1 ? `${zoomLevel * 100}%` : '100%'
                  }}
                  className="relative w-full min-h-[340px] flex items-center justify-center p-4 bg-white transition-transform duration-200 origin-top-left"
                >
                  {diagramImage ? (
                    <div
                      onClick={handleCanvasClick}
                      className="relative inline-block cursor-crosshair select-none"
                    >
                      <img
                        ref={imageRef}
                        src={diagramImage}
                        alt="Diagrama despiece"
                        className="max-w-full max-h-[480px] object-contain pointer-events-none select-none block"
                      />

                      {/* Render Existing Hotspot Pins inside tight image bounds */}
                      {hotspots.map((hs, idx) => {
                        const isCurrentlyEditing = editingHotspotIndex === idx;
                        const pinSizeClasses =
                          pinSizeMode === 'normal' ? 'w-8 h-8 font-mono text-xs font-black' :
                          pinSizeMode === 'compact' ? 'w-5 h-5 font-mono text-[10px] font-black' :
                          'w-3.5 h-3.5 text-[0px] ring-2 ring-white shadow-lg';

                        return (
                          <div
                            key={idx}
                            style={{
                              left: `${hs.x}%`,
                              top: `${hs.y}%`,
                              transform: `translate(-50%, -50%) scale(${1 / Math.sqrt(zoomLevel)})`
                            }}
                            className="absolute z-10 group"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditHotspot(idx);
                            }}
                          >
                            <div className={`rounded-full text-white border-2 shadow-md flex items-center justify-center transition-transform group-hover:scale-125 cursor-pointer ${
                              isCurrentlyEditing
                                ? 'bg-blue-600 border-yellow-300 ring-4 ring-blue-400/50 scale-125 z-30'
                                : 'bg-[#E60012] border-white'
                            } ${pinSizeClasses}`}>
                              {pinSizeMode !== 'micro' && hs.itemNumber}
                            </div>

                            {/* Hover Actions: Editar & Eliminar (Contiguous Hover Bridge - Icon Only) */}
                            <div className="hidden group-hover:flex absolute left-1/2 -translate-x-1/2 bottom-full pb-2 w-44 z-40 flex-col items-center text-center">
                              <div className="w-full bg-slate-900 text-white text-[11px] rounded-xl p-2 shadow-2xl flex flex-col items-center text-center">
                                <span className="font-bold font-mono text-emerald-400">Punto #{hs.itemNumber}</span>
                                <span className="truncate w-full font-medium text-slate-200 text-[10px]">{hs.label}</span>
                                <div className="flex items-center justify-center gap-2 mt-1.5 w-full">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartEditHotspot(idx);
                                    }}
                                    className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center"
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
                                    className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center"
                                    title="Eliminar este punto"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Render Pending Hotspot Pointer with exact assigned size & ring preview */}
                      {pendingHotspot && (() => {
                        const pendingPinSizeClasses =
                          pinSizeMode === 'normal' ? 'w-8 h-8 font-mono text-xs font-black' :
                          pinSizeMode === 'compact' ? 'w-5 h-5 font-mono text-[10px] font-black' :
                          'w-3.5 h-3.5 text-[0px] ring-2 ring-white shadow-lg';

                        return (
                          <div
                            style={{
                              left: `${pendingHotspot.x}%`,
                              top: `${pendingHotspot.y}%`,
                              transform: `translate(-50%, -50%) scale(${1 / Math.sqrt(zoomLevel)})`
                            }}
                            className="absolute z-20 pointer-events-none"
                          >
                            <div className={`rounded-full bg-emerald-500 text-white border-2 border-white ring-4 ring-emerald-400/60 shadow-xl flex items-center justify-center ${pendingPinSizeClasses}`}>
                              {pinSizeMode !== 'micro' && itemNumberInput}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs font-mono font-bold">Sin imagen de diagrama cargada</p>
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
                      Editando Punto #{itemNumberInput} (X: {hotspots[editingHotspotIndex]?.x}%, Y: {hotspots[editingHotspotIndex]?.y}%)
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
                    💡 Tip: Haz clic en cualquier parte de la imagen superior para mover la ubicación de este punto.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-600 mb-1">Número de Ítem #</label>
                      <input
                        type="number"
                        value={itemNumberInput}
                        onChange={(e) => setItemNumberInput(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <SearchablePartSelect
                        parts={parts}
                        selectedPartId={partIdInput}
                        onSelectPart={(p) => {
                          setPartIdInput(p.id);
                          setLabelInput(p.name);
                        }}
                        label="Re-Asignar Producto del Catálogo"
                        placeholder="Buscar producto por nombre o referencia OEM..."
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-mono font-bold text-slate-600 mb-1">Etiqueta del Punto</label>
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
                      Nuevo Punto Hotspot (Coordenadas X: {pendingHotspot.x}%, Y: {pendingHotspot.y}%)
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
                      <label className="block text-[10px] font-mono font-bold text-slate-600 mb-1">Número de Ítem #</label>
                      <input
                        type="number"
                        value={itemNumberInput}
                        onChange={(e) => setItemNumberInput(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <SearchablePartSelect
                        parts={parts}
                        selectedPartId={partIdInput}
                        onSelectPart={(p) => {
                          setPartIdInput(p.id);
                          setLabelInput(p.name);
                        }}
                        label="Buscar y Seleccionar Producto"
                        placeholder="Escribe nombre o referencia OEM para buscar producto..."
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-mono font-bold text-slate-600 mb-1">Etiqueta de Muestreo</label>
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
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-900 font-mono uppercase">Lista de Puntos Vinculados ({hotspots.length})</span>
                <div className="space-y-1.5">
                  {hotspots.map((hs, idx) => {
                    const part = parts.find(p => p.id === hs.partId);
                    const isEditing = editingHotspotIndex === idx;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                          isEditing
                            ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#E60012] text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                            {hs.itemNumber}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900 font-display">{hs.label}</p>
                            <p className="text-[10px] font-mono text-slate-500 font-bold">
                              OEM: {part ? part.oemNumbers[0] : 'N/A'} (X: {hs.x}%, Y: {hs.y}%)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditHotspot(idx)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar este punto"
                          >
                            <Edit className="w-3.5 h-3.5 text-[#0A3088]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveHotspot(idx)}
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
                      No hay puntos hotspot agregados todavía. Haz clic en la imagen superior para añadir el primero.
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
            className="px-6 py-2.5 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all"
          >
            {schematicToEdit ? 'Guardar Cambios' : 'Crear Despiece'}
          </button>
        </div>
      </div>
    </div>
  );
};
