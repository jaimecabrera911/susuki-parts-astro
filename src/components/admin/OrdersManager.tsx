import React, { useState, useEffect } from 'react';
import { ShoppingCart, Filter, Eye, Edit, Truck, CheckCircle2, Clock, Package, AlertCircle, FileText, ChevronDown } from 'lucide-react';
import type { Order, OrderStatus } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDocumentNumber } from '../../utils/formatDocumentNumber';
import { fetchOrderStatuses } from '../../services/api';
import { AdminPagination } from './AdminPagination';
import { FilterResetButton } from './AdminFilterBar';
import { AdminSearchInput } from './AdminSearchInput';

interface OrdersManagerProps {
  orders: Order[];
  searchQuery: string;
  onEditOrder: (order: Order) => void;
  onViewOrder: (order: Order) => void;
  isLoading?: boolean;
}

interface StatusRow {
  id: string;
  name: string;
  color: string;
  short?: string;
  group?: string;
  is_default?: boolean;
}

const STATUS_THEMES: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-[#0A3088] border-blue-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200'
};

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders,
  searchQuery,
  onEditOrder,
  onViewOrder,
  isLoading = false,
}) => {
  const [statusRows, setStatusRows] = useState<StatusRow[]>([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to first page whenever filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, localSearch, selectedStatusFilter]);

  useEffect(() => {
    let cancelled = false;
    fetchOrderStatuses()
      .then(rows => { if (!cancelled) setStatusRows(rows as StatusRow[]); })
      .catch(() => { if (!cancelled) setStatusRows([]); });
    return () => { cancelled = true; };
  }, []);

  const statusFilters: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'Todos los Pedidos' },
    ...statusRows.map(s => ({ id: s.name, label: s.short || s.name }))
  ];

  const groupOf = (name: string): string | undefined =>
    statusRows.find(s => s.name === name)?.group;

  const activeQuery = (searchQuery || localSearch).trim().toLowerCase();

  const filteredOrders = orders.filter(ord => {
    const matchesStatus = selectedStatusFilter === 'all' || ord.status === selectedStatusFilter;
    if (!matchesStatus) return false;

    if (!activeQuery) return true;

    const matchesId = ord.id.toLowerCase().includes(activeQuery);
    const matchesCustomer = ord.customerName.toLowerCase().includes(activeQuery);
    const matchesDoc = ord.documentId?.toLowerCase().includes(activeQuery);
    const matchesCity = ord.city?.toLowerCase().includes(activeQuery);
    const matchesTracking = ord.trackingNumber?.toLowerCase().includes(activeQuery);

    return matchesId || matchesCustomer || matchesDoc || matchesCity || matchesTracking;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredOrders.length);
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const getStatusBadge = (st: OrderStatus) => {
    const found = statusRows.find(s => s.name === st);
    const label = found?.short || st;
    const theme = STATUS_THEMES[found?.color || 'slate'] || STATUS_THEMES.slate;
    return <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${theme}`}>{label}</span>;
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const pendingCount = orders.filter(o => groupOf(o.status) === 'pending').length;
  const inTransitCount = orders.filter(o => groupOf(o.status) === 'in_transit').length;
  const deliveredCount = orders.filter(o => groupOf(o.status) === 'delivered').length;

  return (
    <div id="orders-manager" className="space-y-6">
      
      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase leading-tight">Total Pedidos</p>
            <p className="text-lg sm:text-2xl font-black text-slate-900 font-display mt-1 leading-none">{orders.length}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-red-50 text-[#E60012] border border-red-200 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase leading-tight">Pendientes de Pago</p>
            <p className="text-lg sm:text-2xl font-black text-amber-600 font-display mt-1 leading-none">{pendingCount}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase leading-tight">En Despacho / Tránsito</p>
            <p className="text-lg sm:text-2xl font-black text-[#0A3088] font-display mt-1 leading-none">{inTransitCount}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 text-[#0A3088] border border-blue-200 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase leading-tight">Facturación Total</p>
            <p className="text-sm sm:text-xl font-black text-emerald-600 font-mono mt-1 leading-none truncate">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Header */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Status Filters Pill Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar">
            {statusFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedStatusFilter(filter.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all shrink-0 ${
                  selectedStatusFilter === filter.id
                    ? 'bg-[#E60012] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
            <FilterResetButton
              onClick={() => {
                setSelectedStatusFilter('all');
                setLocalSearch('');
              }}
            />
          </div>

          {/* Local Search Input */}
          <AdminSearchInput
            value={localSearch}
            onChange={setLocalSearch}
            placeholder="Buscar por ID, cliente, ciudad o guía..."
          />

        </div>
      </div>

      {/* Orders List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                <th className="py-3.5 px-5">ID Pedido / Fecha</th>
                <th className="py-3.5 px-4">Cliente & Destino</th>
                <th className="py-3.5 px-4">Repuestos</th>
                <th className="py-3.5 px-4">Total (COP)</th>
                <th className="py-3.5 px-4">Guía Transportadora</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {paginatedOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors group">
                  
                  {/* Order ID & Date */}
                  <td className="py-4 px-5">
                    <div>
                      <p className="font-extrabold text-slate-900 group-hover:text-[#E60012] transition-colors font-mono">
                        {formatDocumentNumber(ord.id, ord.prefix, ord.documentNumber)}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400 font-bold">{ord.date}</p>
                    </div>
                  </td>

                  {/* Customer Info */}
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-extrabold text-slate-900 text-xs font-display">{ord.customerName}</p>
                      <p className="text-[11px] font-mono text-slate-500 font-bold">{ord.city} • CC: {ord.documentId}</p>
                    </div>
                  </td>

                  {/* Items Count */}
                  <td className="py-4 px-4">
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                      {ord.items.length} {ord.items.length === 1 ? 'ítem' : 'ítems'}
                    </span>
                  </td>

                  {/* Total Price */}
                  <td className="py-4 px-4">
                    <span className="font-black font-mono text-xs text-[#E60012]">
                      {formatCurrency(ord.totalPrice)}
                    </span>
                  </td>

                  {/* Carrier & Tracking */}
                  <td className="py-4 px-4 text-xs font-mono font-bold">
                    {(['Despachado', 'En tránsito', 'Entregado'].includes(ord.status) ||
                      ord.status.toLowerCase().includes('tránsito') ||
                      ord.status.toLowerCase().includes('transito') ||
                      ord.status.toLowerCase().includes('despachado') ||
                      ord.status.toLowerCase().includes('entregado')) && ord.trackingNumber ? (
                      <div>
                        <p className="text-slate-900">{ord.shippingCarrier || 'Envío'}</p>
                        <p className="text-[10px] text-blue-700 font-bold">{ord.trackingNumber}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-normal font-sans">
                        {(['Despachado', 'En tránsito', 'Entregado'].includes(ord.status) ||
                          ord.status.toLowerCase().includes('tránsito') ||
                          ord.status.toLowerCase().includes('transito') ||
                          ord.status.toLowerCase().includes('despachado') ||
                          ord.status.toLowerCase().includes('entregado'))
                          ? 'Sin guía asignada'
                          : 'Pendiente de despacho'}
                      </span>
                    )}
                  </td>

                  {/* Order Status Badge */}
                  <td className="py-4 px-4">
                    {getStatusBadge(ord.status)}
                  </td>

                  {/* Actions (Icon Only) */}
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onViewOrder(ord)}
                        className="p-2 text-slate-500 hover:text-[#059669] hover:bg-emerald-50 rounded-xl border border-slate-200 shadow-xs transition-colors"
                        title="Ver detalles del pedido"
                      >
                        <Eye className="w-4 h-4 text-[#059669]" />
                      </button>
                      <button
                        onClick={() => onEditOrder(ord)}
                        className="p-2 text-slate-500 hover:text-[#0A3088] hover:bg-blue-50 rounded-xl border border-slate-200 shadow-xs transition-colors"
                        title="Editar estado y transporte"
                      >
                        <Edit className="w-4 h-4 text-[#0A3088]" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}

              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-8 h-8 border-3 border-[#E60012] border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-mono font-bold text-slate-600 animate-pulse">Cargando pedidos...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-mono font-bold">No se encontraron pedidos con los filtros aplicados</p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredOrders.length}
          itemLabel="pedidos"
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

    </div>
  );
};
