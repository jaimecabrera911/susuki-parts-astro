import React, { useState, useEffect, useRef } from 'react';
import { X, Package, Plus, Trash2, Layers, AlertCircle, Image as ImageIcon, Wrench, CheckCircle2, UploadCloud, Check } from 'lucide-react';
import type { SuzukiPart, SuzukiModel, AvailabilityStatus, TechnicalSpec, CompatibilityRule } from '../../types';
import { SearchableModelSelect } from '../SearchableModelSelect';

interface PartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (part: SuzukiPart) => void;
  partToEdit: SuzukiPart | null;
  models: SuzukiModel[];
}

const CATEGORY_OPTIONS: { id: SuzukiPart['category']; label: string }[] = [
  { id: 'filtros', label: 'Filtros (Aire, Aceite, Gasolina)' },
  { id: 'frenos', label: 'Frenos (Pastillas, Discos, Guayas)' },
  { id: 'motor', label: 'Motor (Pistones, Empaques, Bujías)' },
  { id: 'electrico', label: 'Sistema Eléctrico (Baterías, Relés, Sensores)' },
  { id: 'transmision', label: 'Transmisión (Cadenas, Spockets, Kit de Arrastre)' },
  { id: 'carroceria', label: 'Carrocería & Carenaje (Espejos, Manetas, Faros)' }
];

