import React, { useState, useEffect } from 'react';
import { 
  X, 
  Shield, 
  CheckCircle2, 
  Building2, 
  Package, 
  Layers, 
  FolderTree, 
  ShoppingCart, 
  Users, 
  Truck, 
  CreditCard, 
  Settings, 
  Tag, 
  BarChart3, 
  RotateCcw,
  Check,
  Eye,
  Edit3
} from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import type { Role, DashboardModule, UserPermission } from '../../types';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleToEdit: Role | null;
  onSaveRole: (savedRole: Partial<Role>) => void;
}

export const MODULE_DEFINITIONS: {
  id: DashboardModule;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'brands', label: 'Marcas', description: 'Gestión de marcas de motocicletas', icon: Building2 },
  { id: 'models', label: 'Modelos de Moto', description: 'Modelos, años y categorías de motos', icon: FaMotorcycle },
  { id: 'categories', label: 'Categorías', description: 'Árbol de categorías y subcategorías', icon: FolderTree },
  { id: 'parts', label: 'Catálogo Repuestos', description: 'Piezas, precios, stock y números OEM', icon: Package },
  { id: 'schematics', label: 'Despieces Explosión', description: 'Diagramas interactivos y hotspots', icon: Layers },
  { id: 'orders', label: 'Gestión de Pedidos', description: 'Ventas, estados de orden y comprobantes', icon: ShoppingCart },
  { id: 'returns', label: 'Devoluciones y RMA', description: 'Garantías, reembolsos y notas QC', icon: RotateCcw },
  { id: 'users', label: 'Usuarios y Permisos', description: 'Cuentas de usuario, clientes y roles', icon: Users },
  { id: 'shipping', label: 'Métodos de Envío', description: 'Zonas geográficas y tarifas de transporte', icon: Truck },
  { id: 'payments', label: 'Medios de Pago', description: 'Pasarelas, Wompi y transferencias bancarias', icon: CreditCard },
  { id: 'settings', label: 'Configuración', description: 'Datos de la tienda, impuestos y SEO', icon: Settings },
  { id: 'coupons', label: 'Cupones & Descuentos', description: 'Códigos promocionales y reglas de descuento', icon: Tag },
  { id: 'metrics', label: 'Métricas & Informes', description: 'Estadísticas de ventas, productos y clientes', icon: BarChart3 },
];

