import React from 'react';
import { Lock, ArrowRight } from 'lucide-react';

interface AuthRequiredProps {
  onLogin: () => void;
  title?: string;
  description?: string;
  onGoHome?: () => void;
}

export const AuthRequired: React.FC<AuthRequiredProps> = ({
  onLogin,
  title = 'Acceso restringido',
  description = 'Inicia sesión para ver esta sección. Protege tus datos personales, pedidos y repuestos guardados.',
  onGoHome
}) => {
  return (
    <div id="auth-required" className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-5 border border-amber-100">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 font-display mb-2">{title}</h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">{description}</p>
        <button
          type="button"
          onClick={onLogin}
          className="w-full py-3 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Lock className="w-4 h-4" />
          Iniciar Sesión
        </button>
        {onGoHome && (
          <button
            type="button"
            onClick={onGoHome}
            className="mt-3 w-full py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Volver al Garaje
          </button>
        )}
      </div>
    </div>
  );
};