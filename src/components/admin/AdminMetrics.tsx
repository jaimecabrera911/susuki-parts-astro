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
    <div id="admin-metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`p-5 rounded-2xl bg-white border ${stat.border} shadow-xs flex items-center justify-between transition-all duration-150 hover:shadow-lg hover:shadow-slate-950/5 hover:-translate-y-0.5`}
          >
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                {stat.title}
              </p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                  {stat.value}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium font-sans">
                {stat.subtext}
              </p>
            </div>
            <div className={`w-11 h-11 rounded-xl ${stat.badgeBg} flex items-center justify-center border shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