export const RoleModal: React.FC<RoleModalProps> = ({
  isOpen,
  onClose,
  roleToEdit,
  onSaveRole
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(roleToEdit?.name || '');
  const [slug, setSlug] = useState(roleToEdit?.slug || '');
  const [description, setDescription] = useState(roleToEdit?.description || '');
  const [active, setActive] = useState(roleToEdit?.active !== undefined ? roleToEdit.active : true);
  const [permissions, setPermissions] = useState<Record<DashboardModule, { canRead: boolean; canWrite: boolean }>>(() => {
    const initial: Record<string, { canRead: boolean; canWrite: boolean }> = {};
    for (const mod of MODULE_DEFINITIONS) {
      initial[mod.id] = { canRead: false, canWrite: false };
    }
    if (roleToEdit?.permissions) {
      for (const p of roleToEdit.permissions) {
        initial[p.module] = {
          canRead: Boolean(p.canRead),
          canWrite: Boolean(p.canWrite)
        };
      }
    }
    return initial as Record<DashboardModule, { canRead: boolean; canWrite: boolean }>;
  });

  useEffect(() => {
    if (roleToEdit) {
      setName(roleToEdit.name);
      setSlug(roleToEdit.slug);
      setDescription(roleToEdit.description || '');
      setActive(roleToEdit.active !== undefined ? roleToEdit.active : true);
      const permMap: Record<string, { canRead: boolean; canWrite: boolean }> = {};
      for (const mod of MODULE_DEFINITIONS) {
        permMap[mod.id] = { canRead: false, canWrite: false };
      }
      for (const p of roleToEdit.permissions || []) {
        permMap[p.module] = {
          canRead: Boolean(p.canRead),
          canWrite: Boolean(p.canWrite)
        };
      }
      setPermissions(permMap as Record<DashboardModule, { canRead: boolean; canWrite: boolean }>);
    } else {
      setName('');
      setSlug('');
      setDescription('');
      setActive(true);
      const permMap: Record<string, { canRead: boolean; canWrite: boolean }> = {};
      for (const mod of MODULE_DEFINITIONS) {
        permMap[mod.id] = { canRead: true, canWrite: false };
      }
      setPermissions(permMap as Record<DashboardModule, { canRead: boolean; canWrite: boolean }>);
    }
  }, [roleToEdit]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!roleToEdit) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleToggleRead = (modId: DashboardModule) => {
    setPermissions(prev => {
      const current = prev[modId] || { canRead: false, canWrite: false };
      const nextRead = !current.canRead;
      return {
        ...prev,
        [modId]: {
          canRead: nextRead,
          // If turning off read, also turn off write
          canWrite: nextRead ? current.canWrite : false
        }
      };
    });
  };

  const handleToggleWrite = (modId: DashboardModule) => {
    setPermissions(prev => {
      const current = prev[modId] || { canRead: false, canWrite: false };
      const nextWrite = !current.canWrite;
      return {
        ...prev,
        [modId]: {
          // If enabling write, automatically enable read
          canRead: nextWrite ? true : current.canRead,
          canWrite: nextWrite
        }
      };
    });
  };

  const handleSetAll = (canRead: boolean, canWrite: boolean) => {
    const updated: Record<string, { canRead: boolean; canWrite: boolean }> = {};
    for (const mod of MODULE_DEFINITIONS) {
      updated[mod.id] = { canRead, canWrite };
    }
    setPermissions(updated as Record<DashboardModule, { canRead: boolean; canWrite: boolean }>);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formattedPermissions: UserPermission[] = Object.entries(permissions).map(([module, perms]) => ({
      module: module as DashboardModule,
      canRead: perms.canRead,
      canWrite: perms.canWrite
    }));

    const saved: Partial<Role> = {
      id: roleToEdit?.id || crypto.randomUUID(),
      name: name.trim(),
      slug: slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '_'),
      description: description.trim(),
      active,
      isSystem: roleToEdit?.isSystem || false,
      permissions: formattedPermissions
    };

    onSaveRole(saved);
  };

  const isSystemRole = Boolean(roleToEdit?.isSystem);

  return (
    <div id="role-modal" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-[#E60012]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-display">
                {roleToEdit ? 'Editar Rol / Grupo de Permisos' : 'Crear Nuevo Rol / Grupo'}
              </h3>
              <p className="text-xs text-slate-300">
                Define los accesos y permisos por módulo para los usuarios asignados a este rol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-display">
                Nombre del Rol <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isSystemRole}
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="ej. Gestor de Ventas y Envíos"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-[#E60012] focus:ring-2 focus:ring-red-100 outline-hidden transition-all disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-display">
                Identificador (Slug)
              </label>
              <input
                type="text"
                disabled={isSystemRole}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ej. sales_manager"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-700 focus:bg-white focus:border-[#E60012] focus:ring-2 focus:ring-red-100 outline-hidden transition-all disabled:opacity-60"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-display">
                Descripción del Rol
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descripción de las funciones y responsabilidades de este grupo"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-[#E60012] focus:ring-2 focus:ring-red-100 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Matrix Controls & Actions */}
          <div className="border-t border-slate-200 pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 font-display flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#E60012]" />
                  Matriz de Permisos por Módulo ({MODULE_DEFINITIONS.length} Secciones)
                </h4>
                <p className="text-xs text-slate-500">
                  Selecciona qué módulos puede visualizar (Lectura) y modificar (Escritura/Edición)
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSetAll(true, true)}
                  className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Control Total
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAll(true, false)}
                  className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  Solo Lectura
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAll(false, false)}
                  className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors"
                >
                  Desmarcar Todos
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="grid grid-cols-12 bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                <div className="col-span-6 sm:col-span-7">Módulo / Sección</div>
                <div className="col-span-3 sm:col-span-2 text-center">Lectura (Ver)</div>
                <div className="col-span-3 text-center">Edición (Modificar)</div>
              </div>

              <div className="divide-y divide-slate-100">
                {MODULE_DEFINITIONS.map((mod) => {
                  const Icon = mod.icon;
                  const current = permissions[mod.id] || { canRead: false, canWrite: false };
                  return (
                    <div
                      key={mod.id}
                      className={`grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-50/80 transition-colors ${
                        current.canRead ? 'bg-white' : 'bg-slate-50/40 text-slate-400'
                      }`}
                    >
                      <div className="col-span-6 sm:col-span-7 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          current.canWrite 
                            ? 'bg-red-50 text-[#E60012]' 
                            : current.canRead 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'bg-slate-100 text-slate-400'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={`text-xs font-extrabold font-display ${current.canRead ? 'text-slate-900' : 'text-slate-500'}`}>
                            {mod.label}
                          </p>
                          <p className="text-[10px] text-slate-400 hidden sm:block">
                            {mod.description}
                          </p>
                        </div>
                      </div>

                      {/* Read Toggle */}
                      <div className="col-span-3 sm:col-span-2 flex justify-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={current.canRead}
                            onChange={() => handleToggleRead(mod.id)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {/* Write Toggle */}
                      <div className="col-span-3 flex justify-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={current.canWrite}
                            onChange={() => handleToggleWrite(mod.id)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E60012]"></div>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active status toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="text-xs font-extrabold text-slate-900 font-display">Estado del Rol</p>
              <p className="text-[11px] text-slate-500">Los roles inactivos no otorgan acceso a los usuarios vinculados</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors font-display"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-extrabold text-white bg-[#E60012] hover:bg-red-700 rounded-xl shadow-xs hover:shadow-md transition-all font-display flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {roleToEdit ? 'Guardar Cambios' : 'Crear Rol'}
          </button>
        </div>
      </div>
    </div>
  );
};
