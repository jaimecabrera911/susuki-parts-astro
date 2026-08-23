import React, { useMemo, useState, useEffect, useRef } from 'react';
import RDTable, {
  createTheme,
  type TableColumn,
  type TableStyles,
  type PaginationOptions,
} from 'react-data-table-component';
import 'react-data-table-component/css';
import { ListFilter, Check, X, Inbox, SlidersHorizontal, ArrowUpDown, Minus, Calendar, Search } from 'lucide-react';
import { formatThousands } from '../../utils/formatCurrency';

createTheme(
  'suzuki',
  {
    primary: '#E60012',
    text: { primary: '#0f172a', secondary: '#64748b', disabled: '#cbd5e1' },
    background: { default: '#ffffff', header: '#f8fafc', footer: '#f8fafc' },
    divider: { default: '#e2e8f0' },
    highlightOnHover: { default: '#f8fafc', text: '#0f172a' },
    striped: { default: '#fafafa', text: '#0f172a' },
    selected: { default: '#fee2e2', text: '#0f172a' },
    context: { background: '#E60012', text: '#ffffff' },
    button: { default: '#94a3b8', focus: 'rgba(230,0,18,0.2)', hover: 'rgba(230,0,18,0.08)', disabled: '#e2e8f0' },
    spacing: { rowHeight: '56px', headerHeight: '48px', cellPaddingX: '16px', iconSize: '16px' },
    typography: { fontSize: '13px', fontSizeHeader: '10px' },
    shape: { borderRadius: '12px' },
  },
  'default',
);

