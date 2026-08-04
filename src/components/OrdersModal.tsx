import React from 'react';
import { Package, ShieldCheck, FileText, Calendar, Truck } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

interface OrdersModalProps {
  orders: any[];
}

export const OrdersModal: React.FC<OrdersModalProps> = ({ orders }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#E60012] text-white flex items-center justify-center font-bold shrink-0">
          <Package className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">Histórico de Pedidos & Despachos OEM</h2>
          <p className="text-xs text-slate-500">Comprobantes y certificados de compatibilidad técnica emitidos</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" aria-hidden="true" />
          <h3 className="text-base font-bold text-slate-800">No tienes pedidos registrados</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-6">
            Selecciona tu motocicleta en el Garaje, navega por el catálogo o diagramas de despiece y añade repuestos garantizados.
          </p>
          <a
            href="#catalogo"
            className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
          >
            Explorar Catálogo Suzuki OEM
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900 text-sm">{order.id}</span>
                    <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{order.date}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">TOTAL FACTURADO</span>
                  <span className="text-base font-mono font-black text-slate-900">{formatCurrency(order.totalPrice)}</span>
                </div>
              </div>

              {/* Motorcycle Guarantee Tag */}
              {order.motorcycle && (
                <div className="bg-slate-900 text-white p-3.5 rounded-xl mb-4 text-xs flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                    <span>Garantizado para: <strong>{order.motorcycle.brand} {order.motorcycle.modelName} ({order.motorcycle.year})</strong></span>
                  </div>
                  <span className="font-mono text-[10px] font-extrabold text-emerald-400">{order.guaranteeCode}</span>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase text-slate-600 tracking-wider">PIEZAS DESPACHADAS:</span>
                {order.items.map((it: any, iIdx: number) => (
                  <div key={iIdx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img src={it.part.image} alt={it.part.name} className="w-10 h-10 rounded-lg object-cover bg-white border border-slate-100" />
                      <div>
                        <div className="font-mono font-bold text-[#E60012] text-[10px]">{it.part.oemNumber}</div>
                        <div className="font-bold text-slate-800">{it.part.name}</div>
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-slate-800">
                      {it.quantity}x - {formatCurrency(it.part.price * it.quantity)}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};
