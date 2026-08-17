import React, { useState, useEffect, useRef } from 'react';
import { X, RotateCcw, ShieldCheck, Truck, CreditCard, DollarSign, Package, AlertCircle, MessageSquare, Send, User } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDocumentNumber } from '../../utils/formatDocumentNumber';
import { parseReturnNotes, formatMessageTime, type ReturnMessage } from '../../utils/returnNotes';
import { getStoredUser } from '../../utils/auth';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnItem: any | null;
  onSaveReturn: (updated: any) => void;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  isOpen,
  onClose,
  returnItem,
  onSaveReturn
}) => {
  if (!isOpen || !returnItem) return null;

  const [status, setStatus] = useState(returnItem.status || 'Pendiente');
  const [qcStatus, setQcStatus] = useState<'pending' | 'passed' | 'failed'>(returnItem.qcStatus || 'pending');
  const [qcNotes, setQcNotes] = useState<string>(returnItem.qcNotes || '');
  const [bonusAmount, setBonusAmount] = useState<number>(returnItem.bonusAmount || 0);
  const [resolutionType, setResolutionType] = useState<string>(returnItem.resolutionType || 'refund');
  const [restockInventory, setRestockInventory] = useState<boolean>(
    returnItem.restockInventory !== undefined ? Boolean(returnItem.restockInventory) : false
  );
  const [refundAmount, setRefundAmount] = useState<number>(returnItem.refundAmount || 0);
  const [refundMethod, setRefundMethod] = useState(returnItem.refundMethod || 'Transferencia bancaria');
  const [refundReference, setRefundReference] = useState(returnItem.refundReference || '');
  const [replacementPartId, setReplacementPartId] = useState<string>(returnItem.replacementPartId || '');
  const [storeCreditCode, setStoreCreditCode] = useState<string>(returnItem.storeCreditCode || '');
  const [returnCarrier, setReturnCarrier] = useState(returnItem.returnCarrier || 'Servientrega');
  const [returnTrackingNumber, setReturnTrackingNumber] = useState(returnItem.returnTrackingNumber || '');

  // Chat/Notes history state
  const [chatMessages, setChatMessages] = useState<ReturnMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (returnItem) {
      setStatus(returnItem.status || 'Pendiente');
      setQcStatus(returnItem.qcStatus || 'pending');
      setQcNotes(returnItem.qcNotes || '');
      setBonusAmount(returnItem.bonusAmount || 0);
      setResolutionType(returnItem.resolutionType || 'refund');
      setRestockInventory(Boolean(returnItem.restockInventory));
      setRefundAmount(returnItem.refundAmount || 0);
      setRefundMethod(returnItem.refundMethod || 'Transferencia bancaria');
      setRefundReference(returnItem.refundReference || '');
      setReplacementPartId(returnItem.replacementPartId || '');
      setStoreCreditCode(returnItem.storeCreditCode || `BONO-SZ-${Math.floor(100000 + Math.random() * 900000)}`);
      setReturnCarrier(returnItem.returnCarrier || 'Servientrega');
      setReturnTrackingNumber(returnItem.returnTrackingNumber || '');

      const parsed = parseReturnNotes(returnItem.notes, returnItem.customerName);
      setChatMessages(parsed);
    }
  }, [returnItem]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleAddMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newMessageText.trim();
    if (!trimmed) return;

    const currentUser = getStoredUser();
    const adminName = currentUser?.fullName || 'Soporte Suzuki';

    const msg: ReturnMessage = {
      id: `msg-${Date.now()}`,
      sender: 'admin',
      senderName: adminName,
      text: trimmed,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, msg]);
    setNewMessageText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...returnItem,
      status,
      qcStatus,
      qcNotes,
      bonusAmount,
      resolutionType,
      restockInventory,
      refundAmount: resolutionType === 'refund' || resolutionType === 'store_credit' ? Number(refundAmount) : 0,
      refundMethod: resolutionType === 'refund' ? refundMethod : null,
      refundReference: resolutionType === 'refund' ? refundReference.trim() : null,
      replacementPartId: resolutionType === 'exchange' ? replacementPartId.trim() : null,
      storeCreditCode: resolutionType === 'store_credit' ? storeCreditCode.trim() : null,
      returnCarrier: returnCarrier.trim(),
      returnTrackingNumber: returnTrackingNumber.trim(),
      notes: JSON.stringify(chatMessages),
      updatedAt: new Date().toISOString()
    };
    onSaveReturn(updated);
    onClose();
  };

  const items = Array.isArray(returnItem.itemsJson)
    ? returnItem.itemsJson
    : (typeof returnItem.itemsJson === 'string' ? JSON.parse(returnItem.itemsJson || '[]') : []);

  const formatDate = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString('es-CO', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return ts;
    }
  };

  const isUnpaidOrder = Boolean(
    returnItem.isUnpaidCancel ||
    returnItem.orderStatus === 'Pendiente' ||
    returnItem.orderStatus === 'Pendiente de Pago' ||
    returnItem.orderStatus === 'Pago Pendiente' ||
    returnItem.order?.paymentStatus === 'pending' ||
    returnItem.order?.paymentStatus === 'unpaid'
  );

  return (
    <div
      id="return-modal"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
      >
        {/* Accent Top Line */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-[#E60012] to-emerald-500" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 shadow-xs">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight font-display">
              Gestionar Devolución {formatDocumentNumber(returnItem.id, returnItem.prefix, returnItem.documentNumber)}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-slate-500 font-medium">
                Pedido: <strong className="font-mono text-slate-800">{formatDocumentNumber(returnItem.orderId, returnItem.orderPrefix, returnItem.orderDocumentNumber)}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">
                Cliente: <strong>{returnItem.customerName}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                isUnpaidOrder ? 'bg-amber-100 text-amber-900 border-amber-300 font-black' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                Estado Pedido: {returnItem.orderStatus || returnItem.order?.status || 'Pendiente de Pago'}
              </span>
            </div>
          </div>
        </div>

        {/* Form Body with Scroll */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Items Included in Return & Resolution Requested */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-wider">
                SOLICITUD & MOTIVO
              </span>
              <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full border ${
                isUnpaidOrder ? 'bg-purple-100 text-purple-900 border-purple-300' :
                resolutionType === 'refund' ? 'bg-red-50 text-[#E60012] border-red-200' :
                resolutionType === 'exchange' ? 'bg-blue-50 text-[#0A3088] border-blue-200' :
                'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {isUnpaidOrder ? '🚫 Anulación sin Desembolso ($0 COP)' : (
                  resolutionType === 'refund' ? 'Solución: 💵 Reembolso' : resolutionType === 'exchange' ? 'Solución: 🔄 Cambio Repuesto' : 'Solución: 🏷️ Bono Tienda'
                )}
              </span>
            </div>

            <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Motivo: {returnItem.reason}</span>
            </div>

            {isUnpaidOrder && (
              <div className="p-3 bg-purple-50 border border-purple-200 text-purple-950 rounded-xl text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-purple-900">Atención: Pedido no pagado</strong>
                  El pedido {formatDocumentNumber(returnItem.orderId, returnItem.orderPrefix, returnItem.orderDocumentNumber)} no fue pagado o la transferencia no fue confirmada. No procede ningún desembolso ni reembolso de dinero ($0 COP). El trámite debe finalizarse como Anulación/Cancelación.
                </div>
              </div>
            )}

            {returnItem.isPreDispatchCancel && !isUnpaidOrder && (
              <div className="p-2.5 bg-sky-50 border border-sky-200 text-sky-900 rounded-xl text-xs font-semibold flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Cancelación solicitada antes del despacho (El paquete no ha salido de bodega).</span>
              </div>
            )}

            {items.length > 0 && (
              <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto">
                {items.map((it: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="font-bold text-slate-900">{it.part?.name || it.name || 'Repuesto'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Ref: {it.part?.sku || it.partId || 'OEM'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900">{it.quantity || 1} Unid.</span>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {formatCurrency(
                          Number.isNaN(Number(it.lineTotal))
                            ? (Number(it.unitPrice || it.price || it.part?.price || 0) * Number(it.quantity || 1)) || 0
                            : Number(it.lineTotal)
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Resolution Type Selector */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Tipo de Resolución Acordada *
              </label>
              <select
                value={resolutionType}
                onChange={(e) => setResolutionType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E60012]"
              >
                <option value="refund">Reembolso de Dinero</option>
                <option value="exchange">Cambio por otro Repuesto / Garantía</option>
                <option value="store_credit">Bono de Compra en Tienda</option>
                <option value="cancellation">Anulación de Pedido ($0 COP)</option>
              </select>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Estado del Trámite RMA *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E60012]"
              >
                <option value="Pendiente">Pendiente de Revisión</option>
                <option value="Aprobada">Aprobada (Aceptar devolución)</option>
                <option value="En tránsito">En tránsito de retorno</option>
                <option value="Pieza recibida">Pieza recibida en bodega</option>
                <option value="Reembolsada">Reembolsada / Procesada</option>
                <option value="Rechazada">Rechazada</option>
              </select>
            </div>

            {/* Campos condicionales para REEMBOLSO DE DINERO */}
            {resolutionType === 'refund' && !isUnpaidOrder && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Monto del Reembolso ($ COP) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E60012]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Método de Reembolso
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E60012]"
                  >
                    <option value="Transferencia bancaria">Transferencia bancaria</option>
                    <option value="Nequi">Nequi</option>
                    <option value="Daviplata">Daviplata</option>
                    <option value="Tarjeta de crédito">Reembolso a Tarjeta de Crédito</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Comprobante / Nro Transacción Bancaria
                  </label>
                  <input
                    type="text"
                    value={refundReference}
                    onChange={(e) => setRefundReference(e.target.value)}
                    placeholder="Ej. TRX-9921401 / Nequi M-91240"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-[#E60012]"
                  />
                </div>
              </>
            )}

            {/* Campos condicionales para CAMBIO DE REPUESTO / GARANTÍA */}
            {resolutionType === 'exchange' && (
              <>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    SKU / ID del Repuesto de Reemplazo
                  </label>
                  <input
                    type="text"
                    value={replacementPartId}
                    onChange={(e) => setReplacementPartId(e.target.value)}
                    placeholder="Ej. SZ-PART-1029 / SKU 59100-33820-000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E60012]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Transportadora de Envío (Nuevo Repuesto)
                  </label>
                  <input
                    type="text"
                    value={returnCarrier}
                    onChange={(e) => setReturnCarrier(e.target.value)}
                    placeholder="Ej. Servientrega, Interrapidísimo"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#E60012]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Guía de Despacho (Nuevo Repuesto)
                  </label>
                  <input
                    type="text"
                    value={returnTrackingNumber}
                    onChange={(e) => setReturnTrackingNumber(e.target.value)}
                    placeholder="Ej. 9948210391"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-[#E60012]"
                  />
                </div>
              </>
            )}

            {/* Campos condicionales para BONO DE TIENDA */}
            {resolutionType === 'store_credit' && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Valor del Bono de Tienda ($ COP)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E60012]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Código de Bono / Saldo a Favor
                  </label>
                  <input
                    type="text"
                    value={storeCreditCode}
                    onChange={(e) => setStoreCreditCode(e.target.value)}
                    placeholder="Ej. BONO-SZ-981240"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:border-[#E60012]"
                  />
                </div>
              </>
            )}

            {/* Campos comunes de guía de devolución de retorno si aplica */}
            {resolutionType !== 'exchange' && resolutionType !== 'cancellation' && !isUnpaidOrder && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Transportadora de Retorno
                  </label>
                  <input
                    type="text"
                    value={returnCarrier}
                    onChange={(e) => setReturnCarrier(e.target.value)}
                    placeholder="Ej. Servientrega"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#E60012]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Guía de Devolución
                  </label>
                  <input
                    type="text"
                    value={returnTrackingNumber}
                    onChange={(e) => setReturnTrackingNumber(e.target.value)}
                    placeholder="Ej. 9948210391"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-[#E60012]"
                  />
                </div>
              </>
            )}
          </div>

          {/* Switch para Restauración de Inventario */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Restaurar Unidades al Inventario
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Si la pieza está en buen estado y apta para reventa, activa esta opción para reintegrar el stock al catálogo de repuestos automáticamente.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
              <input
                type="checkbox"
                checked={restockInventory}
                onChange={(e) => setRestockInventory(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Chat / Historial de Conversación & Notas */}
          <div className="space-y-2 border-t border-slate-200 pt-4">
            <label className="text-xs font-bold uppercase text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#E60012]" />
              Historial de Conversación & Notas de Soporte
            </label>

            {/* Chat Messages Container */}
            <div className="bg-slate-50 rounded-2xl p-4 max-h-52 overflow-y-auto space-y-3 border border-slate-200 text-xs">
              {chatMessages.length === 0 ? (
                <p className="text-slate-400 text-center py-4 font-mono text-[11px]">
                  No hay mensajes ni observaciones registradas.
                </p>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-500 font-mono">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase ${isAdmin ? 'bg-red-100 text-[#E60012] border border-red-200' : 'bg-slate-200 text-slate-800'}`}>
                          {msg.senderName || (isAdmin ? 'Soporte Suzuki' : 'Cliente')}
                        </span>
                        {msg.timestamp && (
                          <>
                            <span>•</span>
                            <span className="text-[10px] text-slate-500 font-medium">{formatMessageTime(msg.timestamp)}</span>
                          </>
                        )}
                      </div>
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl font-sans text-xs leading-relaxed shadow-2xs ${
                          isAdmin
                            ? 'bg-[#E60012] text-white rounded-tr-none shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Add Message Box */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMessage();
                  }
                }}
                placeholder="Escribe una observación o instrucción para el cliente..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#E60012]"
              />
              <button
                type="button"
                onClick={() => handleAddMessage()}
                disabled={!newMessageText.trim()}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold uppercase rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Agregar Nota</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-500/20 cursor-pointer"
            >
              Guardar Cambios RMA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
