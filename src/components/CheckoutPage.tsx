import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  ShieldCheck, 
  Building2, 
  Copy, 
  Check, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  Printer, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  MapPin, 
  CreditCard,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import type { CartItem, ActiveMotorcycle, UserProfile, Order } from '../types';
import { getPrimaryOem } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { BANK_DETAILS } from '../data/bankDetails';

interface CheckoutPageProps {
  cartItems: CartItem[];
  activeMotorcycle: ActiveMotorcycle | null;
  userProfile: UserProfile | null;
  isLoggedIn: boolean;
  onOrderComplete: (order: Order) => void;
  onClearCart: () => void;
  onNavigateToCatalog: () => void;
  onNavigateToOrders: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  cartItems,
  activeMotorcycle,
  userProfile,
  isLoggedIn,
  onOrderComplete,
  onClearCart,
  onNavigateToCatalog,
  onNavigateToOrders
}) => {
  // Form fields
  const [formData, setFormData] = useState({
    fullName: userProfile?.fullName || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
    documentId: userProfile?.documentId || '',
    city: userProfile?.city || 'Bogotá D.C.',
    address: userProfile?.address || '',
    postalCode: userProfile?.postalCode || '110111'
  });

  // Pre-fill form if user logs in or profile updates
  useEffect(() => {
    if (userProfile && isLoggedIn) {
      setFormData({
        fullName: userProfile.fullName || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        documentId: userProfile.documentId || '',
        city: userProfile.city || 'Bogotá D.C.',
        address: userProfile.address || '',
        postalCode: userProfile.postalCode || '110111'
      });
    }
  }, [userProfile, isLoggedIn]);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const totalAmount = cartItems.reduce((acc, item) => acc + (item.part.price * item.quantity), 0);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.phone || !formData.documentId || !formData.city || !formData.address) {
      setErrorMessage('Por favor completa todos los campos requeridos para el despacho.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const orderId = 'SZ-ORD-' + Math.floor(100000 + Math.random() * 900000);
      const guaranteeCode = 'SZ-CERT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const orderDate = new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      const newOrder: Order = {
        id: orderId,
        date: orderDate,
        customerName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        documentId: formData.documentId,
        city: formData.city,
        shippingAddress: `${formData.address}, ${formData.city}`,
        postalCode: formData.postalCode,
        items: [...cartItems],
        totalPrice: totalAmount,
        motorcycle: activeMotorcycle,
        guaranteeCode,
        paymentMethod: 'transferencia',
        status: 'Pendiente de pago',
        paymentReference: orderId
      };

      setCompletedOrder(newOrder);
      onOrderComplete(newOrder);
      onClearCart();
      setIsSubmitting(false);
    }, 1000);
  };

  // 1. EMPTY CART STATE
  if (!completedOrder && cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#E60012] flex items-center justify-center mx-auto mb-4 border border-red-100">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Tu carrito está vacío</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            No tienes repuestos agregados para completar tu pedido. Explora nuestro catálogo de repuestos genuinos Suzuki con garantía de ajuste por modelo.
          </p>
          <button
            type="button"
            onClick={onNavigateToCatalog}
            className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-500/20 cursor-pointer"
          >
            <span>Explorar Catálogo Suzuki OEM</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 2. SUCCESS POST-CONFIRMATION VIEW
  if (completedOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          
          {/* Header Status Banner */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-300" />
                      {completedOrder.status}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">¡Pedido Registrado Exitosamente!</h1>
                  <p className="text-xs text-slate-300">Realiza la transferencia bancaria para confirmar la preparación de tu despacho.</p>
                </div>
              </div>

              <div className="bg-slate-800/90 backdrop-blur-xs p-3 sm:p-4 rounded-2xl border border-slate-700 text-center min-w-[160px]">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Nº DE ORDEN</span>
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  <span className="font-mono font-black text-amber-400 text-lg">{completedOrder.id}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(completedOrder.id, 'orderId')}
                    className="text-slate-400 hover:text-white transition-colors"
                    title="Copiar Número de Orden"
                  >
                    {copiedField === 'orderId' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Bank Details Card for Transfer */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black text-sm shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">Datos Bancarios para Transferencia</h3>
                    <p className="text-xs text-slate-400">{BANK_DETAILS.instructions}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">TOTAL A TRANSFERIR</span>
                  <span className="text-lg font-mono font-black text-emerald-400">{formatCurrency(completedOrder.totalPrice)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">BANCO & TIPO</span>
                  <span className="font-black text-white text-sm">{BANK_DETAILS.bankName}</span>
                  <span className="text-slate-300 block">{BANK_DETAILS.accountType}</span>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">NÚMERO DE CUENTA</span>
                    <span className="font-mono font-black text-amber-400 text-sm">{BANK_DETAILS.accountNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(BANK_DETAILS.accountNumber, 'accNo')}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
                    title="Copiar número de cuenta"
                  >
                    {copiedField === 'accNo' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">TITULAR DE LA CUENTA</span>
                  <span className="font-bold text-white block">{BANK_DETAILS.accountHolder}</span>
                  <span className="text-slate-400 font-mono text-[11px]">NIT: {BANK_DETAILS.nit}</span>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">REFERENCIA DE PAGO</span>
                    <span className="font-mono font-black text-amber-400 text-sm">{completedOrder.paymentReference}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(completedOrder.paymentReference || completedOrder.id, 'refNo')}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
                    title="Copiar referencia"
                  >
                    {copiedField === 'refNo' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Items Summary Table */}
            <div>
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2">
                DESPACHO REGISTRADO ({completedOrder.items.length} REPUESTOS):
              </h4>
              <div className="space-y-2">
                {completedOrder.items.map((it, idx) => {
                  const bikeLabel = it.motorcycle 
                    ? `${it.motorcycle.brand} ${it.motorcycle.modelName} (${it.motorcycle.year})`
                    : (completedOrder.motorcycle ? `${completedOrder.motorcycle.brand} ${completedOrder.motorcycle.modelName} (${completedOrder.motorcycle.year})` : 'Compatibilidad General');

                  return (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <img src={it.part.image} alt={it.part.name} className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-100 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#E60012] text-[10px]">{getPrimaryOem(it.part)}</span>
                            <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                              🏍️ {bikeLabel}
                            </span>
                          </div>
                          <h5 className="font-bold text-slate-900 mt-0.5">{it.part.name}</h5>
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-900">
                        {it.quantity}x - {formatCurrency(it.part.price * it.quantity)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>


            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Instrucciones</span>
              </button>

              <button
                type="button"
                onClick={onNavigateToOrders}
                className="w-full sm:w-auto px-8 py-3 bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Ver Mis Pedidos</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // 3. MAIN CHECKOUT FORM PAGE (2-COLUMN LAYOUT)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      
      {/* Page Title Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Completar Pedido</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Diligencia tus datos de despacho para generar el certificado de garantía y recibir la instrucción de pago por transferencia.
        </p>
      </div>

      {/* Mobile Collapsible Cart Summary Trigger */}
      <div className="lg:hidden mb-6">
        <button
          type="button"
          onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
          className="w-full p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-900 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#E60012]" />
            <span>Ver Resumen del Carrito ({cartItems.length} ítems)</span>
          </div>
          <div className="flex items-center gap-2 font-mono font-black text-slate-900">
            <span>{formatCurrency(totalAmount)}</span>
            {mobileSummaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {mobileSummaryOpen && (
          <div className="mt-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 animate-in fade-in duration-150">
            {cartItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0">
                <span className="font-medium text-slate-800 line-clamp-1">{item.part.name} (x{item.quantity})</span>
                <span className="font-mono font-bold text-slate-900 shrink-0">{formatCurrency(item.part.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2-Column Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Shipping Form & Payment Method (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          
          <form onSubmit={handleSubmitOrder} className="space-y-6">
            
            {/* Form Section 1: Customer & Shipping Data */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E60012] flex items-center justify-center font-bold shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Datos de Despacho & Facturación</h2>
                    <p className="text-xs text-slate-500">Ingresa el destinatario exacto para la guía de transporte</p>
                  </div>
                </div>

                {isLoggedIn && (
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Pre-llenado de Perfil
                  </span>
                )}
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="sm:col-span-2">
                  <label htmlFor="fullName" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Nombre Completo o Razón Social <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Ej. Taller Mecánico Motos o Juan Pérez"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Correo Electrónico <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="cliente@ejemplo.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Teléfono Móvil (WhatsApp) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+57 310 982 7311"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="documentId" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Cédula / NIT (Facturación) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="documentId"
                      name="documentId"
                      type="text"
                      required
                      value={formData.documentId}
                      onChange={handleInputChange}
                      placeholder="Ej. 1.098.472.910"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="city" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Ciudad / Municipio <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Ej. Bogotá, Medellín, Cali..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Dirección Completa de Despacho / Taller <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="address"
                      name="address"
                      type="text"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Ej. Av. Central #450, Barrio / Taller Mecánico"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="postalCode" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Código Postal <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="postalCode"
                    name="postalCode"
                    type="text"
                    required
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="Ej. 110111"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                  />
                </div>

              </div>
            </div>

            {/* Form Section 2: Payment Method */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Método de Pago</h2>
                  <p className="text-xs text-slate-500">Seleccionado por defecto para agilizar tu compra</p>
                </div>
              </div>

              {/* Transferencia Option Card */}
              <div className="bg-amber-50/60 border-2 border-amber-400 p-5 rounded-2xl flex items-start gap-4">
                <input
                  type="radio"
                  name="paymentMethod"
                  id="transferencia"
                  checked
                  readOnly
                  className="mt-1 w-4 h-4 text-[#E60012] focus:ring-[#E60012]"
                />
                <label htmlFor="transferencia" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">Transferencia Bancaria (Bancolombia)</span>
                    <span className="bg-amber-200 text-amber-900 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Al confirmar el pedido recibirás el número de orden y la cuenta Bancolombia habilitada. Tu pedido quedará registrado en estado <strong>"Pendiente de pago"</strong> hasta confirmar tu transferencia.
                  </p>
                </label>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-red-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Generando Pedido...</span>
              ) : (
                <>
                  <span>Confirmar Pedido & Ver Datos de Pago</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

          </form>

        </div>

        {/* RIGHT COLUMN: Cart Summary & Bank Details Side Box (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Cart Summary Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3 mb-4">
              Resumen del Pedido ({cartItems.length} ítems)
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cartItems.map((item, idx) => {
                const itemBikeLabel = item.motorcycle
                  ? `${item.motorcycle.brand} ${item.motorcycle.modelName} (${item.motorcycle.year})`
                  : (activeMotorcycle ? `${activeMotorcycle.brand} ${activeMotorcycle.modelName}` : 'Suzuki Universal');

                return (
                  <div key={idx} className="flex items-center justify-between gap-3 text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <img src={item.part.image} alt={item.part.name} className="w-10 h-10 rounded-lg object-cover bg-white border border-slate-100 shrink-0" />
                      <div>
                        <span className="font-mono text-[9px] font-bold text-[#E60012] block">{getPrimaryOem(item.part)}</span>
                        <span className="font-bold text-slate-900 line-clamp-1">{item.part.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500 font-medium">Cant: {item.quantity}</span>
                          <span className="text-[9px] font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                            🏍️ {itemBikeLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="font-mono font-black text-slate-900 shrink-0">
                      {formatCurrency(item.part.price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>


            <div className="border-t border-slate-100 pt-4 mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal repuestos:</span>
                <span className="font-mono font-bold">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Costo de Despacho Nacional:</span>
                <span className="font-bold text-emerald-600">Gratis ($0)</span>
              </div>
              <div className="flex items-center justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Final:</span>
                <span className="font-mono text-xl text-[#E60012]">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Bank Details Sidebar Preview */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Building2 className="w-4 h-4" />
              <span>Cuenta de Transferencia Directa</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between bg-slate-800/80 p-2.5 rounded-xl">
                <span className="text-slate-400 font-medium">Banco:</span>
                <span className="font-bold text-white">{BANK_DETAILS.bankName}</span>
              </div>

              <div className="flex items-center justify-between bg-slate-800/80 p-2.5 rounded-xl">
                <span className="text-slate-400 font-medium">Nº Cuenta:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-black text-amber-400">{BANK_DETAILS.accountNumber}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(BANK_DETAILS.accountNumber, 'sidebarAcc')}
                    className="text-slate-400 hover:text-white p-1"
                    title="Copiar cuenta"
                  >
                    {copiedField === 'sidebarAcc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-800/80 p-2.5 rounded-xl">
                <span className="text-slate-400 font-medium">Titular / NIT:</span>
                <span className="font-mono text-[11px] text-slate-200">{BANK_DETAILS.nit}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
