import React from "react";
import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  MapPin,
  ExternalLink,
} from "lucide-react";
import type { Order } from "../types";
import { formatOrderDate } from "../utils/formatDate";
import { getCarrierTrackingUrl } from "../utils/tracking";

interface OrderStatusTimelineProps {
  order: Order;
  compact?: boolean;
}

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  order,
  compact = false,
}) => {
  const {
    status = "Pendiente de pago",
    trackingNumber,
    shippingCarrier,
    date,
    reservationExpiresAt,
  } = order;

  const [remainingSecs, setRemainingSecs] = React.useState<number>(() => {
    if (!reservationExpiresAt) return 0;
    return Math.max(0, Math.floor((new Date(reservationExpiresAt).getTime() - Date.now()) / 1000));
  });

  React.useEffect(() => {
    if (!reservationExpiresAt) return;
    const calc = () => {
      const diff = Math.max(0, Math.floor((new Date(reservationExpiresAt).getTime() - Date.now()) / 1000));
      setRemainingSecs(diff);
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [reservationExpiresAt]);

  const statusLower = status.toLowerCase();

  // Determine active step index (0 to 4)
  // 0: Pedido Registrado
  // 1: Pago Confirmado
  // 2: En Preparación
  // 3: Despachado / En Tránsito
  // 4: Entregado
  let currentStepIndex = 0;
  let isCancelled = false;

  if (statusLower.includes("cancelad") || statusLower.includes("anulad") || statusLower.includes("expirad")) {
    isCancelled = true;
    currentStepIndex = -1;
  } else if (statusLower.includes("entregad") || statusLower.includes("completad")) {
    currentStepIndex = 4;
  } else if (
    statusLower.includes("despachad") ||
    statusLower.includes("enviad") ||
    statusLower.includes("tránsito") ||
    statusLower.includes("transito") ||
    trackingNumber
  ) {
    currentStepIndex = 3;
  } else if (
    statusLower.includes("preparació") ||
    statusLower.includes("preparacio") ||
    statusLower.includes("bodega") ||
    statusLower.includes("empaque")
  ) {
    currentStepIndex = 2;
  } else if (
    statusLower.includes("pago") ||
    statusLower.includes("confirmad") ||
    statusLower.includes("verificad") ||
    statusLower.includes("aprobad")
  ) {
    currentStepIndex = 1;
  } else {
    // Default: Pendiente de pago / Registrado
    currentStepIndex = 0;
  }

  // Tracking details are only active once the order is in transit or completed
  const isInTransit = currentStepIndex >= 3;
  const trackingLink = isInTransit ? getCarrierTrackingUrl(order) : null;

  const steps = [
    {
      title: "Pedido Registrado",
      subtitle: "Orden procesada",
      description: "Recibido en el sistema de repuestos OEM.",
      icon: Clock,
    },
    {
      title: "Pago Confirmado",
      subtitle: "Verificación bancaria",
      description: "Pago validado correctamente.",
      icon: CreditCard,
    },
    {
      title: "En Preparación",
      subtitle: "Despacho bodega",
      description: "Inspección técnica y empaque.",
      icon: Package,
    },
    {
      title: "Despachado",
      subtitle: isInTransit ? (shippingCarrier || "Transportadora") : "Pendiente de despacho",
      description: isInTransit
        ? trackingNumber
          ? `Nº Guía: ${trackingNumber}`
          : `En ruta con ${shippingCarrier || "transportadora"}`
        : "Se asignará transportadora y guía al despachar desde bodega.",
      icon: Truck,
    },
    {
      title: "Entregado",
      subtitle: "Entrega confirmada",
      description: "Recibido a satisfacción por el cliente.",
      icon: ShieldCheck,
    },
  ];

  if (isCancelled) {
    return (
      <div
        id="order-status-timeline"
        className="bg-red-50/80 border border-red-200/80 rounded-2xl p-5 text-red-900 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm uppercase tracking-wide font-display text-red-950">
              PEDIDO CANCELADO O EXPIRADO
            </h4>
            <p className="text-xs text-red-700 mt-0.5 font-sans">
              El tiempo límite para realizar el pago expiró o la orden fue cancelada y el stock fue liberado. Si deseas adquirir estos repuestos, por favor crea un nuevo pedido.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hours = Math.floor(remainingSecs / 3600);
  const mins = Math.floor((remainingSecs % 3600) / 60);
  const secs = remainingSecs % 60;

  return (
    <div
      id="order-status-timeline"
      className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 relative overflow-hidden"
    >
      {/* Active Stock Reservation Countdown Banner */}
      {currentStepIndex === 0 && reservationExpiresAt && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-950 uppercase font-mono tracking-wider">
                  Reserva Temporal de Stock Asegurada
                </span>
                {remainingSecs > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black font-mono animate-pulse">
                    Tiempo Restante
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-900/80 font-sans mt-0.5">
                {remainingSecs > 0
                  ? `Realiza el pago antes de que expire el tiempo para garantizar el despacho inmediato de tus repuestos.`
                  : `El tiempo límite para pagar ha vencido. La reserva ha sido liberada al catálogo.`}
              </p>
            </div>
          </div>

          {remainingSecs > 0 ? (
            <div className="bg-white px-4 py-2 rounded-xl border border-amber-300 shadow-xs text-center shrink-0 min-w-[120px]">
              <span className="text-[9px] font-mono font-bold uppercase text-amber-800 block">
                EXPIRA EN
              </span>
              <span className="text-base font-black font-mono text-[#E60012] tracking-wider">
                {String(hours).padStart(2, "0")}:{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </span>
            </div>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-red-100 text-red-800 text-xs font-mono font-bold">
              Reserva Vencida
            </span>
          )}
        </div>
      )}

      {/* Header Info - Clean & Distinctive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3 relative z-10">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-2.5 h-2.5 rounded-full bg-[#E60012] animate-pulse shrink-0" />
            <h3 className="text-sm font-black font-display text-slate-900 tracking-tight">
              Progreso del Envío
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full font-sans border border-slate-200/60">
              Estado: <strong className="text-slate-800">{status}</strong>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Fecha de emisión:{" "}
            <span className="text-slate-700 font-medium">{formatOrderDate(date)}</span>
          </p>
        </div>

        {isInTransit && trackingLink && (
          <div className="flex items-center gap-2">
            <a
              href={trackingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-white bg-[#E60012] hover:bg-red-700 px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs hover:shadow-sm active:scale-98"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Rastrear Envío ↗</span>
            </a>
          </div>
        )}
      </div>

      {/* Timeline Steps (Desktop Horizontal & Mobile Vertical) */}
      <div className="relative z-10 py-1">
        {/* Horizontal Connector Line for Desktop */}
        <div className="hidden md:block absolute top-[24px] left-[8%] right-[8%] h-1 bg-slate-100 rounded-full -z-0">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-[#E60012] rounded-full transition-all duration-500 shadow-2xs"
            style={{
              width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            let circleStyle = "bg-white text-slate-300 border-slate-200 shadow-2xs";
            let titleColor = "text-slate-400 font-medium";

            if (isDone) {
              circleStyle =
                "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20";
              titleColor = "text-slate-800 font-bold";
            } else if (isCurrent) {
              circleStyle =
                "bg-[#E60012] text-white border-[#E60012] ring-4 ring-red-100 shadow-md shadow-red-500/25";
              titleColor = "text-[#E60012] font-black";
            }

            return (
              <div
                key={idx}
                className="relative flex md:flex-col items-start md:items-center gap-3.5 md:gap-3 md:text-center group"
              >
                {/* Step Circle Icon */}
                <div
                  className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center shrink-0 z-10 transition-all duration-300 ${circleStyle}`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Vertical Line for Mobile Layout */}
                {idx < steps.length - 1 && (
                  <div
                    className={`md:hidden absolute left-[23px] top-12 bottom-[-24px] w-0.5 ${
                      isDone ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                )}

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 md:justify-center">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isCurrent
                          ? "bg-red-50 text-[#E60012] border border-red-200/80"
                          : isDone
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                            : "bg-slate-100 text-slate-400 border border-slate-200/50"
                      }`}
                    >
                      {isDone ? "Completado" : isCurrent ? "Paso Actual" : `Paso ${idx + 1}`}
                    </span>
                  </div>

                  <h5
                    className={`text-xs mt-1.5 font-display leading-tight truncate ${titleColor}`}
                  >
                    {step.title}
                  </h5>

                  <p className="text-[11px] font-mono text-slate-500 font-medium truncate mt-0.5">
                    {step.subtitle}
                  </p>

                  {!compact && (
                    <p className="text-[10px] text-slate-500 leading-snug mt-1 font-sans hidden sm:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dispatch Extra Info Footer - STRICTLY ONLY DISPLAYED WHEN ORDER IS IN TRANSIT OR DELIVERED */}
      {isInTransit && (shippingCarrier || trackingNumber) && (
        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 flex flex-wrap items-center justify-between gap-3 text-xs relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#E60012] flex items-center justify-center font-bold shrink-0 border border-red-100 shadow-2xs">
              <Truck className="w-4 h-4 text-[#E60012]" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block tracking-wider">
                INFORMACIÓN DE DESPACHO Y GUÍA
              </span>
              <span className="font-extrabold text-slate-900 text-xs font-sans">
                {shippingCarrier || "Transportadora"}
                {trackingNumber && (
                  <span className="font-mono text-slate-700 font-bold ml-1.5">
                    (Guía: {trackingNumber})
                  </span>
                )}
              </span>
            </div>
          </div>

          {trackingLink ? (
            <a
              href={trackingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-white bg-[#E60012] hover:bg-red-700 px-3.5 py-1.5 rounded-xl border border-red-300 font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Rastrear Envío ↗</span>
            </a>
          ) : (
            trackingNumber && (
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> En tránsito
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
};


