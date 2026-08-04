import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, Wrench, ShieldCheck, RefreshCw } from 'lucide-react';
import type { ActiveMotorcycle } from '../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMotorcycle: ActiveMotorcycle | null;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  activeMotorcycle
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: `¡Hola! Soy tu **Asistente Técnico Suzuki Expert** powered by Gemini AI.\n\nPuedo responder tus dudas mecánicas, verificar pares de apriete, sugerir lubricantes OEM y validar códigos de piezas para tu ${activeMotorcycle ? `${activeMotorcycle.brand} ${activeMotorcycle.modelName} (${activeMotorcycle.year})` : 'motocicleta'}.`
    }
  ]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages or loading state changes
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
        text: data.text || 'Respuesta generada correctamente.'
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-2xl w-full h-[85vh] max-h-[640px] flex flex-col shadow-2xl relative border border-slate-200 overflow-hidden my-auto"
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
          <button
            type="button"
            onClick={() => handleSend("¿Cómo verificar la compatibilidad por número de parte OEM?")}
            className="bg-white hover:bg-slate-200 text-slate-800 px-3 py-1.5 min-h-[36px] rounded-lg border border-slate-300 shrink-0 font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
          >
            Verificar Códigos OEM
          </button>
        </div>

        {/* Message Log with Live Region for Screen Readers */}
        <div role="log" aria-live="polite" className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 font-bold ${
                m.sender === 'user' ? 'bg-slate-900 text-white' : 'bg-[#E60012] text-white'
              }`}>
                {m.sender === 'user' ? <User className="w-4 h-4" aria-hidden="true" /> : <Bot className="w-4 h-4" aria-hidden="true" />}
              </div>

              <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                m.sender === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-xs' 
                  : 'bg-white border border-slate-200 text-slate-800 shadow-xs rounded-tl-xs'
              }`}>
                {m.text}
              </div>
            </div>
          ))}

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
            placeholder="Escribe tu consulta técnica o duda de repuesto..."
            className="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
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