export const PartDrawer: React.FC<PartDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  partToEdit,
  models
}) => {
  const [name, setName] = useState('');
  const [primaryOem, setPrimaryOem] = useState('');
  const [secondaryOems, setSecondaryOems] = useState<string>('');
  const [category, setCategory] = useState<SuzukiPart['category']>('filtros');
  const [price, setPrice] = useState<number>(50000);
  const [stock, setStock] = useState<number>(10);
  const [availability, setAvailability] = useState<AvailabilityStatus>('in_stock');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');

  // Technical Specs List
  const [specs, setSpecs] = useState<TechnicalSpec[]>([]);
  const [specLabel, setSpecLabel] = useState('');
  const [specValue, setSpecValue] = useState('');

  // Compatibility Rules List
  const [compatibility, setCompatibility] = useState<CompatibilityRule[]>([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [yearStart, setYearStart] = useState<number>(2018);
  const [yearEnd, setYearEnd] = useState<number>(2024);
  const [versionNote, setVersionNote] = useState('');

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

  useEffect(() => {
    if (models.length > 0 && !selectedModelId) {
      setSelectedModelId(models[0].id);
    }
  }, [models]);

  useEffect(() => {
    if (partToEdit) {
      setName(partToEdit.name);
      setPrimaryOem(partToEdit.oemNumbers[0] || '');
      setSecondaryOems(partToEdit.oemNumbers.slice(1).join(', '));
      setCategory(partToEdit.category);
      setPrice(partToEdit.price);
      setStock(partToEdit.stock);
      setAvailability(partToEdit.availability || (partToEdit.stock > 0 ? 'in_stock' : 'on_order'));
      setImage(partToEdit.image || '');
      setDescription(partToEdit.description || '');
      setSpecs(partToEdit.specs || []);
      setCompatibility(partToEdit.compatibility || []);
    } else {
      setName('');
      setPrimaryOem('');
      setSecondaryOems('');
      setCategory('filtros');
      setPrice(75000);
      setStock(15);
      setAvailability('in_stock');
      setImage('');
      setDescription('');
      setSpecs([
        { label: 'Origen', value: 'Genuine Suzuki Parts (Japan)' },
        { label: 'Garantía', value: '12 Meses Defecto Fábrica' }
      ]);
      setCompatibility([]);
    }
    setError('');
  }, [partToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddSpec = () => {
    if (specLabel.trim() && specValue.trim()) {
      setSpecs([...specs, { label: specLabel.trim(), value: specValue.trim() }]);
      setSpecLabel('');
      setSpecValue('');
    }
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
      note: versionNote.trim() || undefined
    };
    setCompatibility([...compatibility, rule]);
    setVersionNote('');
  };

  const handleRemoveCompatibility = (index: number) => {
    setCompatibility(compatibility.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del repuesto es obligatorio.');
      return;
    }

    if (!primaryOem.trim()) {
      setError('La referencia OEM principal es obligatoria.');
      return;
    }

    const oemNumbers = [
      primaryOem.trim(),
      ...secondaryOems.split(',').map(s => s.trim()).filter(Boolean)
    ];

    const partId = partToEdit
      ? partToEdit.id
      : `part-${Date.now().toString().slice(-6)}`;

    const newPart: SuzukiPart = {
      id: partId,
      oemNumbers,
      name: name.trim(),
      category,
      price,
      stock,
      availability,
      image: image.trim() || 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/default.jpg',
      description: description.trim(),
      specs,
      compatibility
    };

    onSave(newPart);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-[95vw] md:max-w-4xl lg:max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 md:px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 font-display">
                {partToEdit ? 'Editar Repuesto OEM' : 'Nuevo Repuesto OEM'}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {partToEdit ? `ID: ${partToEdit.id}` : 'Catálogo Suzuki Parts Expert'}
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
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
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium"
              >
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* OEM References (Geist Mono) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 font-mono">
              <Wrench className="w-4 h-4 text-[#E60012]" />
              <span>REFERENCIAS OEM SUZUKI</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1 font-mono">OEM Principal *</label>
                <input
                  type="text"
                  required
                  value={primaryOem}
                  onChange={(e) => setPrimaryOem(e.target.value)}
                  placeholder="Ej. 16510-05240-000"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono font-bold uppercase placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1 font-mono">OEMs Secundarias (separadas por coma)</label>
                <input
                  type="text"
                  value={secondaryOems}
                  onChange={(e) => setSecondaryOems(e.target.value)}
                  placeholder="16510-05240, 16510-06B00"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono font-medium placeholder-slate-400"
                />
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
                type="number"
                min="0"
                step="500"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Stock Físico *
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Estado Disponibilidad
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as AvailabilityStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium"
              >
                <option value="in_stock">Disponible (En Stock)</option>
                <option value="international">Envío Internacional</option>
                <option value="on_order">Bajo Pedido</option>
              </select>
            </div>
          </div>

          {/* Image File Attachment Dropzone */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
              Fotografía / Ilustración del Repuesto
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
                  <img src={image} alt="Vista previa del repuesto" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <p className="text-xs font-black text-slate-900 flex items-center gap-1.5 justify-center sm:justify-start">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Imagen Adjuntada Correctamente
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                    {image.startsWith('data:') ? 'Archivo local adjuntado (Data URL)' : image}
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
                      onClick={() => setImage('')}
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
                    Haz clic o arrastra la foto del repuesto aquí
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
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 font-mono uppercase">Especificaciones Técnicas</span>
              <span className="text-[11px] font-mono text-slate-500 font-bold">{specs.length} especificaciones</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={specLabel}
                onChange={(e) => setSpecLabel(e.target.value)}
                placeholder="Propiedad (ej. Material)"
                className="w-1/3 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
              />
              <input
                type="text"
                value={specValue}
                onChange={(e) => setSpecValue(e.target.value)}
                placeholder="Valor (ej. Sintético viscoso)"
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
              />
              <button
                type="button"
                onClick={handleAddSpec}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              {specs.map((sp, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 font-mono uppercase text-[10px]">{sp.label}:</span>
                    <span className="text-slate-900 font-medium">{sp.value}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(idx)}
                    className="text-slate-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Model Compatibility Matrix Builder */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 font-mono">
                <Layers className="w-4 h-4 text-[#059669]" />
                <span>MATRIZ DE COMPATIBILIDAD CON MOTOS</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 font-bold">{compatibility.length} modelos vinculados</span>
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
                <label className="block text-[10px] font-mono font-bold text-slate-500 mb-1">Año Inicio</label>
                <input
                  type="number"
                  value={yearStart}
                  onChange={(e) => setYearStart(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 mb-1">Año Fin</label>
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
                const model = models.find(m => m.id === c.modelId);
                return (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-display">{model?.name || c.modelId}</span>
                      <span className="font-mono text-slate-500 font-bold">({c.yearStart} - {c.yearEnd})</span>
                      {c.note && <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono">{c.note}</span>}
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
            className="px-6 py-2.5 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all"
          >
            {partToEdit ? 'Guardar Cambios' : 'Crear Repuesto'}
          </button>
        </div>
      </div>
    </div>
  );
};
