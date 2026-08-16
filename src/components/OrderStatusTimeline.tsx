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
    id,
    status = "Pendiente de pago",
    trackingNumber,
    shippingCarrier,
    date,
    guaranteeCode,
  } = order;

  const statusLower = status.toLowerCase();

  // Determine active step index (0 to 4)
  // 0: Pedido Registrado
  // 1: Pago Confirmado
  // 2: En Preparación
  // 3: Despachado / En Tránsito
  // 4: Entregado
  let currentStepIndex = 0;
  let isCancelled = false;

  if (statusLower.includes("cancelad") || statusLower.includes("anulad")) {
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

  const steps = [
    {
      title: "Pedido Registrado",
      subtitle: "Orden enviada",
      description: "Recibido en el sistema de repuestos OEM.",
      icon: Clock,
    },
    {
      title: "Pago Confirmado",
      subtitle: "Verificación bancaria",
      description: "Comprobante verificado por contabilidad.",
      icon: CreditCard,
    },
    {
      title: "En Preparación",
      subtitle: "Despacho bodega",
      description: "Inspección técnica de número de parte y empaque.",
      icon: Package,
    },
    {
      title: "Despachado / Tránsito",
      subtitle: shippingCarrier || "Transportadora",
      description: trackingNumber
        ? `Nº Guía: ${trackingNumber} (${shippingCarrier || "Envío a domicilio"})`
        : `En camino con ${shippingCarrier || "transportadora asignada"}.`,
      icon: Truck,
    },
    {
      title: "Entregado",
      subtitle: "Garantía Activa",
      description: "Entregado satisfactoriamente al destinatario.",
      icon: ShieldCheck,
    },
  ];

  if (isCancelled) {
    return (
      <div
        id="order-status-timeline"
        className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-900 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm uppercase font-display text-red-950">
              PEDIDO CANCELADO O ANULADO
            </h4>
            <p className="text-xs text-red-800 mt-0.5 font-sans">
              La orden <strong>{id}</strong> ha sido cancelada. Si necesitas asistencia, contáctanos vía WhatsApp.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const trackingLink = getCarrierTrackingUrl(order);

  return (
    <div
      id="order-status-timeline"
      className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 relative overflow-hidden"
    >
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-black uppercase text-[#E60012] tracking-wider bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md">
              Seguimiento de Pedido
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-xs text-slate-900 font-extrabold">
              {id}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Fecha de emisión:{" "}
            <strong className="text-slate-800">{formatOrderDate(date)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {trackingLink && (
            <a
              href={trackingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-white bg-[#E60012] hover:bg-red-700 px-3 py-1 rounded-lg border border-red-300 font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Rastrear Envío ↗</span>
            </a>
          )}
          {guaranteeCode && (
            <span className="text-[10px] font-mono font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Certificado: {guaranteeCode}</span>
            </span>
          )}
        </div>
      </div>

      {/* Timeline Steps (Desktop Grid & Mobile List) */}
      <div className="relative z-10 py-2">
        {/* Horizontal Connector Line for Desktop */}
        <div className="hidden md:block absolute top-[28px] left-[7%] right-[7%] h-1 bg-slate-200 rounded-full -z-0">
          <div
            className="h-full bg-gradient-to-r from-[#E60012] via-amber-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{
              width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            let circleStyle = "bg-slate-100 text-slate-400 border-slate-300";
            let textColor = "text-slate-400";
            let titleColor = "text-slate-500";

            if (isDone) {
              circleStyle =
                "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20";
              textColor = "text-emerald-700";
              titleColor = "text-slate-900 font-extrabold";
            } else if (isCurrent) {
              circleStyle =
                "bg-[#E60012] text-white border-[#E60012] ring-4 ring-[#E60012]/20 shadow-md shadow-red-500/20 animate-pulse";
              textColor = "text-[#E60012]";
              titleColor = "text-[#E60012] font-black";
            }

            return (
              <div
                key={idx}
                className="relative flex md:flex-col items-start md:items-center gap-3.5 md:gap-2.5 md:text-center group"
              >
                {/* Step Circle Icon */}
                <div
                  className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center shrink-0 z-10 transition-all duration-300 ${circleStyle}`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Vertical Line for Mobile Layout */}
                {idx < steps.length - 1 && (
                  <div
                    className={`md:hidden absolute left-6 top-12 bottom-[-24px] w-0.5 ${
                      isDone ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                )}

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 md:justify-center">
                    <span
                      className={`text-[10px] font-mono uppercase font-extrabold px-2 py-0.5 rounded-md ${
                        isCurrent
                          ? "bg-red-50 text-[#E60012] border border-red-200"
                          : isDone
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      Paso {idx + 1}
                    </span>
                  </div>

                  <h5
                    className={`text-xs mt-1.5 font-display leading-tight truncate ${titleColor}`}
                  >
                    {step.title}
                  </h5>

                  <p className="text-[11px] font-mono text-slate-500 font-semibold truncate mt-0.5">
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

      {/* Dispatch Extra Info Footer */}
      {(trackingNumber || shippingCarrier) && (
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-[#E60012] flex items-center justify-center font-bold shrink-0 border border-red-200">
              <Truck className="w-4 h-4 text-[#E60012]" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-extrabold uppercase text-slate-500 block">
                INFORMACIÓN DE DESPACHO Y GUÍA
              </span>
              <span className="font-extrabold text-slate-900 text-xs">
                {shippingCarrier || "Transportadora"}
                {trackingNumber && `: ${trackingNumber}`}
              </span>
            </div>
          </div>

          {trackingLink ? (
            <a
              href={trackingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-white bg-[#E60012] hover:bg-red-700 px-3 py-1.5 rounded-lg border border-red-300 font-extrabold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Rastrear Envío en Vivo ↗</span>
            </a>
          ) : (
            trackingNumber && (
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> En tránsito nacional
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
};
