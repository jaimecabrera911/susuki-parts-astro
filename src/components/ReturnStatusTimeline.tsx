import React from 'react';
import { Clock, CheckCircle2, Truck, Package, AlertCircle, RefreshCw, FileText, Check, ShieldCheck, DollarSign, Tag } from 'lucide-react';
import type { OrderReturn } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface ReturnStatusTimelineProps {
  orderReturn: OrderReturn;
}

export const ReturnStatusTimeline: React.FC<ReturnStatusTimelineProps> = ({ orderReturn }) => {
  const {
    id,
    status,
    qcStatus,
    resolutionType,
    refundAmount,
    bonusAmount,
    storeCreditCode,
    returnCarrier,
    returnTrackingNumber,
    createdAt,
    evidencePhotos = [],
    qcNotes
  } = orderReturn;

  // Determine current active step index (0 to 4)
  // Steps: 0 = Solicitada, 1 = Aprobada, 2 = En tránsito, 3 = En Inspección, 4 = Completada / Resuelta
  let currentStepIndex = 0;

  if (status === 'Rechazada') {
    currentStepIndex = -1; // Special rejected state
  } else if (status === 'Reembolsada' || status === 'Completada' || status === 'Cerrada') {
    currentStepIndex = 4;
  } else if (status === 'Pieza recibida' || status === 'En inspección' || qcStatus === 'passed' || qcStatus === 'failed') {
    currentStepIndex = 3;
  } else if (status === 'En tránsito') {
    currentStepIndex = 2;
  } else if (status === 'Aprobada') {
    currentStepIndex = 1;
  } else {
    currentStepIndex = 0; // Pendiente / Solicitada
  }

  const steps = [
    {
      title: 'Solicitud Registrada',
      description: 'Solicitud recibida por el sistema RMA de Suzuki Parts.',
      icon: Clock,
    },
    {
      title: 'Solicitud Aprobada',
      description: returnTrackingNumber
        ? `Autorizada. Guía ${returnCarrier || 'Transportadora'}: ${returnTrackingNumber}`
        : 'Autorizada para envío a nuestra bodega principal.',
      icon: FileText,
    },
    {
      title: 'En Tránsito',
      description: 'El paquete va en camino a las instalaciones de control de calidad.',
      icon: Truck,
    },
    {
      title: 'Inspección de Bodega (QC)',
      description: qcStatus === 'passed'
        ? 'Inspección aprobada. Repuesto en excelente estado.'
        : qcStatus === 'failed'
        ? 'Inspección finalizada con observaciones.'
        : 'En proceso de verificación técnica por nuestros especialistas.',
      icon: ShieldCheck,
    },
    {
      title: resolutionType === 'store_credit' ? 'Crédito Emitido' : resolutionType === 'exchange' ? 'Cambio Despachado' : 'Reembolso Procesado',
      description: resolutionType === 'store_credit'
        ? (storeCreditCode ? `Cupón activo: ${storeCreditCode}` : 'Crédito en tienda acreditado en tu cuenta.')
        : 'Transacción finalizada con éxito.',
      icon: resolutionType === 'store_credit' ? Tag : DollarSign,
    },
  ];

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div id="return-status-timeline" className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 shadow-xl space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold text-[#0A3088] font-mono">Caso RMA</span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-sm text-slate-900 font-black">{id}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">Iniciado el {formattedDate}</p>
        </div>
        <div className="flex items-center gap-2">
          {status === 'Rechazada' ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1.5 font-mono">
              <AlertCircle className="w-3.5 h-3.5" /> Devolución Rechazada
            </span>
          ) : currentStepIndex === 4 ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Finalizada
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0A3088] border border-blue-200 flex items-center gap-1.5 font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0A3088]" /> {status}
            </span>
          )}
        </div>
      </div>

      {/* Resolution Bonus Banner if Store Credit */}
      {resolutionType === 'store_credit' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-amber-800 font-mono font-bold uppercase tracking-wider">Beneficio Crédito en Tienda (+5% Regalo)</p>
              <p className="text-sm font-bold text-slate-900">
                Total Acreditado: <span className="text-amber-700 font-mono font-black">{formatCurrency((refundAmount || 0) + (bonusAmount || 0))}</span>
                {bonusAmount ? <span className="text-xs font-normal text-slate-600 ml-1.5">(incluye {formatCurrency(bonusAmount)} de bonificación)</span> : null}
              </p>
            </div>
          </div>
          {storeCreditCode && (
            <div className="bg-white px-3.5 py-1.5 rounded-xl border border-amber-300 font-mono font-black text-amber-900 text-sm tracking-wider select-all shadow-2xs">
              {storeCreditCode}
            </div>
          )}
        </div>
      )}

      {/* Timeline Steps */}
      {status === 'Rechazada' ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-900 text-sm">
          <p className="font-bold mb-1 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" /> Solicitud no aprobada
          </p>
          <p className="text-xs text-red-700">{qcNotes || 'La solicitud no cumple con los términos de garantía de la tienda o la pieza presentó signos de uso no cubiertos.'}</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex || (idx === currentStepIndex && currentStepIndex === 4);
            const isCurrent = idx === currentStepIndex && currentStepIndex < 4;
            const Icon = step.icon;

            return (
              <div key={idx} className="relative group">
                {/* Step Circle Marker */}
                <div
                  className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : isCurrent
                      ? 'bg-[#0A3088] text-white ring-4 ring-[#0A3088]/20 shadow-md font-black animate-pulse'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                </div>

                {/* Step Content */}
                <div className="ml-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isCompleted ? 'text-emerald-600' : isCurrent ? 'text-[#0A3088]' : 'text-slate-400'}`} />
                    <h4 className={`text-sm font-bold ${isCompleted ? 'text-slate-900' : isCurrent ? 'text-[#0A3088]' : 'text-slate-400'}`}>
                      {step.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return Carrier & Tracking Card if available */}
      {returnTrackingNumber && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-[#0A3088] border border-blue-100 rounded-xl">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-mono font-bold uppercase">Transportadora de retorno</p>
              <p className="text-xs font-bold text-slate-900">{returnCarrier || 'Servientrega'} - <span className="font-mono text-[#0A3088]">{returnTrackingNumber}</span></p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[#0A3088] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">Guía Asignada</span>
        </div>
      )}

      {/* Evidence Photos Thumbnail Strip */}
      {evidencePhotos.length > 0 && (
        <div className="border-t border-slate-200 pt-4">
          <p className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-2">Fotos de Evidencia Adjuntadas ({evidencePhotos.length})</p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {evidencePhotos.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block relative group flex-shrink-0">
                <img src={url} alt={`Evidencia ${i + 1}`} className="w-14 h-14 rounded-xl object-cover border border-slate-200 group-hover:border-[#0A3088] transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
