import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  Clock,
  CheckCircle2,
  Truck,
  Filter,
  DollarSign,
  FileText,
  Package
} from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";
import { formatOrderDate } from "../utils/formatDate";
import { OrderDetailModal } from "./OrderDetailModal";

interface ReturnsTableProps {
  returnsList: any[];
  orders?: any[];
}

export const ReturnsTable: React.FC<ReturnsTableProps> = ({ returnsList, orders = [] }) => {
  const allReturns = returnsList || [];

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected Order Modal for detailed tracking
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Pendiente":
        return "bg-amber-100 text-amber-900 border border-amber-300";
      case "Aprobada":
      case "En tránsito":
        return "bg-sky-100 text-sky-900 border border-sky-300";
      case "Pieza recibida":
        return "bg-indigo-100 text-indigo-900 border border-indigo-300";
      case "Reembolsada":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "Rechazada":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-slate-100 text-slate-800 border border-slate-200";
    }
  };

  const getOrderStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Entregado":
      case "Completado":
        return "bg-emerald-50 text-emerald-800 border border-emerald-200";
      case "Enviado":
      case "En tránsito":
        return "bg-sky-50 text-sky-800 border border-sky-200";
      case "Pendiente":
      case "Pendiente de Pago":
      case "Pago Pendiente":
        return "bg-amber-50 text-amber-900 border border-amber-300 font-bold";
      case "Cancelado":
        return "bg-red-50 text-red-800 border border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  const filteredReturns = useMemo(() => {
    return allReturns
      .filter((ret) => {
        const query = searchTerm.toLowerCase();
        const matchesSearch =
          !query ||
          ret.id.toLowerCase().includes(query) ||
          ret.orderId.toLowerCase().includes(query) ||
          ret.reason.toLowerCase().includes(query);

        const matchesStatus =
          statusFilter === "all" ||
          ret.status.toLowerCase() === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date).getTime();
        const dateB = new Date(b.createdAt || b.date).getTime();
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateB - dateA;
      });
  }, [allReturns, searchTerm, statusFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredReturns.length / pageSize) || 1;
  const paginatedReturns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReturns.slice(start, start + pageSize);
  }, [filteredReturns, currentPage, pageSize]);

  const handleOpenDetail = (orderId: string) => {
    const foundOrder = orders.find((o) => o.id === orderId);
    if (foundOrder) {
      setSelectedOrder(foundOrder);
    } else {
      setSelectedOrder({
        id: orderId,
        customerName: "Cliente",
        items: [],
        totalPrice: 0,
        status: "Entregado",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por código RMA, Nro Pedido, motivo..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-sans text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/20 transition-all"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-[#0A3088] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todas ({allReturns.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("Pendiente");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "Pendiente"
                ? "bg-amber-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Pendientes
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("Reembolsada");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "Reembolsada"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Reembolsadas
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Solicitud RMA & Pedido</th>
                <th className="py-3.5 px-4 text-center">Estado Pedido</th>
                <th className="py-3.5 px-4">Fecha Solicitud</th>
                <th className="py-3.5 px-4">Motivo Devolución</th>
                <th className="py-3.5 px-4 text-center">Estado RMA</th>
                <th className="py-3.5 px-4 text-right">Monto Reembolso</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedReturns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No se encontraron solicitudes de devolución que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                paginatedReturns.map((ret) => {
                  const isUnpaid = Boolean(ret.isUnpaidCancel || ret.resolutionType === 'cancellation');
                  const foundOrder = orders.find((o) => o.id === ret.orderId);
                  const orderStatus = isUnpaid ? 'Cancelado' : (ret.orderStatus || foundOrder?.status || 'Pendiente de Pago');

                  return (
                    <tr
                      key={ret.id}
                      onClick={() => handleOpenDetail(ret.orderId)}
                      className="hover:bg-red-50/30 transition-colors cursor-pointer group"
                    >
                      {/* Column 1: RMA Code & Order ID */}
                      <td className="py-4 px-4 font-mono font-black text-slate-900 group-hover:text-[#E60012]">
                        <div>
                          <span>{ret.id}</span>
                          <span className="text-[11px] font-mono font-normal text-slate-500 block mt-0.5">
                            Pedido: {ret.orderId}
                          </span>
                        </div>
                      </td>

                      {/* Column 2: Order Status */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center text-[10px] font-mono font-extrabold uppercase px-2.5 py-1 rounded-full ${getOrderStatusBadgeClass(orderStatus)}`}>
                          {orderStatus}
                        </span>
                      </td>

                      {/* Column 3: Date */}
                      <td className="py-4 px-4 text-slate-600 font-medium whitespace-nowrap font-mono">
                        {formatOrderDate(ret.createdAt || ret.date)}
                      </td>

                      {/* Column 4: Reason */}
                      <td className="py-4 px-4 max-w-xs">
                        <p className="font-semibold text-slate-800 truncate">{ret.reason}</p>
                      </td>

                      {/* Column 5: RMA Status */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${getStatusBadgeClass(
                            ret.status
                          )}`}
                        >
                          {ret.status === "Pendiente" ? (
                            <Clock className="w-3 h-3 text-amber-600" />
                          ) : ret.status === "En tránsito" ? (
                            <Truck className="w-3 h-3 text-sky-600" />
                          ) : ret.status === "Reembolsada" ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <RotateCcw className="w-3 h-3 text-slate-500" />
                          )}
                          {ret.status}
                        </span>
                      </td>

                      {/* Column 6: Refund Amount */}
                      <td className="py-4 px-4 text-right font-mono font-black text-emerald-600">
                        {formatCurrency(ret.refundAmount || 0)}
                      </td>

                      {/* Column 7: Icon-Only Action Buttons */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(ret.orderId);
                            }}
                            className="p-2 bg-[#0A3088] hover:bg-[#3d59b1] text-white rounded-xl transition-all cursor-pointer shadow-xs"
                            title="Ver Pedido Original"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(ret.orderId);
                            }}
                            className="p-2 bg-slate-100 hover:bg-[#E60012] hover:text-white text-slate-700 rounded-xl transition-all cursor-pointer shadow-2xs"
                            title="Ver Detalle & Chat de Devolución"
                          >
                            <Eye className="w-4 h-4" />
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

        {/* Footer / Pagination Controls */}
        {filteredReturns.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <span>Mostrando</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-900 focus:outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <span>por página (Total: {filteredReturns.length})</span>
            </div>

            {/* Page Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 font-mono font-bold text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Order Modal */}
      {selectedOrder && (
        <OrderDetailModal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
        />
      )}
    </div>
  );
};
