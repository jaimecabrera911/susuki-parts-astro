import React, { useState, useEffect } from 'react';
import { RotateCcw, DollarSign, RefreshCw, Ticket, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { saveReturnApi } from '../services/api';
import { generateReturnId } from '../utils/idGenerator';

interface RequestReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSuccess?: () => void;
}

export const RequestReturnModal: React.FC<RequestReturnModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess
}) => {
  if (!isOpen || !order) return null;

  const [reason, setReason] = useState('Pieza defectuosa o con falla de fábrica');
  const [resolutionType, setResolutionType] = useState<'refund' | 'exchange' | 'store_credit' | 'cancellation'>('refund');
  const [selectedItems, setSelectedItems] = useState<string[]>(
    Array.isArray(order.items) ? order.items.map((i: any) => i.id || i.partId || i.part?.id) : []
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Comprehensive check for unpaid orders
  const isOrderUnpaid = Boolean(
    order.paymentStatus === 'pending' ||
    order.paymentStatus === 'unpaid' ||
    order.paymentStatus === 'unconfirmed' ||
    String(order.status || '').toLowerCase().includes('pendiente') ||
    String(order.status || '').toLowerCase().includes('unpaid') ||
    (order.paymentStatus !== 'paid' && order.paymentStatus !== 'approved' && order.paymentStatus !== 'completed' && order.status !== 'Entregado' && order.status !== 'Enviado')
  );

  useEffect(() => {
    if (isOrderUnpaid) {
      setResolutionType('cancellation');
    } else {
      setResolutionType('refund');
    }
  }, [isOrderUnpaid, order]);

  const getUnitPrice = (item: any): number => {
    const p = item?.unitPrice ?? item?.unit_price ?? item?.price ?? item?.part?.price ?? item?.part?.unitPrice ?? 0;
    const num = Number(p);
    return Number.isNaN(num) ? 0 : num;
  };

  const getQuantity = (item: any): number => {
    const q = item?.quantity ?? 1;
    const num = Number(q);
    return Number.isNaN(num) || num <= 0 ? 1 : num;
  };

  const getLineTotal = (item: any): number => {
    if (item?.lineTotal !== undefined && item?.lineTotal !== null) {
      const lt = Number(item.lineTotal);
      if (!Number.isNaN(lt)) return lt;
    }
    if (item?.line_total !== undefined && item?.line_total !== null) {
      const lt = Number(item.line_total);
      if (!Number.isNaN(lt)) return lt;
    }
    return getUnitPrice(item) * getQuantity(item);
  };

  const toggleItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setErrorMsg('Por favor selecciona al menos un repuesto para la solicitud.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    const itemsToReturn = (order.items || []).filter((i: any) =>
      selectedItems.includes(i.id || i.partId || i.part?.id)
    );

    const estimatedRefund = itemsToReturn.reduce(
      (sum: number, i: any) => sum + getLineTotal(i),
      0
    );

    const isPreDispatchCancel = order.status === 'Pendiente' || order.status === 'Pendiente de Pago' || order.status === 'Procesando' || order.status === 'En preparación';
    const isUnpaidCancel = isOrderUnpaid;

    const actualResolutionType = isUnpaidCancel ? 'cancellation' : resolutionType;
    const resolutionLabel = isUnpaidCancel
      ? 'Anulación por Falta de Pago ($0 COP)'
      : actualResolutionType === 'refund'
      ? 'Reembolso de Dinero'
      : actualResolutionType === 'exchange'
      ? 'Cambio por otro Repuesto'
      : 'Bono de Tienda';

    const payload = {
      id: generateReturnId(),
      orderId: order.id,
      customerName: order.customerName,
      email: order.email,
      phone: order.phone || '',
      documentId: order.documentId || '',
      reason,
      resolutionType: actualResolutionType,
      isPreDispatchCancel,
      isUnpaidCancel,
      orderStatus: order.status,
      status: (isPreDispatchCancel || isUnpaidCancel || actualResolutionType === 'cancellation') ? 'Aprobada' : 'Pendiente',
      refundAmount: isUnpaidCancel ? 0 : estimatedRefund,
      itemsJson: itemsToReturn,
      notes: JSON.stringify([
        {
          sender: 'customer',
          senderName: order.customerName || 'Cliente',
          text: notes.trim() || `Solicitud registrada: ${resolutionLabel}.`,
          timestamp: new Date().toISOString()
        },
        ...(isPreDispatchCancel ? [{
          sender: 'admin',
          senderName: 'Sistema',
          text: 'Solicitud procesada como Cancelación sin Despacho (el paquete aún no había sido enviado).',
          timestamp: new Date().toISOString()
        }] : []),
        ...(isUnpaidCancel ? [{
          sender: 'admin',
          senderName: 'Sistema',
          text: 'Anulación directa sin desembolso financiero ($0 COP) debido a pago pendiente o no verificado.',
          timestamp: new Date().toISOString()
        }] : [])
      ]),
      createdAt: new Date().toISOString()
    };

    try {
      const res = await saveReturnApi(payload);
      if (res.success) {
        setSuccessMsg(`¡Solicitud ${payload.id} enviada exitosamente!`);
        setTimeout(() => {
          setIsSubmitting(false);
          if (onSuccess) onSuccess();
          onClose();
        }, 2000);
      } else {
        setIsSubmitting(false);
        setErrorMsg(res.error || 'No se pudo enviar la solicitud.');
      }
    } catch {
      setIsSubmitting(false);
      setErrorMsg('Ocurrió un error al conectar con el servidor.');
    }
  };

  return (
    <div
      id="request-return-modal"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 shadow-xs">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight font-display">
              {isOrderUnpaid ? 'Solicitar Anulación de Pedido' : 'Solicitar Devolución / Garantía'}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-slate-500 font-medium">
                Pedido: <strong className="font-mono text-slate-800">{order.id}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                isOrderUnpaid ? 'bg-amber-100 text-amber-900 border-amber-300 font-black' :
                order.status === 'Entregado' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                'bg-sky-50 text-sky-800 border-sky-200'
              }`}>
                Estado Pedido: {order.status}
              </span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">{successMsg}</h3>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Banner Informativo si el pedido está sin pagar */}
            {isOrderUnpaid ? (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-950 rounded-2xl text-xs space-y-1.5 shadow-2xs">
                <p className="font-extrabold flex items-center gap-2 text-amber-950 text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  Pedido Pendiente de Pago
                </p>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Este pedido aún no ha sido pagado o verificado. Al confirmar la solicitud, la orden se cancelará sin generar cobros ni reembolso financiero ($0 COP).
                </p>
              </div>
            ) : (
              /* Resolution Type Selector solo para pedidos pagados */
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-2">
                  ¿Qué solución prefieres? *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setResolutionType('refund')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      resolutionType === 'refund'
                        ? 'bg-red-50/80 border-[#E60012] text-[#E60012] font-extrabold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <DollarSign className="w-5 h-5" />
                    <span className="text-[11px]">Reembolso de Dinero</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionType('exchange')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      resolutionType === 'exchange'
                        ? 'bg-blue-50/80 border-[#0A3088] text-[#0A3088] font-extrabold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span className="text-[11px]">Cambio de Repuesto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionType('store_credit')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      resolutionType === 'store_credit'
                        ? 'bg-emerald-50/80 border-emerald-600 text-emerald-700 font-extrabold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Ticket className="w-5 h-5" />
                    <span className="text-[11px]">Bono de Tienda</span>
                  </button>
                </div>
              </div>
            )}

            {/* Select items to return */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-2">
                Selecciona las piezas a incluir *
              </label>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {(order.items || []).map((item: any, idx: number) => {
                  const itemId = item.id || item.partId || item.part?.id || `item-${idx}`;
                  const isChecked = selectedItems.includes(itemId);
                  const name = item.part?.name || item.name || 'Repuesto';
                  const sku = item.part?.sku || item.sku || 'OEM';

                  return (
                    <div
                      key={itemId}
                      onClick={() => toggleItem(itemId)}
                      className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-red-50/40 border-[#E60012] font-semibold text-slate-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 accent-[#E60012] rounded cursor-pointer"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Ref: {sku}</p>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-slate-800">{getQuantity(item)} Unid.</span>
                        <p className="text-[10px] text-slate-500">{formatCurrency(getLineTotal(item))}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reason Selector */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Motivo *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E60012]"
              >
                <option value="Pieza defectuosa o con falla de fábrica">Pieza defectuosa o con falla de fábrica</option>
                <option value="Pedido equivocado / Repuesto no compatible">Pedido equivocado / Repuesto no compatible</option>
                <option value="Empaque dañado durante el transporte">Empaque dañado durante el transporte</option>
                <option value="Cancelación de compra antes de despacho">Cancelación de compra antes de despacho</option>
                <option value="Otro motivo">Otro motivo</option>
              </select>
            </div>

            {/* Additional Comments */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Comentarios Adicionales
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Explica brevemente los detalles para agilizar el trámite..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-sans text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012]"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedItems.length === 0}
                className="px-6 py-2.5 bg-[#E60012] hover:bg-red-700 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>{isOrderUnpaid ? 'Confirmar Anulación' : 'Enviar Solicitud'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
