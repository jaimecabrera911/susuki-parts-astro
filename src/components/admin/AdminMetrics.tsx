import React from 'react';
import { Building2, CheckCircle2, XCircle, Tag, Layers } from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import type { Brand, SuzukiModel } from '../../types';

interface AdminMetricsProps {
  brands: Brand[];
  models: SuzukiModel[];
}

export const AdminMetrics: React.FC<AdminMetricsProps> = ({ brands, models }) => {
  const activeBrands = brands.filter(b => b.active).length;
  const activeModels = models.filter(m => m.active !== false).length;
  const categories = Array.from(new Set(models.map(m => m.category))).length;
  const totalYearEntries = models.reduce((acc, m) => acc + (m.years?.length || 0), 0);

  const stats = [
    {
      title: 'TOTAL MARCAS',
      value: brands.length,
      subtext: `${activeBrands} activas en sistema`,
      icon: Building2,
      border: 'border-slate-200',
      badgeBg: 'bg-blue-50 text-[#0A3088] border-blue-200'
    },
    {
      title: 'MODELOS DE MOTO',
      value: models.length,
      subtext: `${activeModels} modelos verificados`,
      icon: FaMotorcycle,
      border: 'border-slate-200',
      badgeBg: 'bg-emerald-50 text-[#059669] border-emerald-200'
    },
    {
      title: 'CATEGORÍAS DE MOTO',
      value: categories,
      subtext: 'Naked, Sport, Adventure...',
      icon: Tag,
      border: 'border-slate-200',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    {
      title: 'AÑOS & VARIANTES',
      value: totalYearEntries,
      subtext: 'Compatibilidades registradas',
      icon: Layers,
      border: 'border-slate-200',
      badgeBg: 'bg-amber-50 text-[#d97706] border-amber-200'
    }
  ];

  return (
    <div id="admin-metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6 lg:mb-8">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`p-3 sm:p-4 lg:p-5 rounded-2xl bg-white border ${stat.border} shadow-xs flex items-center justify-between gap-2 transition-all duration-150 hover:shadow-lg hover:shadow-slate-950/5 hover:-translate-y-0.5`}
          >
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono leading-tight">
                {stat.title}
              </p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight font-mono leading-none">
                  {stat.value}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1 font-medium font-sans leading-tight">
                {stat.subtext}
              </p>
            </div>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-lg lg:rounded-xl ${stat.badgeBg} flex items-center justify-center border shrink-0`}>
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
