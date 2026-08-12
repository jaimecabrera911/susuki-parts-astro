import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Upload, Trash2, AlertTriangle, ShieldAlert, Tag, RefreshCw, DollarSign, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { Order, OrderReturnItem } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface ReturnRequestModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen || !order) return null;

  // Wizard state (1: Select items, 2: Reason & Photos, 3: Resolution, 4: Summary/Success)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Selected items mapping: { itemPartId: selectedQuantity }
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({});
  
  // Form values
  const [reason, setReason] = useState<string>('Pieza defectuosa o fallo de fábrica');
  const [detailedNotes, setDetailedNotes] = useState<string>('');
  const [resolutionType, setResolutionType] = useState<'refund' | 'store_credit' | 'exchange'>('store_credit');
  const [replacementPartNotes, setReplacementPartNotes] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);

  // Status & submission
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [createdRmaId, setCreatedRmaId] = useState<string>('');

  // Toggle item selection
  const handleToggleItem = (partId: string, maxQty: number) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[partId]) {
        delete next[partId];
      } else {
        next[partId] = maxQty;
      }
      return next;
    });
  };

  // Change quantity for selected item
  const handleQuantityChange = (partId: string, qty: number, maxQty: number) => {
    const validQty = Math.max(1, Math.min(maxQty, qty));
    setSelectedItems(prev => ({
      ...prev,
      [partId]: validQty
    }));
  };

  // Calculate selected return subtotal
  const returnItemsList: OrderReturnItem[] = (order.items || []).map((item: any) => {
    const partId = item.part?.id || item.partId || `item-${item.quantity}`;
    const partName = item.part?.name || item.name || 'Repuesto Suzuki';
    const oemNumber = item.part?.oemNumbers?.[0] || item.oemNumber || '';
    const unitPrice = item.part?.price ?? item.unitPrice ?? item.price ?? 0;
    const qtySelected = selectedItems[partId] || 0;

    return {
      partId,
      name: partName,
      oemNumber,
      price: unitPrice,
      quantity: qtySelected,
      reason: reason,
      imageUrl: item.part?.images?.[0] || item.part?.image || ''
    };
  }).filter(i => i.quantity > 0);

  const subtotalRefund = returnItemsList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const bonusAmount = resolutionType === 'store_credit' ? Math.round(subtotalRefund * 0.05) : 0;
  const totalResolutionValue = subtotalRefund + bonusAmount;

  // Check if any electrical part is selected
  const hasElectricalParts = returnItemsList.some(item => {
    const nameLower = item.name.toLowerCase();
    return nameLower.includes('ecu') || nameLower.includes('bobina') || nameLower.includes('estator') || 
           nameLower.includes('regulador') || nameLower.includes('cdi') || nameLower.includes('sensor') || 
           nameLower.includes('relé') || nameLower.includes('rele') || nameLower.includes('starter') || nameLower.includes('bateria');
  });

  // Handle Photo File Upload (Mock Base64 preview)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newPhotos: string[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          newPhotos.push(reader.result as string);
          if (newPhotos.length === files.length) {
            setPhotos(prev => [...prev, ...newPhotos].slice(0, 5));
            setUploading(false);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Submit RMA Request
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setErrorMessage('');

      if (returnItemsList.length === 0) {
        throw new Error('Debes seleccionar al menos un repuesto para solicitar la devolución.');
      }

      if ((reason.includes('defectuosa') || reason.includes('equivocado')) && photos.length === 0) {
        throw new Error('Por favor adjunta al menos 1 foto como evidencia de la pieza defectuosa o equivocada.');
      }

      const payload = {
        orderId: order.id,
        orderDate: order.date,
        customerName: order.customerName,
        email: order.email,
        phone: order.phone,
        documentId: order.documentId || '',
        reason: `${reason}${detailedNotes ? `: ${detailedNotes}` : ''}`,
        resolutionType,
        replacementPartId: replacementPartNotes || null,
        refundAmount: subtotalRefund,
        bonusAmount: bonusAmount,
        evidencePhotos: photos,
        itemDetailsJson: returnItemsList,
        itemsJson: returnItemsList,
        notes: detailedNotes
      };

      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error registrando la solicitud de devolución.');
      }

      setCreatedRmaId(data.data?.id || 'SZ-RET-CONFIRMED');
      setStep(4); // Move to final success confirmation step
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocurrió un error inesperado');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900 my-8"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0A3088]">Asistente de Garantías & Devoluciones</span>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 font-display">
              Pedido #{order.id}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Progress Bar */}
        {step < 4 && (
          <div className="px-6 pt-4 pb-2 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 mb-2">
              <span className={step >= 1 ? 'text-[#0A3088]' : ''}>1. Repuestos</span>
              <span className={step >= 2 ? 'text-[#0A3088]' : ''}>2. Motivo & Evidencia</span>
              <span className={step >= 3 ? 'text-[#0A3088]' : ''}>3. Solución & Beneficio</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0A3088] to-[#E60012] transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-medium flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* STEP 1: Select Items */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-black text-slate-900 font-display">Selecciona los repuestos a devolver</h4>
                <p className="text-xs text-slate-500 mt-0.5">Elige los productos específicos y la cantidad que deseas retornar.</p>
              </div>

              <div className="space-y-3">
                {(order.items || []).map((item: any, idx: number) => {
                  const partId = item.part?.id || item.partId || `item-${idx}`;
                  const partName = item.part?.name || item.name || 'Repuesto Suzuki';
                  const oemNumber = item.part?.oemNumbers?.[0] || item.oemNumber || '';
                  const unitPrice = item.part?.price ?? item.unitPrice ?? item.price ?? 0;
                  const maxQty = item.quantity || 1;
                  const isSelected = Boolean(selectedItems[partId]);
                  const currentQty = selectedItems[partId] || maxQty;

                  return (
                    <div
                      key={partId}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-blue-50/50 border-[#0A3088] ring-1 ring-[#0A3088]/20 shadow-xs'
                          : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          id={`item-${partId}`}
                          checked={isSelected}
                          onChange={() => handleToggleItem(partId, maxQty)}
                          className="mt-1 w-4 h-4 rounded border-slate-300 text-[#0A3088] focus:ring-[#0A3088]"
                        />
                        <div className="flex-1">
                          <label htmlFor={`item-${partId}`} className="cursor-pointer">
                            <h5 className="text-sm font-bold text-slate-900 hover:text-[#0A3088] font-display">{partName}</h5>
                            {oemNumber && (
                              <p className="text-xs text-slate-500 font-mono mt-0.5">OEM: {oemNumber}</p>
                            )}
                            <p className="text-xs font-mono font-bold text-slate-700 mt-1">
                              {formatCurrency(unitPrice)} <span className="text-slate-500 font-normal">c/u</span>
                            </p>
                          </label>

                          {isSelected && maxQty > 1 && (
                            <div className="mt-3 flex items-center gap-3">
                              <span className="text-xs text-slate-600 font-medium">Cantidad a devolver:</span>
                              <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(partId, currentQty - 1, maxQty)}
                                  className="px-3 py-1 text-slate-700 hover:bg-slate-100 font-bold"
                                >
                                  -
                                </button>
                                <span className="px-3 text-xs font-mono font-bold text-slate-900">{currentQty}</span>
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(partId, currentQty + 1, maxQty)}
                                  className="px-3 py-1 text-slate-700 hover:bg-slate-100 font-bold"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-xs text-slate-400 font-mono">(Máximo {maxQty})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {returnItemsList.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
                  <span className="text-xs text-slate-600 font-bold uppercase font-mono">Subtotal a Devolver ({returnItemsList.length} repuestos):</span>
                  <span className="text-lg font-mono font-black text-[#0A3088]">{formatCurrency(subtotalRefund)}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Reason & Evidence Photos */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-base font-black text-slate-900 font-display">Motivo de la Solicitud & Fotos</h4>
                <p className="text-xs text-slate-500 mt-0.5">Indica la razón y adjunta fotos claras de las piezas si aplica.</p>
              </div>

              {/* Electrical Parts Alert Banner */}
              {hasElectricalParts && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-3 shadow-xs">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900 mb-1 font-display">Aviso sobre Componentes Eléctricos / Electrónicos</p>
                    Has seleccionado piezas eléctricas (ECU, estator, bobina o sensor). Para aprobar la garantía, la pieza no debe presentar signos de sobrevoltaje o instalación incorrecta. Se requiere foto de la caja original y sello OEM intacto.
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 font-mono mb-1">Motivo principal</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E60012]"
                  >
                    <option value="Pieza defectuosa o fallo de fábrica">Pieza defectuosa o fallo de fábrica</option>
                    <option value="Pieza no compatible / error al ordenar">Pieza no compatible / error al ordenar</option>
                    <option value="Enviaron repuesto equivocado">Enviaron repuesto equivocado (Diferente a lo pedido)</option>
                    <option value="Retracto de compra / ya no lo necesito">Retracto de compra / ya no lo necesito</option>
                    <option value="Empaque dañado durante el transporte">Empaque dañado durante el transporte</option>
                    <option value="Otro motivo">Otro motivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 font-mono mb-1">Detalles adicionales (opcional)</label>
                  <textarea
                    rows={3}
                    value={detailedNotes}
                    onChange={(e) => setDetailedNotes(e.target.value)}
                    placeholder="Describe qué ocurrió con la pieza o la falla detectada..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#E60012]"
                  />
                </div>

                {/* Photo Evidence Uploader */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 font-mono mb-1">
                    Adjuntar Fotos / Evidencia
                    {(reason.includes('defectuosa') || reason.includes('equivocado')) && (
                      <span className="text-[#E60012] font-bold ml-1">* Obligatorio</span>
                    )}
                  </label>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-2">
                    {photos.map((photo, i) => (
                      <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs">
                        <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(i)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {photos.length < 5 && (
                      <label className="border-2 border-dashed border-slate-300 hover:border-[#0A3088] rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer bg-slate-50 text-slate-500 hover:text-[#0A3088] transition-colors">
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-[10px] text-center font-bold uppercase">Subir Imagen</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  {uploading && <p className="text-xs font-mono text-[#0A3088] mt-2 animate-pulse font-bold">Cargando imágenes...</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Resolution Choice & Incentives */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-base font-black text-slate-900 font-display">Elige la Solución Deseada</h4>
                <p className="text-xs text-slate-500 mt-0.5">Selecciona cómo deseas recibir el retorno de tu dinero o repuesto.</p>
              </div>

              <div className="space-y-3">
                {/* Option 1: Store Credit (+5% Bonus) */}
                <div
                  onClick={() => setResolutionType('store_credit')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    resolutionType === 'store_credit'
                      ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/30 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${resolutionType === 'store_credit' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-100 text-amber-600'}`}>
                      <Tag className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-display">
                          Crédito en Tienda / Monedero
                          <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-black bg-amber-500 text-slate-950">
                            +5% Bonificación Regalo
                          </span>
                        </h5>
                        <input
                          type="radio"
                          name="resolution"
                          checked={resolutionType === 'store_credit'}
                          onChange={() => setResolutionType('store_credit')}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Recibe un cupón de saldo inmediato para tu próxima compra en Suzuki Parts con un <span className="font-bold text-amber-800">5% extra de regalo</span>.
                      </p>
                      <div className="mt-2 text-sm font-bold text-amber-800 font-mono">
                        Valor Total Recibido: {formatCurrency(totalResolutionValue)}
                        <span className="text-xs font-normal text-slate-500 ml-2">(Incluye {formatCurrency(bonusAmount)} de bono)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Option 2: Original Payment Refund */}
                <div
                  onClick={() => setResolutionType('refund')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    resolutionType === 'refund'
                      ? 'bg-blue-50/90 border-[#0A3088] ring-2 ring-[#0A3088]/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${resolutionType === 'refund' ? 'bg-[#0A3088] text-white font-bold' : 'bg-slate-100 text-[#0A3088]'}`}>
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-bold text-slate-900 font-display">Reembolso a Medio de Pago Original</h5>
                        <input
                          type="radio"
                          name="resolution"
                          checked={resolutionType === 'refund'}
                          onChange={() => setResolutionType('refund')}
                          className="text-[#0A3088] focus:ring-[#0A3088]"
                        />
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Retorno directo a tu cuenta bancaria o tarjeta utilizada en la compra original.
                      </p>
                      <div className="mt-2 text-sm font-mono font-bold text-[#0A3088]">
                        Monto a Reembolsar: {formatCurrency(subtotalRefund)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Option 3: Part Exchange */}
                <div
                  onClick={() => setResolutionType('exchange')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    resolutionType === 'exchange'
                      ? 'bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-400/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${resolutionType === 'exchange' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 text-indigo-600'}`}>
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-bold text-slate-900 font-display">Cambio por otro Repuesto</h5>
                        <input
                          type="radio"
                          name="resolution"
                          checked={resolutionType === 'exchange'}
                          onChange={() => setResolutionType('exchange')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Deseo reemplazar esta pieza por otra referencia o tamaño correcto.
                      </p>
                      {resolutionType === 'exchange' && (
                        <div className="mt-3">
                          <input
                            type="text"
                            placeholder="Indica qué repuesto o número OEM necesitas a cambio..."
                            value={replacementPartNotes}
                            onChange={(e) => setReplacementPartNotes(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Success & Confirmation View */}
          {step === 4 && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 border border-emerald-300 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-xs">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-mono font-bold text-[#0A3088] uppercase tracking-widest">Caso RMA #{createdRmaId}</span>
                <h4 className="text-xl font-black text-slate-900 mt-1 font-display">¡Solicitud Registrada con Éxito!</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                  Hemos generado tu número de caso de devolución. Nuestro equipo de garantías procesará tu solicitud y emitirá la guía de envío a bodega en un plazo máximo de 24 horas hábiles.
                </p>
              </div>

              {resolutionType === 'store_credit' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 max-w-md mx-auto text-left flex items-center gap-3 shadow-xs">
                  <Tag className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-mono font-bold text-amber-800 uppercase">Beneficio Asignado</p>
                    <p className="text-xs text-slate-700">
                      Recibirás un cupón por <span className="font-mono font-bold text-amber-800">{formatCurrency(totalResolutionValue)}</span> (+5% de bono incluido) tan pronto como la pieza ingrese a bodega.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#0A3088] hover:bg-[#3d59b1] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-xs"
                >
                  Entendido / Ver Mis Devoluciones
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {step < 4 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/80">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200/60 rounded-xl flex items-center gap-1.5 transition-colors uppercase font-mono"
              >
                <ArrowLeft className="w-4 h-4" /> Anterior
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                disabled={step === 1 && returnItemsList.length === 0}
                onClick={() => setStep((step + 1) as any)}
                className="px-5 py-2 text-xs font-bold bg-[#0A3088] hover:bg-[#3d59b1] disabled:opacity-50 disabled:pointer-events-none text-white rounded-xl flex items-center gap-1.5 transition-colors uppercase font-mono shadow-xs"
              >
                Siguiente <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="px-6 py-2.5 text-xs font-bold bg-[#E60012] hover:bg-[#b5000b] text-white rounded-xl flex items-center gap-2 transition-colors uppercase font-mono shadow-xs"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Procesando Solicitud...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Confirmar & Registrar Solicitud RMA
                  </>
                )}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
