import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { OrderDetailModal } from "./OrderDetailModal";
import { getPrimaryOem } from "../types";
import { formatCurrency } from "../utils/formatCurrency";
import { formatOrderDate } from "../utils/formatDate";

interface OrdersTableProps {
  orders: any[];
  onNavigateToCatalog?: () => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onNavigateToCatalog,
}) => {
  const allOrders = orders || [];

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Selected Order Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Filtered orders calculation
  const filteredOrders = useMemo(() => {
    return allOrders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.motorcycle &&
          order.motorcycle.modelName
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (order.guaranteeCode &&
          order.guaranteeCode
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        order.items.some(
          (it: any) =>
            getPrimaryOem(it.part)
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            it.part.name.toLowerCase().includes(searchTerm.toLowerCase()),
        );

      const matchesStatus =
        statusFilter === "all" ||
        order.status.toLowerCase().includes(statusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  }, [allOrders, searchTerm, statusFilter]);

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
    <div className="space-y-6">
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
              <option value="Pendiente">Pendientes de Pago</option>
              <option value="Despachado">Despachados</option>
              <option value="Entregado">Entregados</option>
            </select>
          </div>

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

      {/* DataTable Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
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
                  <th className="py-3.5 px-4">ID Pedido</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Motocicleta Verificada</th>
                  <th className="py-3.5 px-4 text-center">Ítems</th>
                  <th className="py-3.5 px-4 text-right">Total Facturado</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
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
                        {order.id}
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
                          className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                            order.status.includes("Pendiente")
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : order.status.includes("Entregado")
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {order.status.includes("Pendiente") ? (
                            <Clock className="w-3 h-3 text-amber-600" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          {order.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-[#E60012] hover:text-white text-slate-800 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Detalle</span>
                        </button>
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
