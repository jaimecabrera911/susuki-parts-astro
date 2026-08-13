import React, { useState } from 'react';
import {
  Package,
  CheckCircle2,
  Truck,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Building2,
  AlertTriangle,
  ShieldCheck,
  Navigation
} from 'lucide-react';
import { getCarrierBadgeInfo, getCarrierTrackingUrl } from '../utils/carrierTracking';

interface OrderTrackingSectionProps {
  order: any;
}

interface StepItem {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
}

export const OrderTrackingSection: React.FC<OrderTrackingSectionProps> = ({ order }) => {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const rawStatus = (order.status || '').toLowerCase().trim();
  const carrierName = order.shippingCarrier || order.shippingMethodName || '';
  const isStorePickup =
    carrierName.toLowerCase().includes('retiro') ||
    carrierName.toLowerCase().includes('tienda') ||
    carrierName.toLowerCase().includes('recogida') ||
    (order.shippingMethodName || '').toLowerCase().includes('retiro');

  const isCancelled = rawStatus.includes('cancelad') || rawStatus.includes('anulad');

  // Compute active step index
  const getActiveStepIndex = (): number => {
    if (isCancelled) return -1;

    if (rawStatus.includes('entregad') || rawStatus.includes('recibid')) {
      return isStorePickup ? 3 : 4;
    }
    if (rawStatus.includes('tránsito') || rawStatus.includes('transito') || rawStatus.includes('enviad')) {
      return isStorePickup ? 2 : 3;
    }
    if (
      rawStatus.includes('preparación') ||
      rawStatus.includes('preparacion') ||
      rawStatus.includes('bodega') ||
      rawStatus.includes('empacando') ||
      rawStatus.includes('despachad')
    ) {
      return isStorePickup ? 2 : 2;
    }
    if (rawStatus.includes('confirmad') || rawStatus.includes('aprobad') || rawStatus.includes('verificad')) {
      return 1;
    }
    // Default: Pendiente / Recibido
    return 0;
  };

  const activeStep = getActiveStepIndex();

  // Define steps for Delivery vs Store Pickup
  const standardSteps: StepItem[] = [
    {
      id: 'recibido',
      label: '1. Pedido Recibido',
      sublabel: 'Registrado en el sistema',
      icon: Package
    },
    {
      id: 'pago',
      label: '2. Pago Confirmado',
      sublabel: 'Comprobante verificado',
      icon: ShieldCheck
    },
    {
      id: 'bodega',
      label: '3. En Preparación',
      sublabel: 'Empacando repuestos OEM',
      icon: Clock
    },
    {
      id: 'transito',
      label: '4. En Tránsito',
      sublabel: 'En manos de transportadora',
      icon: Truck
    },
    {
      id: 'entregado',
      label: '5. Entregado',
      sublabel: 'Paquete recibido con éxito',
      icon: CheckCircle2
    }
  ];

  const pickupSteps: StepItem[] = [
    {
      id: 'recibido',
      label: '1. Pedido Recibido',
      sublabel: 'Registrado en el sistema',
      icon: Package
    },
    {
      id: 'pago',
      label: '2. Pago Confirmado',
      sublabel: 'Comprobante verificado',
      icon: ShieldCheck
    },
    {
      id: 'listo',
      label: '3. Listo para Recoger',
      sublabel: 'Disponible en sede Suzuki',
      icon: Building2
    },
    {
      id: 'entregado',
      label: '4. Entregado en Tienda',
      sublabel: 'Retirado por el cliente',
      icon: CheckCircle2
    }
  ];

  const steps = isStorePickup ? pickupSteps : standardSteps;
  const badgeInfo = getCarrierBadgeInfo(carrierName);
  const trackingUrl = getCarrierTrackingUrl(carrierName, order.trackingNumber, order.trackingUrl);

  const handleCopyGuide = () => {
    if (!order.trackingNumber) return;
    navigator.clipboard.writeText(order.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="order-tracking-section"
      className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 space-y-6 my-4 overflow-hidden relative"
    >
      {/* Top Background Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-red-500 animate-pulse" />
            <h3 className="text-base sm:text-lg font-black font-display tracking-tight text-white">
              Seguimiento del Envío
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Estado e itinerario actualizado de tu repuesto Suzuki
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono font-bold uppercase px-3 py-1 rounded-full border ${badgeInfo.badgeBg} ${badgeInfo.badgeText} ${badgeInfo.badgeBorder}`}
          >
            {isStorePickup ? '🏬 Retiro en Tienda' : `🚛 ${badgeInfo.name}`}
          </span>
        </div>
      </div>

      {/* CANCELLED ORDER BANNER */}
      {isCancelled ? (
        <div className="bg-red-950/80 border border-red-800 text-red-200 p-4 rounded-2xl flex items-start gap-3 shadow-inner">
          <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-extrabold text-sm font-display text-white">
              Pedido Anulado / Cancelado
            </h4>
            <p className="text-xs text-red-300 mt-1 leading-relaxed">
              Este pedido ha sido cancelado. Si realizaste un pago o requieres soporte sobre el reembolso, puedes ponerte en contacto directamente a través del chat de atención ubicado abajo.
            </p>
          </div>
        </div>
      ) : (
        /* ACTIVE STEPPER PROGRESS BAR */
        <div className="py-2">
          {/* Progress bar container */}
          <div className="relative">
            {/* Desktop / Tablet Stepper (Horizontal) */}
            <div className="hidden md:grid grid-cols-5 gap-2 relative z-10">
              {steps.map((step, idx) => {
                const IconComponent = step.icon;
                const isDone = activeStep > idx;
                const isCurrent = activeStep === idx;

                return (
                  <div key={step.id} className="flex flex-col items-center text-center group">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all duration-300 shadow-md ${
                        isDone
                          ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20 scale-105'
                          : isCurrent
                          ? 'bg-red-600 text-white ring-4 ring-red-600/30 scale-110 shadow-red-600/30'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <span
                      className={`text-xs font-bold font-display mt-2 transition-colors ${
                        isDone
                          ? 'text-emerald-400'
                          : isCurrent
                          ? 'text-white font-extrabold'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </span>

                    <span className="text-[10px] text-slate-400 font-sans mt-0.5 leading-tight">
                      {step.sublabel}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Connecting Bar Line Behind Stepper (Desktop) */}
            <div className="hidden md:block absolute top-5 left-[10%] right-[10%] h-0.5 bg-slate-800 -z-0">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-emerald-500 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, (activeStep / (steps.length - 1)) * 100)
                  )}%`
                }}
              />
            </div>

            {/* Mobile Stepper (Vertical Compact List) */}
            <div className="md:hidden space-y-3 pl-2 border-l-2 border-slate-800 ml-3">
              {steps.map((step, idx) => {
                const IconComponent = step.icon;
                const isDone = activeStep > idx;
                const isCurrent = activeStep === idx;

                return (
                  <div key={step.id} className="flex items-center gap-3 relative -left-[17px]">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                        isDone
                          ? 'bg-emerald-500 text-slate-950 shadow-xs'
                          : isCurrent
                          ? 'bg-red-600 text-white ring-2 ring-red-600/40 shadow-xs'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`text-xs font-bold font-display ${
                          isDone
                            ? 'text-emerald-400'
                            : isCurrent
                            ? 'text-white'
                            : 'text-slate-500'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[10px] text-slate-400">{step.sublabel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CARRIER TRACKING DETAILS CARD OR STORE PICKUP CARD */}
      {!isCancelled && (
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          {isStorePickup ? (
            /* STORE PICKUP DETAILS */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-extrabold block">
                  PUNTO DE RECOGIDA DIRECTA
                </span>
                <div className="flex items-start gap-2 text-white font-bold font-display text-sm mt-1">
                  <Building2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>Sede Principal Suzuki Parts Colombia</span>
                </div>
                <p className="text-slate-300 text-xs pl-6">
                  Av. Principal N° 45-89, Bogotá D.C.
                </p>
                <p className="text-slate-400 text-[11px] pl-6">
                  Horario de Atención: Lunes a Viernes 8:00 AM - 5:30 PM | Sábados 8:00 AM - 1:00 PM
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 text-xs space-y-1">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                  INSTRUCCIONES DE RETIRO
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Para recibir tu pedido en mostrador, presenta tu{' '}
                  <strong className="text-white">Cédula de Ciudadanía</strong> y el número de pedido{' '}
                  <strong className="text-amber-400 font-mono">{order.id}</strong>.
                </p>
              </div>
            </div>
          ) : (
            /* CARRIER DELIVERY DETAILS */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-extrabold uppercase text-slate-400">
                    EMPRESA DE TRANSPORTE:
                  </span>
                  <span className="text-xs font-bold text-white font-display">
                    {carrierName || 'Servientrega'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-extrabold uppercase text-slate-400">
                    Nº DE GUÍA:
                  </span>
                  {order.trackingNumber ? (
                    <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-xl border border-slate-700">
                      <span className="font-mono text-sm font-black text-emerald-400 tracking-wider">
                        {order.trackingNumber}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyGuide}
                        className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Copiar Número de Guía"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-400 italic font-sans">
                      (Asignando número de guía en bodega...)
                    </span>
                  )}
                </div>
              </div>

              {/* External Tracking Action Button */}
              {trackingUrl ? (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <span>Rastrear en {badgeInfo.name}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <div className="text-slate-400 text-xs italic bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-700/50">
                  Rastreo en línea disponible al generar la guía
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
