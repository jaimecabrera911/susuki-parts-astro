import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, ToggleLeft, ToggleRight, DollarSign, Percent } from 'lucide-react';
import type { Coupon } from '../../types';
import { INITIAL_COUPONS } from '../../data/taxCouponsData';
import { formatCurrency } from '../../utils/formatCurrency';

export const CouponsManager: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('sz_coupons');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_COUPONS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [formData, setFormData] = useState<Omit<Coupon, 'id'>>({
    code: '',
    type: 'percentage',
    value: 10,
    minPurchase: 0,
    active: true,
  });

  useEffect(() => {
    async function loadCoupons() {
      try {
        const res = await fetch('/api/coupons').then(r => r.json()).catch(() => null);
        if (res?.success && Array.isArray(res.data)) {
          setCoupons(res.data);
          localStorage.setItem('sz_coupons', JSON.stringify(res.data));
        }
      } catch (e) {
        console.error('Error cargando cupones:', e);
      }
    }
    loadCoupons();
  }, []);

  const saveToStorageAndApi = async (updated: Coupon[]) => {
    setCoupons(updated);
    localStorage.setItem('sz_coupons', JSON.stringify(updated));
    try {
      await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.error('Error guardando cupones en API:', e);
    }
  };

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minPurchase: coupon.minPurchase || 0,
        active: coupon.active,
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        type: 'percentage',
        value: 10,
        minPurchase: 0,
        active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formData.code.trim().toUpperCase();

    if (editingCoupon) {
      const updated = coupons.map(c => c.id === editingCoupon.id ? { ...editingCoupon, ...formData, code: cleanCode } : c);
      await saveToStorageAndApi(updated);
    } else {
      const newCoupon: Coupon = {
        id: `coup-${Date.now()}`,
        code: cleanCode,
        type: formData.type,
        value: formData.value,
        minPurchase: formData.minPurchase,
        active: formData.active,
        createdAt: new Date().toISOString(),
      };
      await saveToStorageAndApi([newCoupon, ...coupons]);
    }

    setIsModalOpen(false);
  };

  const handleToggleActive = async (id: string) => {
    const updated = coupons.map(c => c.id === id ? { ...c, active: !c.active } : c);
    await saveToStorageAndApi(updated);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cupón de descuento?')) return;
    const updated = coupons.filter(c => c.id !== id);
    await saveToStorageAndApi(updated);
  };

  const filteredCoupons = coupons.filter(c => c.code.toLowerCase().includes(searchQuery.toLowerCase().trim()));

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/20">
            <Tag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 font-display">Gestor de Cupones & Descuentos</h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Crea y administra códigos promocionales aplicables en el checkout.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="px-5 py-3 bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-500/20 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nuevo Cupón</span>
        </button>
      </div>

      {/* Filter & Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cupón (ej. SUZUKI10)..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#E60012]"
            />
          </div>
          <span className="text-xs font-mono text-slate-500">{filteredCoupons.length} cupones registrados</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-mono font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Código de Cupón</th>
                <th className="px-6 py-4">Tipo & Valor</th>
                <th className="px-6 py-4">Compra Mínima</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">
                    No hay cupones de descuento registrados.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-black text-slate-900 text-sm">
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        {coupon.type === 'percentage' ? (
                          <>
                            <Percent className="w-3.5 h-3.5 text-sky-600" />
                            <span>{coupon.value}% de Descuento</span>
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{formatCurrency(coupon.value)} OFF</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {coupon.minPurchase && coupon.minPurchase > 0 ? formatCurrency(coupon.minPurchase) : 'Sin mínimo'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(coupon.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase cursor-pointer border ${
                          coupon.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {coupon.active ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                        <span>{coupon.active ? 'Activo' : 'Inactivo'}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(coupon)}
                          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Editar Cupón"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(coupon.id)}
                          className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar Cupón"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900 font-display mb-4">
              {editingCoupon ? 'Editar Cupón de Descuento' : 'Crear Nuevo Cupón'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
                  Código del Cupón
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono font-black text-slate-900 text-sm tracking-wider uppercase focus:ring-2 focus:ring-[#E60012]"
                  placeholder="Ej. SUZUKI10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
                    Tipo de Descuento
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-3 py-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#E60012]"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo (COP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
                    Valor del Descuento
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-[#E60012]"
                    placeholder={formData.type === 'percentage' ? '10' : '15000'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
                  Compra Mínima (COP)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minPurchase}
                  onChange={(e) => setFormData({ ...formData, minPurchase: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-slate-900 text-sm focus:ring-2 focus:ring-[#E60012]"
                  placeholder="0 para sin mínimo"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-slate-700 uppercase font-mono">Estado del Cupón</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E60012]"></div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-xs rounded-xl uppercase tracking-wider cursor-pointer shadow-md"
                >
                  {editingCoupon ? 'Guardar Cambios' : 'Crear Cupón'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
