import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Mail, Lock, User, Phone, CheckCircle2, Sparkles, LogIn, ArrowRight, Zap } from 'lucide-react';
import type { UserProfile } from '../types';
import { saveUserApi } from '../services/api';
import { STORE_DEFAULT_LOCATION } from '../utils/config';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Form states
  const [loginEmail, setLoginEmail] = useState('juan.perez@mototaller.com');
  const [loginPassword, setLoginPassword] = useState('••••••••');
  
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      // Demo successful login
      const demoUser: UserProfile = {
        id: 'USR-8849',
        fullName: loginEmail.includes('juan') ? 'Juan Pérez' : loginEmail.split('@')[0],
        email: loginEmail,
        phone: '+57 310 982 7311',
        documentId: '1.098.472.910',
        city: STORE_DEFAULT_LOCATION.city,
        address: 'Av. Central #450, Taller Mecánico Motos',
        postalCode: '110111',
        favoritePartIds: ['suzuki-gsxr-1000-air-filter', 'suzuki-gixxer-150-brake-pads'],
        createdAt: 'Marzo 2024'
      };
      onLoginSuccess(demoUser);
      onClose();
    }, 800);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword) {
      setErrorMsg('Por favor completa todos los campos requeridos.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    const newUser: UserProfile = {
      id: 'USR-' + Math.floor(1000 + Math.random() * 9000),
      fullName: registerName,
      email: registerEmail,
      phone: registerPhone || '+57 300 000 0000',
      documentId: 'No registrado',
      city: STORE_DEFAULT_LOCATION.city,
      address: 'Dirección por definir',
      postalCode: '110111',
      favoritePartIds: [],
      createdAt: new Date().toISOString()
    };

    try {
      await saveUserApi(newUser);
    } catch (err) {
      console.error('Error registrando usuario en BD:', err);
    }

    setIsSubmitting(false);
    onLoginSuccess(newUser);
    onClose();
  };

  const handleQuickDemoLogin = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const demoUser: UserProfile = {
        id: 'USR-8849',
        fullName: 'Juan Pérez',
        email: 'juan.perez@mototaller.com',
        phone: '+57 310 982 7311',
        documentId: '1.098.472.910',
        city: STORE_DEFAULT_LOCATION.city,
        address: 'Av. Central #450, Taller Mecánico Motos',
        postalCode: '110111',
        favoritePartIds: ['suzuki-gsxr-1000-air-filter', 'suzuki-gixxer-150-brake-pads'],
        createdAt: 'Marzo 2024'
      };
      onLoginSuccess(demoUser);
      onClose();
    }, 500);
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Decorative Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E60012] via-red-600 to-amber-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana de inicio de sesión"
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center pt-2 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#E60012] text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md shadow-red-500/30 mb-3">
            S
          </div>
          <h2 id="auth-modal-title" className="text-xl font-black text-slate-900 tracking-tight">
            Acceso Clientes Suzuki OEM
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ingresa a tu cuenta para gestionar tu garaje, pedidos y repuestos favoritos
          </p>
        </div>

        {/* Tabs Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {/* TAB 1: LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ejemplo@mototaller.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-[#E60012] focus:ring-[#E60012]" />
                Recordarme
              </label>
              <a href="#recuperar" onClick={(e) => e.preventDefault()} className="text-[#E60012] hover:underline font-bold">
                ¿Olvidaste tu clave?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-500/20 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <span>Ingresando...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Ingresar a Mi Cuenta</span>
                </>
              )}
            </button>

            {/* Quick Demo Login Option */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-800"
              >
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Acceso Rápido Demo (Juan Pérez)</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: REGISTER FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="carlos@ejemplo.com"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Teléfono / WhatsApp
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="reg-phone"
                  type="tel"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  placeholder="+57 300 123 4567"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-pass" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="reg-pass"
                  type="password"
                  required
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-500/20 cursor-pointer flex items-center justify-center gap-2 mt-3"
            >
              {isSubmitting ? (
                <span>Creando Cuenta...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Crear Mi Cuenta Suzuki</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
