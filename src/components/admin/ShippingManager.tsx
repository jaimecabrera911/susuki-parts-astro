import React, { useState, useEffect } from 'react';
import { 
  Truck, Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, 
  Clock, DollarSign, Calendar, RefreshCw, Building2, ShieldCheck, MapPin 
} from 'lucide-react';
import type { ShippingMethod, ShippingZone } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';
import { ShippingModal } from './ShippingModal';
import { ZoneModal } from './ZoneModal';
import { 
  fetchShippingMethods, saveShippingMethodApi, deleteShippingMethodApi,
  fetchShippingZones, saveShippingZoneApi, deleteShippingZoneApi
} from '../../services/api';


const CARRIER_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  'Servientrega': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Inter Rapidísimo': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'Coordinadora': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Envía': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'TCC': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Retiro en tienda': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' }
};

const DAY_NAMES: Record<string, string> = {
  '1': 'LUN', '2': 'MAR', '3': 'MIÉ', '4': 'JUE', '5': 'VIE', '6': 'SÁB', '7': 'DOM'
};

export const ShippingManager: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'methods' | 'zones'>('methods');
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Shipping Method Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Zone Modal state
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [deleteZoneConfirmId, setDeleteZoneConfirmId] = useState<string | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [methodsData, zonesData] = await Promise.all([
        fetchShippingMethods(),
        fetchShippingZones()
      ]);
      setMethods(methodsData || []);
      setZones(zonesData);
    } catch (err: any) {
      console.error('Error cargando datos de envío:', err);
      showNotification('error', 'Error conectando con la base de datos Neon');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Shipping Method Handlers
  const handleOpenAddModal = () => {
    setEditingMethod(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (method: ShippingMethod) => {
    setEditingMethod(method);
    setIsModalOpen(true);
  };

  const handleSaveMethod = async (methodData: Partial<ShippingMethod>) => {
    try {
      const isEdit = Boolean(methodData.id);
      const res = await saveShippingMethodApi(methodData, isEdit);
      if (res.success) {
        showNotification('success', isEdit ? 'Método de envío actualizado' : 'Nuevo método de envío creado');
        await loadData();
      } else {
        showNotification('error', res.error || 'No se pudo guardar el método');
      }
    } catch (err: any) {
      showNotification('error', 'Error en el servidor guardando método');
    }
  };

  const handleToggleActive = async (method: ShippingMethod) => {
    try {
      const updated = { ...method, active: !method.active };
      const res = await saveShippingMethodApi(updated, true);
      if (res.success) {
        setMethods(prev => prev.map(m => m.id === method.id ? { ...m, active: !m.active } : m));
        showNotification('success', `Método ${updated.active ? 'activado' : 'desactivado'}`);
      }
    } catch (err) {
      showNotification('error', 'Error actualizando estado');
    }
  };

  const handleDeleteMethod = async (id: string) => {
    try {
      const res = await deleteShippingMethodApi(id);
      if (res.success) {
        setMethods(prev => prev.filter(m => m.id !== id));
        showNotification('success', 'Método de envío eliminado');
      } else {
        showNotification('error', res.error || 'No se pudo eliminar');
      }
    } catch (err) {
      showNotification('error', 'Error eliminando el método');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Shipping Zone Handlers
  const handleOpenAddZoneModal = () => {
    setEditingZone(null);
    setIsZoneModalOpen(true);
  };

  const handleOpenEditZoneModal = (zone: ShippingZone) => {
    setEditingZone(zone);
    setIsZoneModalOpen(true);
  };

  const handleSaveZone = async (zoneData: Partial<ShippingZone>) => {
    try {
      const isEdit = Boolean(zoneData.id);
      const res = await saveShippingZoneApi(zoneData, isEdit);
      if (res.success) {
        showNotification('success', isEdit ? 'Zona de envío actualizada' : 'Nueva zona de envío creada');
        await loadData();
      } else {
        showNotification('error', res.error || 'No se pudo guardar la zona');
      }
    } catch (err) {
      showNotification('error', 'Error guardando zona de envío');
    }
  };

  const handleDeleteZone = async (id: string) => {
    try {
      const res = await deleteShippingZoneApi(id);
      if (res.success) {
        setZones(prev => prev.filter(z => z.id !== id));
        showNotification('success', 'Zona de envío eliminada');
      } else {
        showNotification('error', res.error || 'No se pudo eliminar la zona');
      }
    } catch (err) {
      showNotification('error', 'Error eliminando la zona');
    } finally {
      setDeleteZoneConfirmId(null);
    }
  };

  const filteredMethods = methods.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.carrier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-[#E60012] rounded-2xl border border-red-100 flex items-center justify-center shrink-0 shadow-xs">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-100 text-[#E60012] border border-red-200">
                SUZUKI LOGISTICS
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1 font-display">
              Gestión de Métodos & Zonas de Envío OEM
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Recargar datos de la BD"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {activeSubTab === 'methods' ? (
            <button
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#E60012] hover:bg-[#b5000b] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Opción de Envío</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddZoneModal}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#E60012] hover:bg-[#b5000b] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Zona de Envío</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tab Navigation Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveSubTab('methods')}
          className={`px-4 py-2 text-xs font-bold font-display rounded-xl transition-all flex items-center gap-2 ${
            activeSubTab === 'methods'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Métodos de Envío ({methods.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('zones')}
          className={`px-4 py-2 text-xs font-bold font-display rounded-xl transition-all flex items-center gap-2 ${
            activeSubTab === 'zones'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Zonas Tarifarias ({zones.length})</span>
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs font-bold border flex items-center justify-between transition-all ${
          notification.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-current opacity-70 hover:opacity-100 font-bold">✕</button>
        </div>
      )}

      {/* SUB-TAB 1: SHIPPING METHODS */}
      {activeSubTab === 'methods' && (
        <>
          {/* Controls Bar: Search & Stats */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por método o transportadora..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012] font-medium"
              />
            </div>

            <div className="flex items-center gap-3 text-xs font-mono font-bold text-slate-500">
              <span>REGISTROS EN BD: <strong className="text-slate-900">{methods.length}</strong></span>
              <span>•</span>
              <span>ACTIVOS: <strong className="text-[#059669]">{methods.filter(m => m.active).length}</strong></span>
            </div>
          </div>

          {/* Grid of Shipping Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-52 bg-white border border-slate-200 rounded-2xl p-5 animate-pulse" />
              ))}
            </div>
          ) : filteredMethods.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-black text-slate-900">No se encontraron métodos de envío</h3>
              <p className="text-xs text-slate-500 mt-1">Intenta con otro término de búsqueda o crea una nueva opción.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMethods.map(method => {
                const badgeStyle = CARRIER_BADGES[method.carrier] || {
                  bg: 'bg-slate-100',
                  text: 'text-slate-700',
                  border: 'border-slate-200'
                };

                return (
                  <div 
                    key={method.id} 
                    className={`bg-white rounded-2xl border transition-all duration-200 p-5 shadow-xs hover:shadow-lg hover:shadow-slate-950/5 relative flex flex-col justify-between ${
                      method.active
                        ? 'border-slate-200'
                        : 'border-slate-200 opacity-60 bg-slate-50/50'
                    }`}
                  >
                    <div>
                      {/* Card Header: Name + Active Toggle */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className={`inline-block px-2.5 py-0.5 text-[10px] font-mono font-extrabold uppercase rounded-lg border mb-1.5 ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                            {method.carrier}
                          </span>
                          <h3 className="text-sm font-black text-slate-900 leading-tight">
                            {method.name}
                          </h3>
                        </div>

                        <button
                          onClick={() => handleToggleActive(method)}
                          title={method.active ? 'Desactivar opción' : 'Activar opción'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            method.active
                              ? 'text-[#059669] hover:bg-emerald-50'
                              : 'text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          {method.active ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Description */}
                      {method.description && (
                        <p className="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                          {method.description}
                        </p>
                      )}

                      {/* Info Meta Grid */}
                      <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                        <div className="flex items-center justify-between text-slate-700 font-mono">
                          <span className="text-slate-500 font-sans font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-[#E60012]" /> Flete Base:
                          </span>
                          <span className="font-extrabold text-slate-900">
                            {method.price === 0 ? (
                              <span className="text-[#059669] font-black">¡GRATIS! ($0 COP)</span>
                            ) : (
                              formatCurrency(method.price)
                            )}
                          </span>
                        </div>

                        {/* Zone Rates breakdown preview */}
                        {method.zoneRates && method.zoneRates.length > 0 && (
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80 space-y-1 text-[11px]">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">TARIFAS POR ZONA:</span>
                            {method.zoneRates.map(zr => {
                              const zoneObj = zones.find(z => z.id === zr.zoneId);
                              return (
                                <div key={zr.zoneId} className="flex justify-between font-mono text-slate-700">
                                  <span className="truncate text-slate-500">{zoneObj?.name || zr.zoneId}:</span>
                                  <span className="font-bold text-slate-900">{formatCurrency(zr.price)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-slate-700 font-mono">
                          <span className="text-slate-500 font-sans font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600" /> Tiempo Entrega:
                          </span>
                          <span className="font-extrabold text-slate-900">
                            {method.estimatedDays === 0 ? 'Entrega Inmediata' : `${method.estimatedDays} días hábiles`}
                          </span>
                        </div>

                        {/* Dispatch Days */}
                        <div className="flex items-center justify-between text-slate-700 font-mono">
                          <span className="text-slate-500 font-sans font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" /> Despachos:
                          </span>
                          <div className="flex gap-1">
                            {(method.dispatchDays || ['1','2','3','4','5']).map(d => (
                              <span key={d} className="px-1.5 py-0.5 text-[9px] font-mono font-extrabold bg-slate-100 rounded text-slate-700 border border-slate-200">
                                {DAY_NAMES[d] || d}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Free threshold if set */}
                        {method.freeShippingThreshold && (
                          <div className="flex items-center justify-between text-[#059669] text-[11px] font-mono font-extrabold pt-1">
                            <span className="font-sans font-bold text-slate-500 uppercase">Gratis en compras &gt;</span>
                            <span>{formatCurrency(method.freeShippingThreshold)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-end gap-2 pt-4 mt-2">
                      <button
                        onClick={() => handleOpenEditModal(method)}
                        className="px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      {deleteConfirmId === method.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteMethod(method.id)}
                            className="px-2.5 py-1 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(method.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar método"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* SUB-TAB 2: SHIPPING ZONES */}
      {activeSubTab === 'zones' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {zones.map(zone => (
              <div 
                key={zone.id} 
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-red-50 text-[#E60012] flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-black text-slate-900 font-display">{zone.name}</h3>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg ${zone.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                      {zone.active ? 'ACTIVA' : 'INACTIVA'}
                    </span>
                  </div>

                  {zone.description && (
                    <p className="text-xs text-slate-600 mb-3">{zone.description}</p>
                  )}

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-3 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      DEPARTAMENTOS ASIGNADOS ({zone.departments.length}):
                    </span>
                    {zone.departments.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                        {zone.departments.map(dept => (
                          <span key={dept} className="px-2 py-0.5 text-[10px] bg-white border border-slate-200 text-slate-700 font-semibold rounded-md">
                            {dept}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic text-slate-500">
                        Cobertura nacional / Todos los demás departamentos (Catch-all).
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEditZoneModal(zone)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  {deleteZoneConfirmId === zone.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteZone(zone.id)}
                        className="px-2.5 py-1 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setDeleteZoneConfirmId(null)}
                        className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteZoneConfirmId(zone.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar zona"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipping Method Modal */}
      <ShippingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMethod}
        initialMethod={editingMethod}
        zones={zones}
      />

      {/* Shipping Zone Modal */}
      <ZoneModal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        onSave={handleSaveZone}
        zoneToEdit={editingZone}
      />
    </div>
  );
};
