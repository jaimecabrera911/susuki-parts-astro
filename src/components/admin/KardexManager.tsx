import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Boxes,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCcw,
  DollarSign,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Package,
  Layers,
  TrendingUp,
  TrendingDown,
  Check,
  ChevronDown
} from 'lucide-react';
import type { InventoryMovement, InventoryMovementType, SuzukiPart } from '../../types';
import { getPrimaryOem, matchesOem } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatOrderDate } from '../../utils/formatDate';
import { getImageUrl } from '../../utils/imageUrl';
import { fetchKardex, saveKardexMovementApi, fetchParts } from '../../services/api';
import { AdminSearchInput } from './AdminSearchInput';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

interface KardexManagerProps {
  initialPartId?: string;
}

const MOVEMENT_TYPE_META: Record<InventoryMovementType, { label: string; group: 'in' | 'out' | 'init' | 'adjust'; badgeClass: string; icon: any }> = {
  INITIAL_STOCK: {
    label: 'Saldo Inicial',
    group: 'init',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    icon: Layers
  },
  OUT_SALE: {
    label: 'Salida por Venta',
    group: 'out',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: ArrowUpRight
  },
  IN_CANCEL: {
    label: 'Reintegro Anulación',
    group: 'in',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: ArrowDownLeft
  },
  IN_RETURN: {
    label: 'Devolución RMA',
    group: 'in',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: ArrowDownLeft
  },
  IN_PURCHASE: {
    label: 'Entrada por Compra',
    group: 'in',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: ArrowDownLeft
  },
  OUT_DAMAGE: {
    label: 'Salida por Merma/Daño',
    group: 'out',
    badgeClass: 'bg-red-50 text-red-800 border-red-200',
    icon: ArrowUpRight
  },
  OUT_INTERNAL: {
    label: 'Uso Interno/Taller',
    group: 'out',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: ArrowUpRight
  },
  ADJUST_IN: {
    label: 'Ajuste Positivo',
    group: 'adjust',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: TrendingUp
  },
  ADJUST_OUT: {
    label: 'Ajuste Negativo',
    group: 'adjust',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: TrendingDown
  }
};

