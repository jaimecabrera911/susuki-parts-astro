import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldCheck,
  Package,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
} from "lucide-react";
import { OrderDetailModal } from "./OrderDetailModal";
import { getPrimaryOem } from "../types";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDocumentNumber } from "../utils/formatDocumentNumber";
import { formatOrderDate } from "../utils/formatDate";
import { fetchOrderStatuses } from "../services/api";
import { getCarrierTrackingUrl } from "../utils/tracking";

interface OrdersTableProps {
  orders: any[];
  onNavigateToCatalog?: () => void;
  isLoading?: boolean;
}

const STATUS_THEMES: Record<string, string> = {
  amber: "bg-amber-100 text-amber-900 border border-amber-300",
  emerald: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  blue: "bg-blue-100 text-blue-800 border border-blue-200",
  purple: "bg-purple-100 text-purple-800 border border-purple-200",
  indigo: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  red: "bg-red-100 text-red-800 border border-red-200",
  slate: "bg-slate-100 text-slate-800 border border-slate-200",
};

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onNavigateToCatalog,
  isLoading = false,
}) => {
  const allOrders = orders || [];

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [statusRows, setStatusRows] = useState<{ id: string; name: string; color: string }[]>([]);

  // Date Range Filtering
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchOrderStatuses()
      .then(rows => { if (!cancelled) setStatusRows(rows); })
      .catch(() => { if (!cancelled) setStatusRows([]); });
    return () => { cancelled = true; };
  }, []);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Selected Order Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const statusThemeOf = (status: string) =>
    STATUS_THEMES[statusRows.find(s => s.name === status)?.color || "slate"] || STATUS_THEMES.slate;

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
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

  // Filtered orders calculation
  const filteredOrders = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const filtered = allOrders.filter((order) => {
      const formattedDoc = formatDocumentNumber(order.id, order.prefix, order.documentNumber).toLowerCase();
      const matchesSearch =
        !q ||
        (order.id && order.id.toLowerCase().includes(q)) ||
        formattedDoc.includes(q) ||
        (order.trackingNumber && order.trackingNumber.toLowerCase().includes(q)) ||
        (order.shippingCarrier && order.shippingCarrier.toLowerCase().includes(q)) ||
        (order.motorcycle &&
          order.motorcycle.modelName &&
          order.motorcycle.modelName.toLowerCase().includes(q)) ||
        (order.guaranteeCode &&
          order.guaranteeCode.toLowerCase().includes(q)) ||
        (order.items &&
          order.items.some(
            (it: any) =>
              (it.part && getPrimaryOem(it.part).toLowerCase().includes(q)) ||
              (it.part?.name && it.part.name.toLowerCase().includes(q)) ||
              (it.name && it.name.toLowerCase().includes(q))
          ));

      const matchesStatus =
        statusFilter === "all" ||
        (order.status && order.status.toLowerCase() === statusFilter.toLowerCase());

      // Date range filtering
      let matchesDate = true;
      const rowTime = new Date(order.date).getTime();
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
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;
        comparison = dateA - dateB;
      } else if (sortBy === "id") {
        const docA = (a.documentNumber || a.id || "").toLowerCase();
        const docB = (b.documentNumber || b.id || "").toLowerCase();
        comparison = docA.localeCompare(docB);
      } else if (sortBy === "total") {
        comparison = (a.totalPrice || 0) - (b.totalPrice || 0);
      } else if (sortBy === "items") {
        const countA = a.items?.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0) || 0;
        const countB = b.items?.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0) || 0;
        comparison = countA - countB;
      } else if (sortBy === "status") {
        comparison = (a.status || "").localeCompare(b.status || "");
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [allOrders, searchTerm, statusFilter, sortBy, sortDirection, startDate, endDate]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(
    startIndex,
    startIndex + pageSize,
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div id="orders-table" className="space-y-6">
      {/* Top Header & Search Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por ID, moto o Ref. OEM..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012] cursor-pointer"
            >
              <option value="all">Todos los Estados</option>
              {statusRows.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowDateFilter((prev) => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              startDate || endDate
                ? "bg-[#E60012] text-white"
                : showDateFilter
                ? "bg-slate-200 text-slate-900"
                : "bg-slate-50 border border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{startDate || endDate ? "Filtro Fecha Activo" : "Filtrar Fechas"}</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Mostrar:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
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

      {/* DataTable Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#E60012] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono font-bold text-slate-600 animate-pulse">Cargando historial de pedidos...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">
              No se encontraron pedidos
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Intenta cambiando los filtros de búsqueda o consulta tus pedidos
              recientes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold">
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleSort("id")}
                      className="flex items-center gap-1.5 hover:text-slate-900 transition-colors uppercase font-extrabold cursor-pointer"
                    >
                      <span>ID Pedido</span>
                      {sortBy === "id" ? (
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
                      className="flex items-center gap-1.5 hover:text-slate-900 transition-colors uppercase font-extrabold cursor-pointer"
                    >
                      <span>Fecha & Hora</span>
                      {sortBy === "date" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-[#E60012]" /> : <ArrowDown className="w-3 h-3 text-[#E60012]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">Motocicleta Verificada</th>
                  <th className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort("items")}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors uppercase font-extrabold cursor-pointer"
                    >
                      <span>Ítems</span>
                      {sortBy === "items" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-[#E60012]" /> : <ArrowDown className="w-3 h-3 text-[#E60012]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("total")}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors uppercase font-extrabold cursor-pointer ml-auto"
                    >
                      <span>Total Facturado</span>
                      {sortBy === "total" ? (
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
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors uppercase font-extrabold cursor-pointer"
                    >
                      <span>Estado</span>
                      {sortBy === "status" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-[#E60012]" /> : <ArrowDown className="w-3 h-3 text-[#E60012]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedOrders.map((order) => {
                  const itemCount = order.items.reduce(
                    (acc: number, it: any) => acc + (it.quantity || 1),
                    0,
                  );

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-red-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-4 font-mono font-black text-slate-900 group-hover:text-[#E60012]">
                        {formatDocumentNumber(order.id, order.prefix, order.documentNumber)}
                      </td>

                      <td className="py-4 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {formatOrderDate(order.date)}
                      </td>

                      <td className="py-4 px-4">
                        {(() => {
                          const bikes = Array.from(
                            new Set(
                              order.items
                                .map((it: any) => {
                                  if (it.motorcycle)
                                    return `${it.motorcycle.modelName}`;
                                  if (order.motorcycle)
                                    return `${order.motorcycle.modelName}`;
                                  return null;
                                })
                                .filter(Boolean),
                            ),
                          ) as string[];

                          if (bikes.length === 1) {
                            return (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{bikes[0]}</span>
                              </div>
                            );
                          } else if (bikes.length > 1) {
                            return (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#E60012] shrink-0" />
                                <span>
                                  {bikes[0]}{" "}
                                  <span className="text-[#E60012] font-black">
                                    +{bikes.length - 1} más
                                  </span>
                                </span>
                              </div>
                            );
                          }

                          return (
                            <span className="text-slate-400 font-medium text-xs">
                              Suzuki Universal
                            </span>
                          );
                        })()}
                      </td>

                      <td className="py-4 px-4 text-center font-bold text-slate-700">
                        {itemCount} {itemCount === 1 ? "pieza" : "piezas"}
                      </td>

                      <td className="py-4 px-4 text-right font-mono font-black text-slate-900">
                        {formatCurrency(order.totalPrice)}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${statusThemeOf(order.status)}`}
                        >
                          {order.status.toLowerCase().includes("pendiente") ? (
                            <Clock className="w-3 h-3 text-amber-600" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          {order.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {getCarrierTrackingUrl(order) && (
                            <a
                              href={getCarrierTrackingUrl(order)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-[#E60012] text-[#E60012] hover:text-white border border-red-200 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Rastrear Envío de la Transportadora"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Rastrear ↗</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-800 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Detalle</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* DataTable Pagination Footer */}
        {filteredOrders.length > 0 && (
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              Mostrando{" "}
              <strong className="text-slate-900">{startIndex + 1}</strong> a{" "}
              <strong className="text-slate-900">
                {Math.min(startIndex + pageSize, filteredOrders.length)}
              </strong>{" "}
              de{" "}
              <strong className="text-slate-900">
                {filteredOrders.length}
              </strong>{" "}
              pedidos
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePageChange(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Página Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      safeCurrentPage === page
                        ? "bg-[#E60012] text-white shadow-xs"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() => handlePageChange(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Página Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
};
