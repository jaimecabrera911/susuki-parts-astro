import React from 'react';
import { Package, ShieldCheck, Layers } from 'lucide-react';
import { getPrimaryOem } from '../types';
import type { SuzukiPart } from '../types';

interface ProductImageFallbackProps {
  part: SuzukiPart;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export const ProductImageFallback: React.FC<ProductImageFallbackProps> = ({
  part,
  className = '',
  size = 'md'
}) => {
  const primaryOem = getPrimaryOem(part);

  if (size === 'sm') {
    return (
      <div className={`rounded-xl bg-slate-900 text-white border border-slate-800 flex items-center justify-center p-1.5 shrink-0 ${className}`}>
        <div className="text-center">
          <Package className="w-4 h-4 text-[#E60012] mx-auto" />
          <span className="font-mono text-[8px] font-bold text-slate-300 block truncate max-w-[48px]">{primaryOem}</span>
        </div>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className={`rounded-3xl bg-slate-900 text-white border border-slate-800 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden ${className}`}>
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>OEM SPEC</span>
        </div>
        <div className="w-20 h-20 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 shadow-inner">
          <Layers className="w-10 h-10 text-[#E60012]" />
        </div>
        <span className="font-mono font-black text-amber-400 text-sm tracking-wider uppercase bg-slate-800 px-3 py-1 rounded-xl border border-slate-700 mb-1">
          {primaryOem}
        </span>
        <h4 className="font-bold text-slate-200 text-xs max-w-xs">{part.name}</h4>
      </div>
    );
  }

  // Default 'md' or 'full'
  return (
    <div className={`rounded-2xl bg-slate-900 text-white border border-slate-800 p-4 flex flex-col items-center justify-center text-center relative overflow-hidden ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-2 shadow-inner">
        <Package className="w-6 h-6 text-[#E60012]" />
      </div>
      <span className="font-mono font-black text-amber-400 text-[10px] tracking-wider uppercase">
        {primaryOem}
      </span>
    </div>
  );
};