const tableStyles: TableStyles = {
  headRow: {
    style: {
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      borderTop: 'none',
    },
  },
  headCells: {
    style: {
      paddingLeft: '20px',
      paddingRight: '12px',
      color: '#475569',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 700,
      fontSize: '0.6875rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
  },
  cells: {
    style: { paddingLeft: '20px', paddingRight: '12px' },
  },
  rows: {
    style: { minHeight: '56px' },
    highlightOnHoverStyle: { backgroundColor: '#f8fafc', color: '#0f172a' },
  },
  pagination: {
    style: {
      color: '#475569',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 700,
      fontSize: '0.6875rem',
      backgroundColor: '#f8fafc',
      borderTop: '1px solid #e2e8f0',
      minHeight: '48px',
    },
    pageButtonsStyle: {
      color: '#475569',
      fill: '#475569',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 700,
      borderRadius: '8px',
      cursor: 'pointer',
    },
  },
  noData: { style: { color: '#64748b', fontSize: '13px' } },
  progress: { style: { color: '#64748b' } },
};

const paginationOptions: PaginationOptions = {
  rowsPerPageText: 'Filas por página',
  rangeSeparatorText: 'de',
  selectAllRowsItem: false,
};

const paginationLocalization = {
  pagination: {
    navigationAriaLabel: 'Navegación de páginas',
    firstPageAriaLabel: 'Primera página',
    previousPageAriaLabel: 'Página anterior',
    nextPageAriaLabel: 'Página siguiente',
    lastPageAriaLabel: 'Última página',
  },
};

export interface DataTableRangeField<T> {
  label: string;
  value: (row: T) => number;
}

export interface DateRangeBounds {
  start?: string; // YYYY-MM-DD
  end?: string;   // YYYY-MM-DD
}

export interface DataTableColumn<T> {
  key: string;
  label: React.ReactNode;
  filterable?: boolean;
  accessor?: (row: T) => string;
  filterLabel?: (value: string) => string;
  filterOptions?: { value: string; label: string }[];
  filterMatcher?: (row: T, value: string) => boolean;
  ranges?: DataTableRangeField<T>[];
  dateRange?: boolean;
  dateAccessor?: (row: T) => string | number | Date | null | undefined;
  sortable?: boolean;
  sortSelector?: (row: T) => string | number;
  align?: 'left' | 'center' | 'right';
  width?: string;
  minWidth?: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableMenuOption {
  value: string;
  label: string;
  count: number;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  keyField: keyof T & string;
  loading?: boolean;
  itemLabel?: string;
  emptyMessage?: string;
  emptySubMessage?: string;
  searchQuery?: string;
  searchFilter?: (row: T, query: string) => boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  actions?: (row: T) => React.ReactNode;
  actionsMinWidth?: string;
  actionsWidth?: string;
  actionsAlign?: 'left' | 'center' | 'right';
}

const ALL_VALUE = 'all';

interface RangeBounds {
  min?: number;
  max?: number;
}

interface RangeDraft {
  min: string;
  max: string;
}

const toMatch = <T,>(row: T, col: DataTableColumn<T>, value: string): boolean => {
  if (col.filterMatcher) return col.filterMatcher(row, value);
  if (col.accessor) return col.accessor(row) === value;
  return false;
};

export function DataTable<T>({
  data,
  columns,
  keyField,
  loading = false,
  itemLabel = 'registros',
  emptyMessage = 'No se encontraron registros',
  emptySubMessage = 'Intenta cambiando los términos de búsqueda o filtros.',
  searchQuery,
  searchFilter,
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  actions,
  actionsMinWidth,
  actionsWidth,
  actionsAlign = 'left',
}: DataTableProps<T>) {
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [filterSearchQuery, setFilterSearchQuery] = useState('');
  const [rangeFilters, setRangeFilters] = useState<Record<string, RangeBounds[]>>({});
  const [rangeDrafts, setRangeDrafts] = useState<Record<string, RangeDraft[]>>({});
  const [dateFilters, setDateFilters] = useState<Record<string, DateRangeBounds>>({});
  const [dateDrafts, setDateDrafts] = useState<Record<string, DateRangeBounds>>({});
  const [openCol, setOpenCol] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const hasActiveColumnFilter = (col: DataTableColumn<T>): boolean => {
    const selected = columnFilters[col.key];
    return Boolean(selected && selected.length > 0 && !selected.includes(ALL_VALUE));
  };

  const hasActiveRange = (col: DataTableColumn<T>): boolean =>
    (rangeFilters[col.key] ?? []).some((b) => b.min !== undefined || b.max !== undefined);

  const hasActiveDateRange = (col: DataTableColumn<T>): boolean =>
    Boolean(dateFilters[col.key]?.start || dateFilters[col.key]?.end);

  const activeFilterCount = useMemo(
    () =>
      columns.filter((c) => {
        return hasActiveColumnFilter(c) || hasActiveRange(c) || hasActiveDateRange(c);
      }).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns, columnFilters, rangeFilters, dateFilters],
  );

  // Apply global search + per-column filters + numeric ranges + date ranges
  const filteredData = useMemo(() => {
    const query = (searchQuery ?? '').trim().toLowerCase();
    return data.filter((row) => {
      if (query && searchFilter && !searchFilter(row, query)) return false;
      for (const col of columns) {
        if (col.dateRange) {
          const dRange = dateFilters[col.key];
          if (dRange && (dRange.start || dRange.end)) {
            const rawVal = col.dateAccessor ? col.dateAccessor(row) : (row as any)[col.key];
            if (!rawVal) return false;
            const rowTime = new Date(rawVal).getTime();
            if (isNaN(rowTime)) return false;

            if (dRange.start) {
              const startTime = new Date(`${dRange.start}T00:00:00`).getTime();
              if (!isNaN(startTime) && rowTime < startTime) return false;
            }
            if (dRange.end) {
              const endTime = new Date(`${dRange.end}T23:59:59.999`).getTime();
              if (!isNaN(endTime) && rowTime > endTime) return false;
            }
          }
        }

        const boundsList = rangeFilters[col.key];
        if (boundsList && col.ranges) {
          for (let i = 0; i < col.ranges.length; i++) {
            const bounds = boundsList[i];
            if (!bounds || (bounds.min === undefined && bounds.max === undefined)) continue;
            const v = col.ranges[i].value(row);
            if (bounds.min !== undefined && v < bounds.min) return false;
            if (bounds.max !== undefined && v > bounds.max) return false;
          }
        }
        const selectedVals = columnFilters[col.key];
        if (selectedVals && selectedVals.length > 0 && !selectedVals.includes(ALL_VALUE)) {
          const matchesAny = selectedVals.some((v) => toMatch(row, col, v));
          if (!matchesAny) return false;
        }
      }
      return true;
    });
  }, [data, columns, columnFilters, rangeFilters, dateFilters, searchQuery, searchFilter]);

  // Dynamic filter options derived from live data (unique values + counts)
  const columnOptions = useMemo(() => {
    const map: Record<string, DataTableMenuOption[]> = {};
    for (const col of columns) {
      if (!col.filterable) continue;
      if (col.ranges && col.ranges.length > 0) continue;
      if (col.filterOptions) {
        map[col.key] = col.filterOptions.map((o) => ({
          value: o.value,
          label: o.label,
          count: data.filter((r) => toMatch(r, col, o.value)).length,
        }));
      } else {
        const counts = new Map<string, number>();
        for (const row of data) {
          const v = col.accessor?.(row);
          if (v === undefined || v === null || v === '') continue;
          counts.set(v, (counts.get(v) ?? 0) + 1);
        }
        map[col.key] = Array.from(counts.entries())
          .sort((a, b) => a[0].localeCompare(b[0], 'es'))
          .map(([value, count]) => ({
            value,
            label: col.filterLabel ? col.filterLabel(value) : value,
            count,
          }));
      }
    }
    return map;
  }, [data, columns]);

  const getMenuOptions = (col: DataTableColumn<T>): DataTableMenuOption[] => {
    const base = columnOptions[col.key] ?? [];
    return [{ value: ALL_VALUE, label: 'Todos', count: data.length }, ...base];
  };

  const getSelectedLabel = (col: DataTableColumn<T>): string => {
    const selected = columnFilters[col.key] || [];
    if (selected.length === 0 || selected.includes(ALL_VALUE)) return 'Todos';
    const options = getMenuOptions(col);
    if (selected.length === 1) {
      const found = options.find((o) => o.value === selected[0]);
      return found ? found.label : selected[0];
    }
    const firstOpt = options.find((o) => o.value === selected[0]);
    const firstLabel = firstOpt ? firstOpt.label : selected[0];
    return `${firstLabel} (+${selected.length - 1})`;
  };

  const openFilterMenu = (e: React.MouseEvent<HTMLButtonElement>, colKey: string) => {
    if (openCol === colKey) {
      setOpenCol(null);
      setMenuPos(null);
      return;
    }
    setFilterSearchQuery('');
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 320;
    const menuWidth = 280;
    const top = rect.bottom + 4 + menuHeight > window.innerHeight
      ? Math.max(8, rect.top - menuHeight)
      : rect.bottom + 4;
    setMenuPos({ top, left: Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth)) });
    setOpenCol(colKey);
  };

  const toggleFilterOption = (colKey: string, value: string) => {
    if (value === ALL_VALUE) {
      setColumnFilters((prev) => {
        const next = { ...prev };
        delete next[colKey];
        return next;
      });
      return;
    }

    setColumnFilters((prev) => {
      const current = (prev[colKey] || []).filter((v) => v !== ALL_VALUE);
      let next: string[];
      if (current.includes(value)) {
        next = current.filter((v) => v !== value);
      } else {
        next = [...current, value];
      }
      if (next.length === 0) {
        const copy = { ...prev };
        delete copy[colKey];
        return copy;
      }
      return { ...prev, [colKey]: next };
    });
  };

  const selectAllVisible = (colKey: string, visibleValues: string[]) => {
    const cleanVals = visibleValues.filter((v) => v !== ALL_VALUE);
    setColumnFilters((prev) => {
      const current = (prev[colKey] || []).filter((v) => v !== ALL_VALUE);
      const set = new Set([...current, ...cleanVals]);
      return { ...prev, [colKey]: Array.from(set) };
    });
  };

  const clearColumnFilter = (colKey: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      delete next[colKey];
      return next;
    });
  };

  const setRangeDraft = (colKey: string, index: number, field: 'min' | 'max', raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 12);
    setRangeDrafts((prev) => {
      const list = prev[colKey] ?? [];
      const next = [...list];
      next[index] = { ...(next[index] ?? { min: '', max: '' }), [field]: digits };
      return { ...prev, [colKey]: next };
    });
  };

  const commitRange = (colKey: string, index: number, field: 'min' | 'max') => {
    const col = columns.find((c) => c.key === colKey);
    const ranges = col?.ranges;
    if (!ranges) return;
    const draft = rangeDrafts[colKey]?.[index];
    const raw = draft?.[field] ?? '';
    const parsed = raw === '' ? undefined : parseInt(raw, 10);
    if (raw !== '' && Number.isNaN(parsed)) return;
    setRangeFilters((prev) => {
      const list = prev[colKey] ?? ranges.map(() => ({}));
      const next = [...list];
      next[index] = { ...(next[index] ?? {}), [field]: parsed };
      return { ...prev, [colKey]: next };
    });
  };

  const clearRangeField = (colKey: string, index: number) => {
    setRangeFilters((prev) => {
      const list = prev[colKey] ?? [];
      const next = [...list];
      next[index] = {};
      return { ...prev, [colKey]: next };
    });
    setRangeDrafts((prev) => {
      const list = prev[colKey] ?? [];
      const next = [...list];
      next[index] = { min: '', max: '' };
      return { ...prev, [colKey]: next };
    });
  };

  const setDateDraft = (colKey: string, field: 'start' | 'end', val: string) => {
    setDateDrafts((prev) => ({
      ...prev,
      [colKey]: { ...(prev[colKey] ?? {}), [field]: val }
    }));
  };

  const applyDateRange = (colKey: string, customRange?: DateRangeBounds) => {
    const range = customRange || dateDrafts[colKey] || {};
    setDateFilters((prev) => ({ ...prev, [colKey]: range }));
    if (customRange) {
      setDateDrafts((prev) => ({ ...prev, [colKey]: customRange }));
    }
    setOpenCol(null);
    setMenuPos(null);
  };

  const clearDateRange = (colKey: string) => {
    setDateFilters((prev) => {
      const next = { ...prev };
      delete next[colKey];
      return next;
    });
    setDateDrafts((prev) => {
      const next = { ...prev };
      delete next[colKey];
      return next;
    });
  };

  const applyDatePreset = (colKey: string, preset: 'today' | '7days' | 'thisMonth' | '30days') => {
    const now = new Date();
    const toDateStr = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    let start = '';
    const end = toDateStr(now);

    if (preset === 'today') {
      start = end;
    } else if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = toDateStr(d);
    } else if (preset === 'thisMonth') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      start = toDateStr(d);
    } else if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      start = toDateStr(d);
    }

    applyDateRange(colKey, { start, end });
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setRangeFilters({});
    setRangeDrafts({});
    setDateFilters({});
    setDateDrafts({});
    setOpenCol(null);
    setMenuPos(null);
  };

  // Close dropdown on outside click / Escape
  useEffect(() => {
    if (!openCol) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (triggerRef.current && triggerRef.current.contains(target)) return;
      if (menuRef.current && menuRef.current.contains(target)) return;
      setOpenCol(null);
      setMenuPos(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenCol(null);
        setMenuPos(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openCol]);

  const rdtColumns: TableColumn<T>[] = useMemo(() => {
    const cols: TableColumn<T>[] = columns.map((col) => ({
      id: col.key,
      name: (
        <span className="inline-flex items-center gap-1.5">
          <span>{col.label}</span>
          {col.filterable && (
            <button
              ref={openCol === col.key ? triggerRef : undefined}
              type="button"
              aria-label={`Filtrar por ${typeof col.label === 'string' ? col.label : col.key}`}
              aria-haspopup="menu"
              aria-expanded={openCol === col.key}
              onClick={(e) => openFilterMenu(e, col.key)}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                hasActiveColumnFilter(col) || hasActiveRange(col) || hasActiveDateRange(col)
                  ? 'text-[#E60012] bg-red-50'
                  : 'text-slate-400 hover:text-[#E60012] hover:bg-slate-100'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
            </button>
          )}
        </span>
      ),
      sortable: col.sortable ?? false,
      selector: (col.sortable ? col.sortSelector ?? col.accessor : undefined) as
        | ((row: T) => string | number)
        | undefined,
      cell: col.render ? (row: T) => col.render!(row) : undefined,
      right: col.align === 'right',
      center: col.align === 'center',
      ...(col.width ? { width: col.width } : {}),
      ...(col.minWidth ? { minWidth: col.minWidth } : {}),
    }));
    if (actions) {
      cols.push({
        id: '__actions__',
        name: 'Acciones',
        minWidth: actionsMinWidth || '140px',
        right: actionsAlign === 'right',
        center: actionsAlign === 'center',
        cell: (row: T) => (
          <div className={`flex items-center gap-1 ${
            actionsAlign === 'right' ? 'justify-end' : actionsAlign === 'center' ? 'justify-center' : 'justify-start'
          }`}>{actions(row)}</div>
        ),
        ...(actionsWidth ? { width: actionsWidth } : {}),
      });
    }
    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, actions, openCol, columnFilters, rangeFilters, dateFilters, actionsMinWidth, actionsWidth, actionsAlign]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-xs">
      {/* Active column filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-red-50/70 border-b border-slate-200">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 font-mono">
            Filtros activos:
          </span>
          {columns
            .filter((c) => hasActiveColumnFilter(c))
            .map((c) => (
              <span
                key={c.key}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-red-200 text-red-900 font-bold text-[11px] rounded-lg shadow-xs"
              >
                <ListFilter className="w-3 h-3 text-[#E60012]" />
                <span>{typeof c.label === 'string' ? c.label : c.key}</span>
                <span className="text-slate-400">:</span>
                <span>{getSelectedLabel(c)}</span>
                <button
                  type="button"
                  aria-label={`Quitar filtro de ${typeof c.label === 'string' ? c.label : c.key}`}
                  onClick={() => clearColumnFilter(c.key)}
                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          {columns
            .filter((c) => c.dateRange && hasActiveDateRange(c))
            .map((c) => {
              const dRange = dateFilters[c.key];
              const startFmt = dRange?.start ? dRange.start.split('-').reverse().join('/') : '';
              const endFmt = dRange?.end ? dRange.end.split('-').reverse().join('/') : '';
              const text = startFmt && endFmt ? `${startFmt} - ${endFmt}` : startFmt ? `Desde ${startFmt}` : `Hasta ${endFmt}`;
              return (
                <span
                  key={`date-chip-${c.key}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-red-200 text-red-900 font-bold text-[11px] rounded-lg shadow-xs"
                >
                  <Calendar className="w-3 h-3 text-[#E60012]" />
                  <span>{typeof c.label === 'string' ? c.label : c.key}</span>
                  <span className="text-slate-400">:</span>
                  <span>{text}</span>
                  <button
                    type="button"
                    aria-label={`Quitar rango de fecha de ${typeof c.label === 'string' ? c.label : c.key}`}
                    onClick={() => clearDateRange(c.key)}
                    className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          {columns
            .filter((c) => c.ranges && hasActiveRange(c))
            .flatMap((c) =>
              (c.ranges ?? []).map((field, i) => {
                const bounds = rangeFilters[c.key]?.[i];
                if (!bounds || (bounds.min === undefined && bounds.max === undefined)) return null;
                const parts: string[] = [];
                if (bounds.min !== undefined) parts.push(`Mín ${formatThousands(bounds.min)}`);
                if (bounds.max !== undefined) parts.push(`Máx ${formatThousands(bounds.max)}`);
                return (
                  <span
                    key={`${c.key}-${i}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-red-200 text-red-900 font-bold text-[11px] rounded-lg shadow-xs"
                  >
                    <Minus className="w-3 h-3 text-[#E60012]" />
                    <span>{typeof c.label === 'string' ? c.label : c.key}</span>
                    <span className="text-slate-400">:</span>
                    <span>{parts.join(' · ')}</span>
                    <button
                      type="button"
                      aria-label={`Quitar rango de ${field.label}`}
                      onClick={() => clearRangeField(c.key, i)}
                      className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              }),
            )}
          <button
            type="button"
            onClick={clearAllFilters}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-[#E60012] hover:underline cursor-pointer"
          >
            <SlidersHorizontal className="w-3 h-3" />
            Limpiar todo
          </button>
        </div>
      )}

      <RDTable<T>
        columns={rdtColumns}
        data={filteredData}
        keyField={keyField}
        theme="suzuki"
        customStyles={tableStyles}
        sortIcon={<ArrowUpDown className="w-3.5 h-3.5" />}
        pagination
        paginationRowsPerPageOptions={pageSizeOptions}
        paginationPerPage={defaultPageSize}
        paginationComponentOptions={paginationOptions}
        localization={paginationLocalization}
        highlightOnHover
        persistTableHead
        responsive
        progressPending={loading}
        progressComponent={
          <div className="py-10 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-[#E60012] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono font-bold text-slate-600 animate-pulse">
              Cargando {itemLabel}...
            </p>
          </div>
        }
        noDataComponent={
          <div className="py-10 text-center">
            <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-800 text-sm">{emptyMessage}</p>
            <p className="text-xs text-slate-400 mt-0.5">{emptySubMessage}</p>
          </div>
        }
      />

      {/* Column filter dropdown (fixed position, avoids table overflow clipping) */}
      {openCol && menuPos && (
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-[100] bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/15 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
          style={{ top: menuPos.top, left: menuPos.left, minWidth: 260, maxWidth: 320, maxHeight: 380 }}
        >
          {(() => {
            const col = columns.find((c) => c.key === openCol);
            if (!col) return null;

            if (col.dateRange) {
              const draft = dateDrafts[openCol] ?? dateFilters[openCol] ?? { start: '', end: '' };
              const hasActive = hasActiveDateRange(col);
              return (
                <div className="p-3 space-y-3 min-w-[240px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#E60012]" />
                      Rango de Fechas
                    </span>
                    {hasActive && (
                      <button
                        type="button"
                        onClick={() => clearDateRange(openCol)}
                        className="text-[10px] font-bold text-[#E60012] hover:underline cursor-pointer"
                      >
                        Quitar
                      </button>
                    )}
                  </div>

                  {/* Preset Shortcuts */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyDatePreset(openCol, 'today')}
                      className="px-2 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-[#E60012] rounded-lg transition-colors cursor-pointer"
                    >
                      Hoy
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset(openCol, '7days')}
                      className="px-2 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-[#E60012] rounded-lg transition-colors cursor-pointer"
                    >
                      Últimos 7 días
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset(openCol, 'thisMonth')}
                      className="px-2 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-[#E60012] rounded-lg transition-colors cursor-pointer"
                    >
                      Este mes
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset(openCol, '30days')}
                      className="px-2 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-[#E60012] rounded-lg transition-colors cursor-pointer"
                    >
                      Últimos 30 días
                    </button>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Desde:
                      </label>
                      <input
                        type="date"
                        value={draft.start || ''}
                        onChange={(e) => setDateDraft(openCol, 'start', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-mono font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E60012]/30 focus:border-[#E60012] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Hasta:
                      </label>
                      <input
                        type="date"
                        value={draft.end || ''}
                        onChange={(e) => setDateDraft(openCol, 'end', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-mono font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E60012]/30 focus:border-[#E60012] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => applyDateRange(openCol)}
                      className="flex-1 px-3 py-1.5 text-xs font-bold text-white bg-[#E60012] hover:bg-[#b5000b] rounded-lg transition-colors shadow-xs cursor-pointer text-center"
                    >
                      Aplicar Rango
                    </button>
                    {hasActive && (
                      <button
                        type="button"
                        onClick={() => clearDateRange(openCol)}
                        className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            if (col.ranges && col.ranges.length > 0) {
              const drafts = rangeDrafts[openCol] ?? [];
              return (
                <div className="px-3 py-2.5 space-y-3 min-w-[240px]">
                  {col.ranges.map((field, i) => {
                    const draft = drafts[i] ?? { min: '', max: '' };
                    const bounds = rangeFilters[openCol]?.[i];
                    const renderInput = (which: 'min' | 'max') => (
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={12}
                        placeholder={which === 'min' ? 'Mínimo' : 'Máximo'}
                        value={draft[which]}
                        onChange={(e) => setRangeDraft(openCol, i, which, e.target.value)}
                        onBlur={() => commitRange(openCol, i, which)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            commitRange(openCol, i, which);
                            e.currentTarget.blur();
                          }
                        }}
                        className="w-full min-w-0 px-2 py-1.5 text-xs font-mono font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E60012]/30 focus:border-[#E60012] outline-none placeholder:font-sans placeholder:font-normal placeholder:text-slate-400"
                      />
                    );
                    return (
                      <div key={`${col.key}-${field.label}`}>
                        <span className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 font-bold" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.05em' }}>
                            {field.label}
                          </span>
                          {(bounds?.min !== undefined || bounds?.max !== undefined) && (
                            <button
                              type="button"
                              onClick={() => clearRangeField(openCol, i)}
                              className="text-[10px] font-bold text-[#E60012] hover:underline cursor-pointer"
                            >
                              Quitar
                            </button>
                          )}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1">{renderInput('min')}</div>
                          <Minus className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <div className="flex-1">{renderInput('max')}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // Multi-select discrete list with Search Input
            const allOptions = getMenuOptions(col);
            const q = filterSearchQuery.toLowerCase().trim();
            const filteredOptions = q.length > 0
              ? allOptions.filter(
                  (opt) =>
                    opt.value === ALL_VALUE ||
                    opt.label.toLowerCase().includes(q) ||
                    opt.value.toLowerCase().includes(q)
                )
              : allOptions;

            const selectedValues = columnFilters[openCol] || [];
            const isAllSelected = selectedValues.length === 0 || selectedValues.includes(ALL_VALUE);

            return (
              <div className="flex flex-col max-h-[380px]">
                {/* Search Bar in Dropdown */}
                <div className="p-2.5 bg-slate-50/80 border-b border-slate-200/80 space-y-2 shrink-0">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={filterSearchQuery}
                      onChange={(e) => setFilterSearchQuery(e.target.value)}
                      placeholder="Buscar opción..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012] transition-all font-medium"
                      autoFocus
                    />
                    {filterSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setFilterSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold px-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        selectAllVisible(
                          openCol,
                          filteredOptions.map((o) => o.value)
                        )
                      }
                      className="text-[#E60012] hover:underline cursor-pointer"
                    >
                      Seleccionar visibles
                    </button>
                    {hasActiveColumnFilter(col) && (
                      <button
                        type="button"
                        onClick={() => clearColumnFilter(openCol)}
                        className="text-slate-500 hover:text-red-600 hover:underline cursor-pointer"
                      >
                        Limpiar ({selectedValues.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Options List */}
                <div className="overflow-y-auto py-1 divide-y divide-slate-50 custom-scrollbar flex-1 max-h-[220px]">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((opt) => {
                      const isAll = opt.value === ALL_VALUE;
                      const isChecked = isAll
                        ? isAllSelected
                        : selectedValues.includes(opt.value);

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="menuitem"
                          onClick={() => toggleFilterOption(openCol, opt.value)}
                          className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 text-left text-xs transition-colors cursor-pointer group ${
                            isChecked
                              ? 'bg-red-50/50 text-slate-900 font-bold'
                              : 'text-slate-700 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center transition-all shrink-0 ${
                                isChecked
                                  ? 'bg-[#E60012] text-white shadow-2xs'
                                  : 'border border-slate-300 bg-white group-hover:border-slate-400'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="truncate" title={opt.label}>
                              {opt.label}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
                            {opt.count}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 font-medium">
                      No se encontraron opciones para "{filterSearchQuery}"
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2 shrink-0">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {selectedValues.length === 0 || isAllSelected
                      ? 'Mostrando todos'
                      : `${selectedValues.length} seleccionados`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenCol(null);
                      setMenuPos(null);
                    }}
                    className="px-3 py-1 bg-[#E60012] hover:bg-[#c4000f] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
                  >
                    Listo
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}