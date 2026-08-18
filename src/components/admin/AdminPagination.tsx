import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const AdminPagination: React.FC<AdminPaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  itemLabel,
  onPageChange,
  onPageSizeChange,
}) => {
  if (totalItems === 0) return null;

  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return (
    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      {/* Page Size Selector */}
      <div className="flex items-center gap-2 text-slate-500 flex-wrap justify-center">
        <span>Mostrando</span>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-900 focus:outline-none"
          aria-label="Elementos por página"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <span>
          {startIndex + 1}-{endIndex} de {totalItems} {itemLabel}
        </span>
      </div>

      {/* Page Buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={safePage === 1}
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
          .reduce<number[]>((acc, p) => {
            if (acc.length && p - acc[acc.length - 1] > 1) acc.push(-1);
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === -1 ? (
              <span key={`ellipsis-${i}`} className="px-1 font-mono font-bold text-slate-400 select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-[28px] px-2 py-1.5 rounded-lg border font-mono font-bold transition-colors cursor-pointer ${
                  p === safePage
                    ? 'bg-[#E60012] border-[#E60012] text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                aria-label={`Página ${p}`}
                aria-current={p === safePage ? 'page' : undefined}
              >
                {p}
              </button>
            )
          )}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};