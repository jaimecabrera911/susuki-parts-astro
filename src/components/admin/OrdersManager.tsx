import React, { useState, useEffect } from 'react';
import { ShoppingCart, Eye, Edit, Truck, CheckCircle2, Clock } from 'lucide-react';
import type { Order, OrderStatus } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDocumentNumber } from '../../utils/formatDocumentNumber';
import { fetchOrderStatuses } from '../../services/api';
import { AdminSearchInput } from './AdminSearchInput';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

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

const isShipped = (status: string): boolean =>
  ['Despachado', 'En tránsito', 'Entregado'].includes(status) ||
  status.toLowerCase().includes('tránsito') ||
  status.toLowerCase().includes('transito') ||
  status.toLowerCase().includes('despachado') ||
  status.toLowerCase().includes('entregado');

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders,
  searchQuery,
  onEditOrder,
  onViewOrder,
  isLoading = false,
}) => {
  const [statusRows, setStatusRows] = useState<StatusRow[]>([]);
  const [localSearch, setLocalSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchOrderStatuses()
      .then(rows => { if (!cancelled) setStatusRows(rows as StatusRow[]); })
      .catch(() => { if (!cancelled) setStatusRows([]); });
    return () => { cancelled = true; };
  }, []);

  const groupOf = (name: string): string | undefined =>
    statusRows.find(s => s.name === name)?.group;

  const activeQuery = (searchQuery || localSearch).trim().toLowerCase();

  const getStatusBadge = (st: OrderStatus) => {
    const found = statusRows.find(s => s.name === st);
    const label = found?.short || st;
    const theme = STATUS_THEMES[found?.color || 'slate'] || STATUS_THEMES.slate;
    return <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${theme}`}>{label}</span>;
  };

  const columns: DataTableColumn<Order>[] = [
    {
      key: 'id',
      label: 'ID Pedido',
      minWidth: '140px',
      sortable: true,
      sortSelector: (ord) => ord.documentNumber || ord.id,
      render: (ord) => (
        <p className="font-extrabold text-slate-900 group-hover:text-[#E60012] transition-colors font-mono">
          {formatDocumentNumber(ord.id, ord.prefix, ord.documentNumber)}
        </p>
      ),
    },
    {
      key: 'date',
      label: 'Fecha',
      minWidth: '100px',
      render: (ord) => (
        <p className="text-[11px] font-mono text-slate-500 font-bold">{ord.date}</p>
      ),
    },
    {
      key: 'customer',
      label: 'Cliente',
      minWidth: '160px',
      render: (ord) => (
        <p className="font-extrabold text-slate-900 text-xs font-display">{ord.customerName}</p>
      ),
    },
    {
      key: 'city',
      label: 'Ciudad',
      minWidth: '120px',
      render: (ord) => (
        <p className="text-[11px] font-mono text-slate-500 font-bold">{ord.city || '—'}</p>
      ),
    },
    {
      key: 'cc',
      label: 'C.C. / NIT',
      minWidth: '120px',
      render: (ord) => (
        <p className="text-[11px] font-mono text-slate-700 font-bold">{ord.documentId || '—'}</p>
      ),
    },
    {
      key: 'items',
      label: 'Repuestos',
      minWidth: '100px',
      filterable: true,
      ranges: [{ label: 'Ítems', value: (ord) => ord.items?.length || 0 }],
      render: (ord) => (
        <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
          {ord.items?.length || 0} {ord.items?.length === 1 ? 'ítem' : 'ítems'}
        </span>
      ),
    },
    {
      key: 'total',
      label: 'Total (COP)',
      minWidth: '120px',
      filterable: true,
      ranges: [{ label: 'Total', value: (ord) => ord.totalPrice || 0 }],
      sortable: true,
      sortSelector: (ord) => ord.totalPrice || 0,
      render: (ord) => (
        <span className="font-black font-mono text-xs text-[#E60012]">
          {formatCurrency(ord.totalPrice)}
        </span>
      ),
    },
    {
      key: 'carrier',
      label: 'Transportadora',
      minWidth: '120px',
      render: (ord) => (
        <p className="text-xs text-slate-900 font-bold">
          {isShipped(ord.status) ? ord.shippingCarrier || 'Envío' : '—'}
        </p>
      ),
    },
    {
      key: 'tracking',
      label: 'Guía Nro',
      minWidth: '140px',
      render: (ord) =>
        isShipped(ord.status) && ord.trackingNumber ? (
          <span className="text-[10px] text-blue-700 font-mono font-bold">{ord.trackingNumber}</span>
        ) : (
          <span className="text-slate-400 text-[11px] font-normal font-sans">
            {isShipped(ord.status) ? 'Sin guía asignada' : 'Pendiente de despacho'}
          </span>
        ),
    },
    {
      key: 'status',
      label: 'Estado',
      minWidth: '120px',
      filterable: true,
      accessor: (ord) => ord.status,
      filterOptions: statusRows.map((s) => ({ value: s.name, label: s.short || s.name })),
      render: (ord) => getStatusBadge(ord.status),
    },
  ];

  const handleSearchFilter = (ord: Order, query: string) =>
    ord.id.toLowerCase().includes(query) ||
    ord.customerName.toLowerCase().includes(query) ||
    (ord.documentId?.toLowerCase().includes(query) ?? false) ||
    (ord.city?.toLowerCase().includes(query) ?? false) ||
    (ord.trackingNumber?.toLowerCase().includes(query) ?? false);

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

      {/* Action & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <AdminSearchInput
          value={localSearch}
          onChange={setLocalSearch}
          placeholder="Buscar por ID, cliente, ciudad o guía..."
        />
      </div>

      {/* Orders DataTable with per-column dynamic filters */}
      <DataTable
        data={orders}
        columns={columns}
        keyField="id"
        loading={isLoading}
        itemLabel="pedidos"
        emptyMessage="No se encontraron pedidos con los filtros aplicados"
        searchQuery={activeQuery}
        searchFilter={handleSearchFilter}
        actions={(ord) => (
          <>
            <button
              onClick={() => onViewOrder(ord)}
              className="p-2 text-slate-500 hover:text-[#059669] hover:bg-emerald-50 rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
              title="Ver detalles del pedido"
            >
              <Eye className="w-4 h-4 text-[#059669]" />
            </button>
            <button
              onClick={() => onEditOrder(ord)}
              className="p-2 text-slate-500 hover:text-[#0A3088] hover:bg-blue-50 rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
              title="Editar estado y transporte"
            >
              <Edit className="w-4 h-4 text-[#0A3088]" />
            </button>
          </>
        )}
      />
    </div>
  );
};