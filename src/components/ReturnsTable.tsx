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
  Package,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";
import { formatOrderDate } from "../utils/formatDate";
import { formatDocumentNumber } from "../utils/formatDocumentNumber";
import { OrderDetailModal } from "./OrderDetailModal";

interface ReturnsTableProps {
  returnsList: any[];
  orders?: any[];
  isLoading?: boolean;
}

import { ReturnStatusTimeline } from "./ReturnStatusTimeline";

export const ReturnsTable: React.FC<ReturnsTableProps> = ({ returnsList, orders = [], isLoading = false }) => {
  const allReturns = returnsList || [];

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Date Range Filtering
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Selected Order Modal for detailed tracking
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  
  // Selected Return for Timeline view
  const [selectedReturn, setSelectedReturn] = useState<any | null>(null);

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
        return "bg-sky-50 text-sky-800 border-sky-200";
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

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  const applyPreset = (preset: "today" | "7days" | "thisMonth" | "30days") => {
    const now = new Date();
    const toDateStr = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    let start = "";
    const end = toDateStr(now);

    if (preset === "today") {
      start = end;
    } else if (preset === "7days") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = toDateStr(d);
    } else if (preset === "thisMonth") {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      start = toDateStr(d);
    } else if (preset === "30days") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      start = toDateStr(d);
    }

    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1);
  };

  const clearDateRange = () => {
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const filteredReturns = useMemo(() => {
    return allReturns
      .filter((ret) => {
        const query = searchTerm.toLowerCase();
        const rmaDoc = formatDocumentNumber(ret.id, ret.prefix, ret.documentNumber).toLowerCase();
        const orderDoc = formatDocumentNumber(ret.orderId, ret.orderPrefix, ret.orderDocumentNumber).toLowerCase();
        const matchesSearch =
          !query ||
          (ret.id && ret.id.toLowerCase().includes(query)) ||
          (ret.orderId && ret.orderId.toLowerCase().includes(query)) ||
          (ret.reason && ret.reason.toLowerCase().includes(query)) ||
          rmaDoc.includes(query) ||
          orderDoc.includes(query);

        const matchesStatus =
          statusFilter === "all" ||
          (ret.status && ret.status.toLowerCase() === statusFilter.toLowerCase());

        // Date range filtering
        let matchesDate = true;
        const rowTime = new Date(ret.createdAt || ret.date).getTime();
        if (!isNaN(rowTime)) {
          if (startDate) {
            const startTime = new Date(`${startDate}T00:00:00`).getTime();
            if (!isNaN(startTime) && rowTime < startTime) matchesDate = false;
          }
          if (endDate) {
            const endTime = new Date(`${endDate}T23:59:59.999`).getTime();
            if (!isNaN(endTime) && rowTime > endTime) matchesDate = false;
          }
        }

        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === "date") {
          const dateA = new Date(a.createdAt || a.date).getTime() || 0;
          const dateB = new Date(b.createdAt || b.date).getTime() || 0;
          comparison = dateA - dateB;
        } else if (sortBy === "rma") {
          const rmaA = (a.documentNumber || a.id || "").toLowerCase();
          const rmaB = (b.documentNumber || b.id || "").toLowerCase();
          comparison = rmaA.localeCompare(rmaB);
        } else if (sortBy === "order") {
          const ordA = (a.orderDocumentNumber || a.orderId || "").toLowerCase();
          const ordB = (b.orderDocumentNumber || b.orderId || "").toLowerCase();
          comparison = ordA.localeCompare(ordB);
        } else if (sortBy === "orderStatus") {
          const stA = (a.orderStatus || "").toLowerCase();
          const stB = (b.orderStatus || "").toLowerCase();
          comparison = stA.localeCompare(stB);
        } else if (sortBy === "reason") {
          comparison = (a.reason || "").localeCompare(b.reason || "");
        } else if (sortBy === "status") {
          comparison = (a.status || "").localeCompare(b.status || "");
        } else if (sortBy === "refund") {
          comparison = (a.refundAmount || 0) - (b.refundAmount || 0);
        }

        return sortDirection === "asc" ? comparison : -comparison;
      });
  }, [allReturns, searchTerm, statusFilter, sortBy, sortDirection, startDate, endDate]);

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
    <div id="returns-table" className="space-y-4">
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

        {/* Filter Chips & Date Picker Toggle */}
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

          <button
            type="button"
            onClick={() => setShowDateFilter((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              startDate || endDate
                ? "bg-[#E60012] text-white"
                : showDateFilter
                ? "bg-slate-200 text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{startDate || endDate ? "Filtro Fecha Activo" : "Filtrar Fechas"}</span>
          </button>
        </div>
      </div>

      {/* Expandable Date Range Filter Bar */}
      {showDateFilter && (
        <div className="bg-white p-3.5 rounded-2xl border border-red-200 shadow-xs flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">
              Presets:
            </span>
            <button
              type="button"
              onClick={() => applyPreset("today")}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-[#E60012] rounded-lg transition-colors cursor-pointer"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => applyPreset("7days")}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-[#E60012] rounded-lg transition-colors cursor-pointer"
            >
              Últimos 7 días
            </button>
            <button
              type="button"
              onClick={() => applyPreset("thisMonth")}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-[#E60012] rounded-lg transition-colors cursor-pointer"
            >
              Este mes
            </button>
            <button
              type="button"
              onClick={() => applyPreset("30days")}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-[#E60012] rounded-lg transition-colors cursor-pointer"
            >
              Últimos 30 días
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Desde:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 text-xs font-mono font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E60012]/30 focus:border-[#E60012] outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Hasta:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 text-xs font-mono font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E60012]/30 focus:border-[#E60012] outline-none"
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={clearDateRange}
                className="px-2 py-1 text-xs font-bold text-[#E60012] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                Limpiar Rango
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort("rma")}
                    className="flex items-center gap-1.5 hover:text-slate-900 transition-colors uppercase font-bold cursor-pointer font-mono"
                  >
                    <span>Solicitud RMA & Pedido</span>
                    {sortBy === "rma" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-[#E60012]" /> : <ArrowDown className="w-3 h-3 text-[#E60012]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleSort("orderStatus")}
                    className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors uppercase font-bold cursor-pointer font-mono"
                  >
                    <span>Estado Pedido</span>
                    {sortBy === "orderStatus" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-[#E60012]" /> : <ArrowDown className="w-3 h-3 text-[#E60012]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort("date")}
                    className="flex items-center gap-1.5 hover:text-slate-900 transition-colors uppercase font-bold cursor-pointer font-mono"
                  >
                    <span>Fecha & Hora Solicitud</span>
                    {sortBy === "date" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-[#E60012]" /> : <ArrowDown className="w-3 h-3 text-[#E60012]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort("reason")}
                    className="flex items-center gap-1.5 hover:text-slate-900 transition-colors uppercase font-bold cursor-pointer font-mono"
                  >
                    <span>Motivo Devolución</span>
                    {sortBy === "reason" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-[#E60012]" /> : <ArrowDown className="w-3 h-3 text-[#E60012]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleSort("status")}
                    className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors uppercase font-bold cursor-pointer font-mono"
                  >
                    <span>Estado RMA</span>
                    {sortBy === "status" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-[#E60012]" /> : <ArrowDown className="w-3 h-3 text-[#E60012]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort("refund")}
                    className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors uppercase font-bold cursor-pointer font-mono ml-auto"
                  >
                    <span>Monto Reembolso</span>
                    {sortBy === "refund" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-[#E60012]" /> : <ArrowDown className="w-3 h-3 text-[#E60012]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-8 h-8 border-3 border-[#E60012] border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-mono font-bold text-slate-600 animate-pulse">Cargando devoluciones...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedReturns.length === 0 ? (
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
                          <span>{formatDocumentNumber(ret.id, ret.prefix, ret.documentNumber)}</span>
                          <span className="text-[11px] font-mono font-normal text-slate-500 block mt-0.5">
                            Pedido: {formatDocumentNumber(ret.orderId, ret.orderPrefix, ret.orderDocumentNumber)}
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
                              setSelectedReturn(ret);
                            }}
                            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer shadow-xs text-xs flex items-center gap-1.5"
                            title="Trazabilidad & Timeline RMA"
                          >
                            <Eye className="w-3.5 h-3.5" /> Timeline RMA
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(ret.orderId);
                            }}
                            className="p-2 bg-slate-100 hover:bg-[#0A3088] hover:text-white text-slate-700 rounded-xl transition-all cursor-pointer shadow-2xs"
                            title="Ver Pedido Original"
                          >
                            <FileText className="w-4 h-4" />
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

      {/* Timeline Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl my-8">
            <button
              onClick={() => setSelectedReturn(null)}
              className="absolute -top-3 -right-3 z-10 p-2 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full shadow-lg border border-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <ReturnStatusTimeline orderReturn={selectedReturn} />
          </div>
        </div>
      )}

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
