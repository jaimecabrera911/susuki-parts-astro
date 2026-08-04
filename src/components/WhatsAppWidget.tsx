import React, { useState } from 'react';
import { X, Send, ShieldCheck, MessageSquare, ChevronRight, HelpCircle, PhoneCall } from 'lucide-react';
import type { ActiveMotorcycle } from '../types';
import { getGeneralWhatsAppUrl, SUZUKI_WHATSAPP_NUMBER } from '../utils/whatsapp';

interface WhatsAppWidgetProps {
  activeMotorcycle: ActiveMotorcycle | null;
  onOpenGarageModal: () => void;
}

export const WhatsAppWidget: React.FC<WhatsAppWidgetProps> = ({
  activeMotorcycle,
  onOpenGarageModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customQuery, setCustomQuery] = useState('');

  // Handle Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleCustomSend = (e: React.FormEvent) => {
    e.preventDefault();
    let text = `Hola Suzuki Parts Expert 👋, `;
    if (customQuery.trim()) {
      text += `${customQuery.trim()}`;
    } else {
      text += `necesito información sobre repuestos genuinos.`;
    }

    if (activeMotorcycle) {
      text += `\n\n🏍️ *Mi Moto:* ${activeMotorcycle.brand} ${activeMotorcycle.modelName} (${activeMotorcycle.year})`;
      if (activeMotorcycle.vin) text += `\n🔑 *VIN:* ${activeMotorcycle.vin}`;
    }

    const url = `https://wa.me/${SUZUKI_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
    setCustomQuery('');
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {/* Popover Card */}
      {isOpen && (
        <div 
          role="dialog"
          aria-modal="false"
          aria-label="Asistente de consulta rápida WhatsApp"
          className="mb-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="bg-[#075E54] text-white p-4 flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center border-2 border-white/80 text-white font-extrabold text-sm">
                  SZ
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#075E54] rounded-full"></span>
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  Suzuki Parts Expert
                </h4>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                  En línea | Asesoría Técnica Directa
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar ventana de WhatsApp"
              className="w-11 h-11 flex items-center justify-center text-emerald-100 hover:text-white rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Active Motorcycle Banner in Widget */}
          <div className="bg-slate-50 border-b border-slate-200 p-3 px-4 text-xs">
            {activeMotorcycle ? (
              <div className="flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Contexto de tu consulta</span>
                    <span className="font-extrabold text-slate-900">{activeMotorcycle.modelName} ({activeMotorcycle.year})</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenGarageModal}
                  className="text-[10px] font-bold text-[#E60012] hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] rounded"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">¿Deseas verificar con un modelo específico?</span>
                <button
                  type="button"
                  onClick={onOpenGarageModal}
                  className="text-[10px] font-extrabold text-[#E60012] bg-red-50 hover:bg-red-100 px-2 py-1 rounded border border-red-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                >
                  + Seleccionar Moto
                </button>
              </div>
            )}
          </div>

          {/* Quick Chat Form */}
          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              ¿Tienes dudas sobre un número de parte OEM, compatibilidad o envíos nacionales? Escríbenos directamente:
            </p>

            <form onSubmit={handleCustomSend} className="space-y-2">
              <label htmlFor="whatsapp-custom-query" className="sr-only">Escribe tu consulta o referencia de repuesto</label>
              <textarea
                id="whatsapp-custom-query"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Escribe tu consulta o referencia de repuesto..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none resize-none h-20 text-slate-900 placeholder:text-slate-500"
              />
              <button
                type="submit"
                className="w-full py-2.5 px-4 min-h-[44px] bg-[#25D366] hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075E54]"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>Enviar a WhatsApp</span>
              </button>
            </form>

            {/* Direct Quick Option Links */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <a
                href={getGeneralWhatsAppUrl(activeMotorcycle)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075E54]"
              >
                <span className="flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  Abrir Chat Directo con Asesor
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 bg-[#25D366] hover:bg-emerald-600 text-white p-3.5 sm:px-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400"
        aria-label={isOpen ? "Cerrar consulta por WhatsApp" : "Consultar por WhatsApp"}
      >
        <svg
          className="w-6 h-6 fill-current shrink-0"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414zM12.01 2.003c-5.504 0-9.976 4.471-9.976 9.974 0 1.759.458 3.475 1.33 4.988l-1.416 5.17 5.29-1.388c1.458.796 3.104 1.215 4.772 1.215 5.505 0 9.977-4.472 9.977-9.974 0-2.665-1.037-5.17-2.92-7.054a9.907 9.907 0 0 0-7.057-2.932z"/>
        </svg>

        <span className="font-extrabold text-xs tracking-wider hidden sm:inline uppercase">
          Consultar WhatsApp
        </span>
      </button>
    </div>
  );
};