export const KardexManager: React.FC<KardexManagerProps> = ({ initialPartId }) => {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [partsList, setPartsList] = useState<SuzukiPart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string>(initialPartId || '');
  const [localSearch, setLocalSearch] = useState('');

  // Form states for manual movement modal
  const [formData, setFormData] = useState({
    partId: initialPartId || '',
    movementType: 'IN_PURCHASE' as InventoryMovementType,
    quantity: 1,
    unitCost: 0,
    referenceDocument: '',
    notes: '',
    userName: 'Admin'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal product search / autocomplete state
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [isPartDropdownOpen, setIsPartDropdownOpen] = useState(false);
  const partDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (partDropdownRef.current && !partDropdownRef.current.contains(event.target as Node)) {
        setIsPartDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const modalFilteredParts = useMemo(() => {
    if (!modalSearchQuery.trim()) return partsList.slice(0, 30);
    const q = modalSearchQuery.toLowerCase().trim();
    return partsList.filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(q);
      const skuMatch = p.sku?.toLowerCase().includes(q);
      const catMatch = p.category?.toLowerCase().includes(q);
      const oemMatch = matchesOem(p, q);
      return nameMatch || skuMatch || catMatch || oemMatch;
    }).slice(0, 30);
  }, [partsList, modalSearchQuery]);

  const selectedModalPart = useMemo(() => {
    return partsList.find((p) => p.id === formData.partId);
  }, [partsList, formData.partId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [kardexData, partsData] = await Promise.all([
        fetchKardex(selectedPartId ? { partId: selectedPartId } : undefined).catch(() => []),
        fetchParts().catch(() => [])
      ]);
      setMovements(kardexData || []);
      setPartsList(partsData || []);
    } catch (err: any) {
      console.error('Error cargando Kardex:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPartId]);

  // Summary Metrics calculation
  const metrics = useMemo(() => {
    let totalInQty = 0;
    let totalOutQty = 0;
    let totalInventoryValuation = 0;

    for (const m of movements) {
      if (m.quantity > 0) {
        totalInQty += m.quantity;
      } else {
        totalOutQty += Math.abs(m.quantity);
      }
    }

    // Valuation of all parts currently in stock (stock * cost)
    for (const p of partsList) {
      const stock = p.stock ?? 0;
      const cost = p.cost || (p.price ? p.price * 0.6 : 0);
      if (stock > 0) {
        totalInventoryValuation += stock * cost;
      }
    }

    return {
      totalMovements: movements.length,
      totalInQty,
      totalOutQty,
      totalInventoryValuation,
      lowStockParts: partsList.filter((p) => (p.stock ?? 0) <= 2).length
    };
  }, [movements, partsList]);

  const handleOpenModal = (partId?: string) => {
    const targetId = partId || selectedPartId || '';
    const defaultPart = partsList.find((p) => p.id === targetId);
    setFormData({
      partId: defaultPart?.id || '',
      movementType: 'IN_PURCHASE',
      quantity: 1,
      unitCost: defaultPart?.cost || (defaultPart?.price ? defaultPart.price * 0.6 : 0),
      referenceDocument: '',
      notes: '',
      userName: 'Admin'
    });
    setModalSearchQuery('');
    setIsPartDropdownOpen(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handlePartSelect = (pId: string) => {
    const target = partsList.find((p) => p.id === pId);
    setFormData((prev) => ({
      ...prev,
      partId: pId,
      unitCost: target?.cost || (target?.price ? target.price * 0.6 : 0)
    }));
  };

  const handleSubmitMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partId) {
      setFormError('Debes seleccionar un repuesto');
      return;
    }
    if (!formData.quantity || formData.quantity <= 0) {
      setFormError('La cantidad debe ser mayor a cero');
      return;
    }
    if (!formData.notes.trim()) {
      setFormError('Debes ingresar una justificación u observación para el movimiento');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const selectedPart = partsList.find((p) => p.id === formData.partId);
      await saveKardexMovementApi({
        partId: formData.partId,
        movementType: formData.movementType,
        quantity: formData.quantity,
        unitCost: Number(formData.unitCost || 0),
        unitPrice: selectedPart?.price || 0,
        referenceType: 'manual_adjustment',
        referenceDocument: formData.referenceDocument.trim() || null,
        notes: formData.notes.trim(),
        userName: formData.userName || 'Admin'
      });

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Error registrando movimiento en Kardex');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: DataTableColumn<InventoryMovement>[] = [
    {
      key: 'createdAt',
      label: 'Fecha & Hora',
      minWidth: '170px',
      sortable: true,
      sortSelector: (m) => new Date(m.createdAt).getTime(),
      filterable: true,
      dateRange: true,
      dateAccessor: (m) => m.createdAt,
      render: (m) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 text-xs font-mono">
            {formatOrderDate(m.createdAt)}
          </span>
          <span className="text-[11px] text-slate-400 font-sans">
            Op: {m.userName}
          </span>
        </div>
      )
    },
    {
      key: 'partName',
      label: 'Repuesto',
      minWidth: '220px',
      sortable: true,
      sortSelector: (m) => m.partName || '',
      filterable: true,
      accessor: (m) => m.partName || 'Sin repuesto',
      render: (m) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 line-clamp-1 text-sm">
            {m.partName}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            {m.partSku && (
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold border border-slate-200">
                SKU: {m.partSku}
              </span>
            )}
            {m.partCategory && (
              <span className="text-[11px] text-slate-500 capitalize">
                {m.partCategory}
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'movementType',
      label: 'Tipo de Movimiento',
      minWidth: '170px',
      sortable: true,
      sortSelector: (m) => m.movementType,
      filterable: true,
      accessor: (m) => m.movementType,
      filterOptions: Object.entries(MOVEMENT_TYPE_META).map(([key, meta]) => ({
        value: key,
        label: meta.label
      })),
      render: (m) => {
        const meta = MOVEMENT_TYPE_META[m.movementType] || {
          label: m.movementType,
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Boxes
        };
        const Icon = meta.icon;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.badgeClass}`}>
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {meta.label}
          </span>
        );
      }
    },
    {
      key: 'referenceDocument',
      label: 'Referencia / Doc.',
      minWidth: '140px',
      sortable: true,
      sortSelector: (m) => m.referenceDocument || m.referenceType || '',
      filterable: true,
      accessor: (m) => m.referenceDocument || m.referenceType || 'Sin referencia',
      render: (m) => (
        <div className="flex flex-col">
          {m.referenceDocument ? (
            <span className="font-mono text-xs font-extrabold text-slate-800">
              {m.referenceDocument}
            </span>
          ) : (
            <span className="text-xs text-slate-400 italic">
              {m.referenceType}
            </span>
          )}
          {m.notes && (
            <span className="text-[11px] text-slate-500 line-clamp-1 max-w-[180px]" title={m.notes}>
              {m.notes}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'quantity',
      label: 'Entrada / Salida',
      minWidth: '130px',
      align: 'center',
      sortable: true,
      sortSelector: (m) => m.quantity,
      filterable: true,
      ranges: [{ label: 'Cantidad', value: (m) => m.quantity }],
      render: (m) => {
        const isPositive = m.quantity > 0;
        return (
          <div className="flex items-center justify-center gap-1">
            <span
              className={`px-2 py-0.5 rounded text-xs font-black font-mono ${
                isPositive
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}
            >
              {isPositive ? `+${m.quantity}` : `${m.quantity}`}
            </span>
          </div>
        );
      }
    },
    {
      key: 'resultingStock',
      label: 'Saldo Stock',
      minWidth: '110px',
      align: 'center',
      sortable: true,
      sortSelector: (m) => m.resultingStock,
      filterable: true,
      ranges: [{ label: 'Saldo Stock', value: (m) => m.resultingStock }],
      render: (m) => (
        <div className="flex flex-col items-center">
          <span className="font-black text-slate-900 text-sm font-mono">
            {m.resultingStock}
          </span>
          <span className="text-[10px] text-slate-400">
            Ant: {m.previousStock}
          </span>
        </div>
      )
    },
    {
      key: 'unitCost',
      label: 'Costo Prom. Unit.',
      minWidth: '130px',
      align: 'right',
      sortable: true,
      sortSelector: (m) => m.unitCost || 0,
      filterable: true,
      ranges: [{ label: 'Costo Prom. ($ COP)', value: (m) => m.unitCost || 0 }],
      render: (m) => (
        <span className="font-mono text-xs font-semibold text-slate-700">
          {formatCurrency(m.unitCost || 0)}
        </span>
      )
    },
    {
      key: 'totalAmount',
      label: 'Total Movimiento',
      minWidth: '140px',
      align: 'right',
      sortable: true,
      sortSelector: (m) => m.totalAmount || 0,
      filterable: true,
      ranges: [{ label: 'Total Mov. ($ COP)', value: (m) => m.totalAmount || 0 }],
      render: (m) => (
        <span className="font-mono text-xs font-extrabold text-slate-900">
          {formatCurrency(m.totalAmount || 0)}
        </span>
      )
    }
  ];

  return (
    <div id="kardex-manager" className="space-y-6">
      {/* Header with Title and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E60012] flex items-center justify-center border border-red-100 shadow-xs">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Control de Inventario & Kardex
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Trazabilidad inmutable de entradas, salidas, ventas, devoluciones y valoración por Promedio Ponderado
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadData()}
            aria-label="Actualizar Kardex"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Recargar datos"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E60012] hover:bg-[#c4000f] text-white font-bold text-xs shadow-md shadow-red-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Movimiento Manual</span>
          </button>
        </div>
      </div>

      {/* Metric Cards / KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Valoración Total Inventario
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2 font-mono">
            {formatCurrency(metrics.totalInventoryValuation)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">
            Basado en costo promedio ponderado
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Entradas (Unidades)
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2 font-mono">
            +{metrics.totalInQty} u.
          </p>
          <span className="text-[11px] text-emerald-600 font-bold">
            Compras, devoluciones y ajustes (+)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Salidas (Unidades)
            </span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2 font-mono">
            -{metrics.totalOutQty} u.
          </p>
          <span className="text-[11px] text-rose-600 font-bold">
            Ventas en pedidos, mermas y uso interno
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Repuestos Stock Bajo (≤2)
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2 font-mono">
            {metrics.lowStockParts}
          </p>
          <span className="text-[11px] text-amber-700 font-medium">
            Requieren reabastecimiento
          </span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <AdminSearchInput
            value={localSearch}
            onChange={setLocalSearch}
            placeholder="Buscar por documento (SZ-ORD), repuesto, SKU, notas u operador..."
          />
        </div>
      </div>

      {/* Part Filter Bar if filtered */}
      {selectedPartId && (
        <div className="flex items-center justify-between bg-blue-50/80 border border-blue-200 px-4 py-2.5 rounded-xl">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-semibold text-blue-900">
              Filtrando historial exclusivo de:{' '}
              <strong>
                {partsList.find((p) => p.id === selectedPartId)?.name || selectedPartId}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedPartId('')}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Mostrar todos los repuestos
          </button>
        </div>
      )}

      {/* DataTable */}
      <DataTable<InventoryMovement>
        data={movements}
        columns={columns}
        keyField="id"
        loading={isLoading}
        searchQuery={localSearch}
        searchFilter={(m, q) => {
          const query = q.toLowerCase();
          return (
            (m.partName || '').toLowerCase().includes(query) ||
            (m.partSku || '').toLowerCase().includes(query) ||
            (m.referenceDocument || '').toLowerCase().includes(query) ||
            (m.notes || '').toLowerCase().includes(query) ||
            (m.userName || '').toLowerCase().includes(query)
          );
        }}
        itemLabel="movimientos"
        emptyMessage="No se encontraron movimientos registrados en el Kardex."
      />

      {/* Modal for Manual Movement */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-[#E60012] flex items-center justify-center font-bold">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Registrar Movimiento de Inventario
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Afecta de forma inmediata el stock y recalcula el Kardex
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitMovement} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Repuesto Search & Autocomplete Selector */}
              <div className="space-y-1.5" ref={partDropdownRef}>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Repuesto a Afectar *
                  </label>
                  {selectedModalPart && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, partId: '', unitCost: 0 }));
                        setModalSearchQuery('');
                        setTimeout(() => searchInputRef.current?.focus(), 50);
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      Cambiar repuesto
                    </button>
                  )}
                </div>

                {selectedModalPart ? (
                  /* Visual Selected Product Card */
                  <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                        {selectedModalPart.image ? (
                          <img
                            src={getImageUrl(selectedModalPart.image, 'parts')}
                            alt={selectedModalPart.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Package className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-black text-slate-900 truncate">
                            {selectedModalPart.name}
                          </h4>
                          {selectedModalPart.category && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[9px] font-bold uppercase font-mono">
                              {selectedModalPart.category}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5 flex-wrap">
                          {getPrimaryOem(selectedModalPart) && (
                            <span className="text-slate-700 font-bold">
                              OEM: {getPrimaryOem(selectedModalPart)}
                            </span>
                          )}
                          {selectedModalPart.sku && selectedModalPart.sku !== getPrimaryOem(selectedModalPart) && (
                            <span>SKU: {selectedModalPart.sku}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                            (selectedModalPart.stock ?? 0) > 5
                              ? 'bg-emerald-100 text-emerald-800'
                              : (selectedModalPart.stock ?? 0) > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            Stock Actual: {selectedModalPart.stock ?? 0} uds
                          </span>
                          {(selectedModalPart.stockReserved ?? 0) > 0 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-100 text-blue-800 font-bold">
                              Reservado: {selectedModalPart.stockReserved}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, partId: '', unitCost: 0 }));
                        setModalSearchQuery('');
                        setTimeout(() => searchInputRef.current?.focus(), 50);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-200 transition-all cursor-pointer shrink-0"
                      title="Quitar selección"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* Autocomplete Search Input + Dropdown */
                  <div className="relative">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={modalSearchQuery}
                        onChange={(e) => {
                          setModalSearchQuery(e.target.value);
                          setIsPartDropdownOpen(true);
                        }}
                        onFocus={() => setIsPartDropdownOpen(true)}
                        placeholder="Buscar por nombre, SKU, referencia OEM o categoría..."
                        className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl pl-9.5 pr-8 py-2.5 focus:bg-white focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012] outline-none transition-all"
                      />
                      {modalSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setModalSearchQuery('');
                            searchInputRef.current?.focus();
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Autocomplete Dropdown List */}
                    {isPartDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200 z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                        {modalFilteredParts.length > 0 ? (
                          modalFilteredParts.map((p) => {
                            const oem = getPrimaryOem(p);
                            const stock = p.stock ?? 0;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  handlePartSelect(p.id);
                                  setIsPartDropdownOpen(false);
                                  setModalSearchQuery('');
                                }}
                                className="w-full p-2.5 text-left hover:bg-slate-50 flex items-center justify-between gap-2.5 transition-colors cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-slate-300">
                                    {p.image ? (
                                      <img
                                        src={getImageUrl(p.image, 'parts')}
                                        alt={p.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <Package className="w-4 h-4 text-slate-400" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-bold text-slate-900 truncate group-hover:text-[#E60012] transition-colors">
                                        {p.name}
                                      </span>
                                      {p.category && (
                                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-mono uppercase font-bold">
                                          {p.category}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                      {oem && <span>OEM: {oem}</span>}
                                      {p.sku && p.sku !== oem && <span>SKU: {p.sku}</span>}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                    stock > 5
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : stock > 0
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-red-100 text-red-800'
                                  }`}>
                                    {stock} uds
                                  </span>
                                  <div className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">
                                    {formatCurrency(p.price || 0)}
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-500 font-medium">
                            <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-1 opacity-80" />
                            No se encontraron repuestos con "{modalSearchQuery}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tipo de Movimiento */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Movimiento *
                </label>
                <select
                  value={formData.movementType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      movementType: e.target.value as InventoryMovementType
                    }))
                  }
                  required
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012] outline-none"
                >
                  <option value="IN_PURCHASE">📥 Entrada por Compra / Recepción de Proveedor</option>
                  <option value="ADJUST_IN">📈 Ajuste Positivo (Sobrante en Conteo Físico)</option>
                  <option value="OUT_DAMAGE">🗑️ Salida por Merma / Daño / Defectuoso</option>
                  <option value="OUT_INTERNAL">🔧 Salida por Uso Interno / Taller Suzuki</option>
                  <option value="ADJUST_OUT">📉 Ajuste Negativo (Faltante en Conteo Físico)</option>
                </select>
              </div>

              {/* Cantidad y Costo Unitario */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cantidad (Unidades) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        quantity: Math.max(1, parseInt(e.target.value) || 1)
                      }))
                    }
                    required
                    className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Costo Unitario ($ COP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.unitCost}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        unitCost: Math.max(0, parseFloat(e.target.value) || 0)
                      }))
                    }
                    className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012] outline-none"
                  />
                </div>
              </div>

              {/* Documento de Referencia */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  N° Factura / Documento / Acta (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. FAC-PROV-9821, ACTA-AUDITORIA-01"
                  value={formData.referenceDocument}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, referenceDocument: e.target.value }))
                  }
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012] outline-none"
                />
              </div>

              {/* Observaciones / Justificación */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones / Justificación *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explica el motivo del movimiento..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012] outline-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#E60012] hover:bg-[#c4000f] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
                >
                  {isSubmitting ? (
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Registrar en Kardex</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
