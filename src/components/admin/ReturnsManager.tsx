import React, { useState } from 'react';
import { RotateCcw, Clock, CheckCircle2, DollarSign, Edit, Trash2, FileText } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDocumentNumber } from '../../utils/formatDocumentNumber';
import { AdminSearchInput } from './AdminSearchInput';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

interface ReturnsManagerProps {
  returnsList: any[];
  searchQuery: string;
  onEditReturn: (item: any) => void;
  onDeleteReturn: (id: string) => void;
  onViewOrder?: (orderId: string) => void;
  isLoading?: boolean;
}

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

export const ReturnsManager: React.FC<ReturnsManagerProps> = ({
  returnsList,
  searchQuery,
  onEditReturn,
  onDeleteReturn,
  onViewOrder,
  isLoading = false,
}) => {
  // Local search (independent from the global header search)
  const [localSearch, setLocalSearch] = useState('');

  const activeQuery = (searchQuery || localSearch).trim().toLowerCase();

  const getOrderStatus = (r: any): string =>
    r.orderStatus || r.order?.status || 'Pendiente de Pago';

  const columns: DataTableColumn<any>[] = [
    {
      key: 'rma',
      label: 'RMA',
      minWidth: '140px',
      render: (r) => (
        <span className="font-extrabold text-slate-900 font-mono">{formatDocumentNumber(r.id, r.prefix, r.documentNumber)}</span>
      ),
    },
    {
      key: 'order',
      label: 'Pedido',
      minWidth: '140px',
      render: (r) => (
        <span className="text-[11px] font-mono text-slate-600 font-bold">{formatDocumentNumber(r.orderId, r.orderPrefix, r.orderDocumentNumber)}</span>
      ),
    },
    {
      key: 'orderStatus',
      label: 'Estado Pedido',
      minWidth: '140px',
      filterable: true,
      accessor: (r) => getOrderStatus(r),
      render: (r) => (
        <span className={`inline-flex items-center text-[10px] font-mono font-extrabold uppercase px-2.5 py-1 rounded-full border ${getOrderStatusBadge(getOrderStatus(r))}`}>
          {getOrderStatus(r)}
        </span>
      ),
    },
    {
      key: 'customer',
      label: 'Cliente',
      minWidth: '140px',
      render: (r) => (
        <p className="font-bold text-slate-900">{r.customerName}</p>
      ),
    },
    {
      key: 'email',
      label: 'Correo',
      minWidth: '180px',
      render: (r) => (
        <p className="text-[11px] text-slate-500 font-mono">{r.email}</p>
      ),
    },
    {
      key: 'reason',
      label: 'Motivo Devolución',
      minWidth: '180px',
      render: (r) => (
        <p className="font-semibold text-slate-800 truncate max-w-xs">{r.reason}</p>
      ),
    },
    {
      key: 'status',
      label: 'Estado RMA',
      minWidth: '120px',
      filterable: true,
      accessor: (r) => r.status,
      render: (r) => (
        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${getStatusBadge(r.status)}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'refund',
      label: 'Reembolso',
      minWidth: '120px',
      filterable: true,
      ranges: [{ label: 'Reembolso', value: (r) => r.refundAmount || 0 }],
      render: (r) => (
        <p className="font-black text-slate-900 font-mono">{formatCurrency(r.refundAmount || 0)}</p>
      ),
    },
    {
      key: 'guide',
      label: 'Guía',
      minWidth: '120px',
      render: (r) =>
        r.returnTrackingNumber ? (
          <p className="text-[10px] text-slate-500 font-mono">#{r.returnTrackingNumber}</p>
        ) : (
          <span className="text-slate-300 text-[11px]">—</span>
        ),
    },
    {
      key: 'stock',
      label: 'Stock',
      minWidth: '120px',
      filterable: true,
      filterOptions: [
        { value: 'true', label: 'Reintegrado' },
        { value: 'false', label: 'Sin cambio' },
      ],
      filterMatcher: (r, value) => Boolean(r.restockInventory) === (value === 'true'),
      render: (r) =>
        r.restockInventory ? (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
            Reintegrado
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            Sin cambio
          </span>
        ),
    },
  ];

  const handleSearchFilter = (r: any, query: string) =>
    r.id.toLowerCase().includes(query) ||
    r.orderId.toLowerCase().includes(query) ||
    r.customerName.toLowerCase().includes(query) ||
    r.email.toLowerCase().includes(query) ||
    r.reason.toLowerCase().includes(query);

  const pendingCount = returnsList.filter(r => r.status === 'Pendiente').length;
  const refundedCount = returnsList.filter(r => r.status === 'Reembolsada').length;
  const totalRefunded = returnsList.reduce((acc, r) => acc + (r.refundAmount || 0), 0);

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

      {/* Action & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <RotateCcw className="w-4 h-4 shrink-0" />
          <span className="text-xs font-mono font-bold">
            <strong className="text-slate-900">{returnsList.length}</strong> solicitudes de devolución
          </span>
        </div>
        <AdminSearchInput
          value={localSearch}
          onChange={setLocalSearch}
          placeholder="Buscar por RMA, Nro pedido, cliente o correo..."
        />
      </div>

      {/* Returns DataTable with per-column dynamic filters */}
      <DataTable
        data={returnsList}
        columns={columns}
        keyField="id"
        loading={isLoading}
        itemLabel="devoluciones"
        emptyMessage="No se encontraron solicitudes de devolución"
        searchQuery={activeQuery}
        searchFilter={handleSearchFilter}
        actions={(r) => (
          <>
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
          </>
        )}
      />
    </div>
  );
};