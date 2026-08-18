import React, { useState, useEffect } from 'react';
import { RotateCcw, Search, Filter, ShieldCheck, Truck, CreditCard, DollarSign, Package, AlertCircle, Edit, Trash2, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDocumentNumber } from '../../utils/formatDocumentNumber';
import { AdminPagination } from './AdminPagination';
import { FilterResetButton } from './AdminFilterBar';
import { AdminSearchInput } from './AdminSearchInput';

interface ReturnsManagerProps {
  returnsList: any[];
  searchQuery: string;
  onEditReturn: (item: any) => void;
  onDeleteReturn: (id: string) => void;
  onViewOrder?: (orderId: string) => void;
  isLoading?: boolean;
}

export const ReturnsManager: React.FC<ReturnsManagerProps> = ({
  returnsList,
  searchQuery,
  onEditReturn,
  onDeleteReturn,
  onViewOrder,
  isLoading = false,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Local search (independent from the global header search)
  const [localSearch, setLocalSearch] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to first page whenever filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, localSearch, statusFilter]);

  const activeQuery = (searchQuery || localSearch).trim().toLowerCase();

  const filtered = returnsList.filter((r) => {
    const matchesSearch =
      !activeQuery ||
      r.id.toLowerCase().includes(activeQuery) ||
      r.orderId.toLowerCase().includes(activeQuery) ||
      r.customerName.toLowerCase().includes(activeQuery) ||
      r.email.toLowerCase().includes(activeQuery) ||
      r.reason.toLowerCase().includes(activeQuery);

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filtered.length);
  const paginated = filtered.slice(startIndex, endIndex);

  const pendingCount = returnsList.filter(r => r.status === 'Pendiente').length;
  const refundedCount = returnsList.filter(r => r.status === 'Reembolsada').length;
  const totalRefunded = returnsList.reduce((acc, r) => acc + (r.refundAmount || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pendiente':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Aprobada':
      case 'En tránsito':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      case 'Pieza recibida':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 'Reembolsada':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Rechazada':
        return 'bg-red-100 text-red-900 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'Entregado':
      case 'Completado':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Enviado':
      case 'En tránsito':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Pendiente':
      case 'Pendiente de Pago':
      case 'Pago Pendiente':
        return 'bg-amber-50 text-amber-900 border-amber-300 font-bold';
      case 'Cancelado':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div id="returns-manager" className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white p-2.5 sm:p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center gap-1.5 text-center">
          <div className="w-7 h-7 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl lg:rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
          </div>
          <div className="min-w-0 w-full">
            <span className="text-slate-500 font-bold text-[8px] sm:text-xs uppercase tracking-wider block leading-tight">SOLICITUDES PENDIENTES</span>
            <p className="text-lg sm:text-2xl font-black text-slate-900 font-mono mt-0.5 leading-none">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white p-2.5 sm:p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center gap-1.5 text-center">
          <div className="w-7 h-7 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl lg:rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
          </div>
          <div className="min-w-0 w-full">
            <span className="text-slate-500 font-bold text-[8px] sm:text-xs uppercase tracking-wider block leading-tight">REEMBOLSOS COMPLETADOS</span>
            <p className="text-lg sm:text-2xl font-black text-slate-900 font-mono mt-0.5 leading-none">{refundedCount}</p>
          </div>
        </div>

        <div className="bg-white p-2.5 sm:p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center gap-1.5 text-center">
          <div className="w-7 h-7 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl lg:rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center font-bold shrink-0">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
          </div>
          <div className="min-w-0 w-full">
            <span className="text-slate-500 font-bold text-[8px] sm:text-xs uppercase tracking-wider block leading-tight">TOTAL PROCESADO ($ COP)</span>
            <p className="text-sm sm:text-lg lg:text-2xl font-black text-slate-900 font-mono mt-0.5 leading-none truncate">
              {formatCurrency(totalRefunded)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#0A3088] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({returnsList.length})
          </button>
          <button
            onClick={() => setStatusFilter('Pendiente')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Pendiente'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('En tránsito')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'En tránsito'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            En Tránsito
          </button>
          <button
            onClick={() => setStatusFilter('Reembolsada')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Reembolsada'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Reembolsadas
          </button>
          <button
            onClick={() => setStatusFilter('Rechazada')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Rechazada'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Rechazadas
          </button>
          <FilterResetButton onClick={() => { setStatusFilter('all'); setLocalSearch(''); }} />
        </div>

        <AdminSearchInput
          value={localSearch}
          onChange={setLocalSearch}
          placeholder="Buscar por RMA, Nro pedido, cliente o correo..."
        />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Solicitud RMA & Pedido</th>
                <th className="py-3.5 px-4 text-center">Estado Pedido</th>
                <th className="py-3.5 px-4">Cliente / Contacto</th>
                <th className="py-3.5 px-4">Motivo Devolución</th>
                <th className="py-3.5 px-4 text-center">Estado RMA</th>
                <th className="py-3.5 px-4">Reembolso & Guía</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-8 h-8 border-3 border-[#E60012] border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-mono font-bold text-slate-600 animate-pulse">Cargando devoluciones...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No se encontraron solicitudes de devolución que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                paginated.map((r) => {
                  const orderSt = r.orderStatus || r.order?.status || 'Pendiente de Pago';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Column 1: RMA & Order */}
                      <td className="py-4 px-4 font-mono">
                        <span className="font-extrabold text-slate-900 block">{formatDocumentNumber(r.id, r.prefix, r.documentNumber)}</span>
                        <span className="text-[11px] text-slate-400 font-semibold font-mono">Pedido: {formatDocumentNumber(r.orderId, r.orderPrefix, r.orderDocumentNumber)}</span>
                      </td>

                      {/* Column 2: Order Status */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center text-[10px] font-mono font-extrabold uppercase px-2.5 py-1 rounded-full border ${getOrderStatusBadge(orderSt)}`}>
                          {orderSt}
                        </span>
                      </td>

                      {/* Column 3: Customer */}
                      <td className="py-4 px-4 font-sans">
                        <p className="font-bold text-slate-900">{r.customerName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{r.email}</p>
                      </td>

                      {/* Column 4: Reason */}
                      <td className="py-4 px-4 max-w-xs">
                        <p className="font-semibold text-slate-800 truncate">{r.reason}</p>
                      </td>

                      {/* Column 5: RMA Status */}
                      <td className="py-4 px-4 text-center">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${getStatusBadge(r.status)}`}>
                          {r.status}
                        </span>
                      </td>

                      {/* Column 6: Refund & Guide */}
                      <td className="py-4 px-4 font-mono">
                        <p className="font-black text-slate-900">{formatCurrency(r.refundAmount || 0)}</p>
                        {r.returnTrackingNumber && (
                          <p className="text-[10px] text-slate-500">Guía: {r.returnCarrier} #{r.returnTrackingNumber}</p>
                        )}
                      </td>

                      {/* Column 7: Stock Restock */}
                      <td className="py-4 px-4">
                        {r.restockInventory ? (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Reintegrado
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            Sin cambio
                          </span>
                        )}
                      </td>

                      {/* Column 8: Icon-Only Action Buttons */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onViewOrder && (
                            <button
                              type="button"
                              onClick={() => onViewOrder(r.orderId)}
                              className="p-2 bg-[#0A3088] hover:bg-[#3d59b1] text-white rounded-xl transition-all cursor-pointer shadow-xs"
                              title="Ver Pedido Vinculado"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onEditReturn(r)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-all cursor-pointer shadow-2xs"
                            title="Gestionar Trámite RMA"
                          >
                            <Edit className="w-4 h-4 text-slate-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteReturn(r.id)}
                            className="p-2 text-red-600 hover:bg-red-50 bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                            title="Eliminar Registro RMA"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filtered.length}
          itemLabel="devoluciones"
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
};
