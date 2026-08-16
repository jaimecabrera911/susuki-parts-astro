import React, { useState, useEffect, useRef } from 'react';
import { X, Building2, UploadCloud, AlertCircle } from 'lucide-react';
import type { Brand } from '../../types';
import { UPLOAD_IMAGE } from '../../services/api';

interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (brand: Brand) => void;
  brandToEdit: Brand | null;
}

export const BrandModal: React.FC<BrandModalProps> = ({
  isOpen,
  onClose,
  onSave,
  brandToEdit
}) => {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [logo, setLogo] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState('');

  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (brandToEdit) {
      setName(brandToEdit.name);
      setCountry(brandToEdit.country || '');
      setLogo(brandToEdit.logo || '');
      setDescription(brandToEdit.description || '');
      setActive(brandToEdit.active);
    } else {
      setName('');
      setCountry('Japón');
      setLogo('');
      setDescription('');
      setActive(true);
    }
    setPendingLogoFile(null);
    setLogoPreviewUrl(null);
    setError('');
  }, [brandToEdit, isOpen]);

  if (!isOpen) return null;

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5 MB.');
      return;
    }
    setPendingLogoFile(file);
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreviewUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la marca es obligatorio.');
      return;
    }

    const brandId = brandToEdit
      ? brandToEdit.id
      : name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    let finalLogo = logo.trim();

    if (pendingLogoFile) {
      setUploadingLogo(true);
      try {
        const result = await UPLOAD_IMAGE(pendingLogoFile, 'brands');
        finalLogo = result.url;
      } catch (err: any) {
        setError(err?.message || 'No se pudo subir la imagen.');
        setUploadingLogo(false);
        return;
      }
      setUploadingLogo(false);
    }

    const newBrand: Brand = {
      id: brandId,
      name: name.trim(),
      country: country.trim() || 'Japón',
      logo: finalLogo,
      description: description.trim(),
      active
    };

    onSave(newBrand);
    onClose();
  };

  return (
    <div id="brand-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#E60012] border border-red-200 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 font-display">
                {brandToEdit ? 'Editar Marca' : 'Nueva Marca'}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {brandToEdit ? `ID: ${brandToEdit.id}` : 'Catálogo de Marcas'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#dc2626] text-xs flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name & Country */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Nombre de Marca *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Suzuki, Honda"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                País de Origen
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Ej. Japón, Italia"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
              Logo / Imagen de la Marca
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 shrink-0 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                {logoPreviewUrl || logo ? (
                  <img
                    src={logoPreviewUrl || logo}
                    alt="Logo de la marca"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-7 h-7 text-slate-300" />
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
                    <span>{uploadingLogo ? 'Subiendo...' : 'Subir Imagen'}</span>
                  </button>
                  {pendingLogoFile && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                      Pendiente por guardar
                    </span>
                  )}
                  {(logoPreviewUrl || logo) && (
                    <button
                      type="button"
                      onClick={() => {
                        setPendingLogoFile(null);
                        setLogoPreviewUrl(null);
                        setLogo('');
                        if (logoFileInputRef.current) logoFileInputRef.current.value = '';
                      }}
                      className="px-3 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      Quitar
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  Selecciona una imagen desde tu equipo. Se subirá al almacenamiento al guardar.
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
              Descripción Corta
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Reseña del fabricante y líneas principales..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 font-medium resize-none"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-900">Estado de la Marca</p>
              <p className="text-[11px] text-slate-500 font-sans">Controla la visibilidad en el selector de garaje.</p>
            </div>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                active ? 'bg-[#059669]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  active ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploadingLogo}
              className="px-5 py-2.5 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all disabled:opacity-60"
            >
              {uploadingLogo ? 'Subiendo...' : brandToEdit ? 'Guardar Cambios' : 'Crear Marca'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
