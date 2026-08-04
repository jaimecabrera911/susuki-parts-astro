import React from 'react';
import { X, HelpCircle, MapPin, Search, Info, ShieldCheck } from 'lucide-react';

interface IdentificationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IdentificationGuideModal: React.FC<IdentificationGuideModalProps> = ({ isOpen, onClose }) => {
  // Handle Escape key and body scroll lock
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="id-guide-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 my-auto"
      >
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar guía de localización VIN"
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-slate-500 hover:text-slate-700 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-[#E60012] flex items-center justify-center font-bold shrink-0">
            <Search className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 id="id-guide-modal-title" className="text-xl font-black text-slate-900">Guía de Localización VIN y Placa Técnica</h3>
            <p className="text-xs text-slate-500">Ubicaciones físicas estándar en motocicletas Suzuki Genuine</p>
          </div>
        </div>

        <div className="space-y-6 text-sm">
          
          {/* Section 1: Frame VIN */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Número VIN / Chasis (17 Dígitos)</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Ubicado grabado directamente con punzón de impacto en la columna de dirección (pipa o cuello del marco) del lado derecho.
              </p>
              <div className="mt-2 bg-white p-2 rounded border border-slate-200 font-mono text-xs text-slate-800">
                Estructura Suzuki: <span className="font-bold text-[#E60012]">JS1</span> [Modelo] [Año/Planta] [Serie]
              </div>
            </div>
          </div>

          {/* Section 2: Engine Serial */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Código & Serie del Motor</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Grabado en el cárter metálico superior o inferior izquierdo cerca del piñón de ataque de la cadena o debajo del cilindro.
              </p>
              <div className="mt-2 bg-white p-2 rounded border border-slate-200 font-mono text-xs text-slate-800">
                Ejemplo: <span className="font-bold text-slate-900">F408-882910</span> (Indica desplazamiento y tipo de cilindro)
              </div>
            </div>
          </div>

          {/* Section 3: Color Code & Model Label */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Etiqueta de Código de Color y Trim</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Ubicada en una pegatina negra debajo del sillín del piloto o en la barra inferior del chasis. Muestra el código de pintura (Ej. YVB - Glass Sparkle Black).
              </p>
            </div>
          </div>

        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
          >
            Entendido, Volver
          </button>
        </div>

      </div>
    </div>
  );
};
