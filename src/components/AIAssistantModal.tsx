import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Send, Bot, User, Wrench, ShieldCheck, RefreshCw, Eye, Package, CheckCircle2, AlertTriangle } from 'lucide-react';
import { FaCartPlus } from 'react-icons/fa6';
import type { ActiveMotorcycle, SuzukiPart } from '../types';
import { getPrimaryOem } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { shouldShowProductImages } from '../utils/config';
import { ProductImageFallback } from './ProductImageFallback';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMotorcycle: ActiveMotorcycle | null;
  partsList?: SuzukiPart[];
  onOpenDetail?: (part: SuzukiPart) => void;
  onAddToCart?: (part: SuzukiPart) => void;
  onOpenGarageModal?: () => void;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  recommendedOems?: string[];
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  activeMotorcycle,
  partsList = [],
  onOpenDetail,
  onAddToCart,
  onOpenGarageModal
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: `¡Hola! Soy tu **Asistente Técnico Suzuki Expert** powered by Gemini AI.\n\nPuedo responder tus dudas mecánicas, verificar pares de apriete, sugerir lubricantes OEM y validar códigos de piezas para tu ${activeMotorcycle ? `${activeMotorcycle.brand} ${activeMotorcycle.modelName} (${activeMotorcycle.year})` : 'motocicleta'}.`
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle Escape key and body scroll lock
  useEffect(() => {
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

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          motorcycle: activeMotorcycle
        })
      });

      const data = await res.json();
      const botMsg: Message = {
        sender: 'assistant',
        text: data.text || 'Respuesta generada correctamente.',
        recommendedOems: data.recommendedOems || []
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { sender: 'assistant', text: 'Ocurrió un error al consultar al especialista técnico.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-assistant-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto"
    >

      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-2xl w-full h-[85vh] max-h-[660px] flex flex-col shadow-2xl relative border border-slate-200 overflow-hidden my-auto"
      >
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E60012] flex items-center justify-center text-white font-black shadow-xs shrink-0">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="ai-assistant-modal-title" className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <span>Suzuki Master AI Specialist</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">
                  ONLINE
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {activeMotorcycle ? `Garaje: ${activeMotorcycle.modelName} (${activeMotorcycle.year})` : 'Sin moto seleccionada'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar asistente técnico AI"
            className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-slate-100 p-2.5 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          <span className="text-slate-600 font-bold text-[10px] uppercase shrink-0">Consultas:</span>
          <button
            type="button"
            onClick={() => handleSend("¿Qué repuestos y aceite le sirven a mi moto Suzuki?")}
            className="bg-white hover:bg-slate-200 text-slate-800 px-3 py-1.5 min-h-[36px] rounded-lg border border-slate-300 shrink-0 font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
          >
            ¿Qué producto le sirve a mi moto?
          </button>
          <button
            type="button"
            onClick={() => handleSend("¿Qué aceite y filtro necesita mi Suzuki según manual de fábrica?")}
            className="bg-white hover:bg-slate-200 text-slate-800 px-3 py-1.5 min-h-[36px] rounded-lg border border-slate-300 shrink-0 font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
          >
            Filtros & Aceite recomendados
          </button>
          <button
            type="button"
            onClick={() => handleSend("¿Cuáles son los síntomas de falla de la bomba de combustible?")}
            className="bg-white hover:bg-slate-200 text-slate-800 px-3 py-1.5 min-h-[36px] rounded-lg border border-slate-300 shrink-0 font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
          >
            Diagnóstico de Inyección
          </button>
        </div>

        {/* Message Log */}
        <div role="log" aria-live="polite" className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
          {messages.map((m, idx) => {
            // Find matched SuzukiPart objects from catalog
            const matchedParts = m.recommendedOems && m.recommendedOems.length > 0
              ? partsList.filter(part => 
                  part.oemNumbers.some(oem => m.recommendedOems?.includes(oem)) ||
                  m.recommendedOems?.includes(part.id)
                )
              : [];

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 font-bold ${
                  m.sender === 'user' ? 'bg-slate-900 text-white' : 'bg-[#E60012] text-white'
                }`}>
                  {m.sender === 'user' ? <User className="w-4 h-4" aria-hidden="true" /> : <Bot className="w-4 h-4" aria-hidden="true" />}
                </div>

                <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                  m.sender === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-xs whitespace-pre-wrap' 
                    : 'bg-white border border-slate-200 text-slate-800 shadow-xs rounded-tl-xs'
                }`}>
                  <div className="whitespace-pre-wrap">{m.text}</div>

                  {/* Render Product Cards inside Assistant Chat */}
                  {m.sender === 'assistant' && matchedParts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                        <Package className="w-3.5 h-3.5 text-[#E60012]" />
                        <span>Repuestos Compatibles Recomendados ({matchedParts.length})</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {matchedParts.map((part) => {
                          const isCompatible = activeMotorcycle
                            ? (part.compatibility || []).some(cm => cm.modelId === activeMotorcycle.modelId || cm.modelId === 'all')
                            : true;


                          return (
                            <div key={part.id} className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-2.5 flex flex-col justify-between gap-2 shadow-2xs transition-all">
                              <div className="flex items-start gap-2.5">
                                {shouldShowProductImages() ? (
                                  <img 
                                    src={part.image} 
                                    alt={part.name} 
                                    className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200 shrink-0" 
                                  />
                                ) : (
                                  <ProductImageFallback part={part} size="sm" className="w-12 h-12 shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-mono text-[9px] font-bold text-[#E60012] truncate">
                                      {getPrimaryOem(part)}
                                    </span>
                                    {activeMotorcycle && isCompatible && (
                                      <span className="text-[8px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5 shrink-0">
                                        <CheckCircle2 className="w-2.5 h-2.5" /> Compatible
                                      </span>
                                    )}
                                  </div>
                                  <h5 className="font-bold text-slate-900 text-xs line-clamp-1 mt-0.5">{part.name}</h5>
                                  <span className="font-mono font-black text-slate-900 text-xs block mt-0.5">
                                    {formatCurrency(part.price)}
                                  </span>
                                </div>
                              </div>

                              {/* Interactive Product Actions */}
                              <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200/60">
                                {onOpenDetail && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onOpenDetail(part);
                                    }}
                                    className="flex-1 py-1.5 px-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-[10px] uppercase rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                    title="Ver Ficha Técnica"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Detalles</span>
                                  </button>
                                )}

                                {onAddToCart && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onAddToCart(part);
                                    }}
                                    className="flex-1 py-1.5 px-2 bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-[10px] uppercase rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                    title="Añadir al Carrito"
                                  >
                                    <FaCartPlus className="w-3 h-3" />
                                    <span>Añadir</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium p-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#E60012]" aria-hidden="true" />
              <span>Consultando especificaciones del manual Suzuki Genuine Parts...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
          <label htmlFor="ai-assistant-input" className="sr-only">Escribe tu consulta técnica</label>
          <input
            id="ai-assistant-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ej: ¿Qué productos le sirven a mi moto?"
            className="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus-ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="w-11 h-11 flex items-center justify-center bg-[#E60012] hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
            aria-label="Enviar mensaje al asistente AI"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

      </div>
    </div>
  );
};
