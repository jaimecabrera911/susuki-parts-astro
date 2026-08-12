import React from 'react';
import { Package } from 'lucide-react';
import { OrdersTable } from './OrdersTable';

interface OrdersModalProps {
  orders: any[];
}

export const OrdersModal: React.FC<OrdersModalProps> = ({ orders }) => {
  return (
    <div id="orders-modal" className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#E60012] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
          <Package className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">Histórico de Pedidos & Despachos OEM</h2>
          <p className="text-xs text-slate-500">Consulta y filtra tus compras con certificado de compatibilidad técnica Suzuki</p>
        </div>
      </div>

      <OrdersTable orders={orders} />
    </div>
  );
};
