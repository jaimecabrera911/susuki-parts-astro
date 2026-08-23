import React, { useState } from 'react';
import { 
  Users, 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  UserCheck, 
  CheckCircle2, 
  ShieldCheck, 
  Key, 
  Lock, 
  Eye, 
  Layers, 
  Sparkles,
  Check,
  X
} from 'lucide-react';
import type { UserProfile, Role } from '../../types';
import { UserAvatar } from '../UserAvatar';
import { AdminSearchInput } from './AdminSearchInput';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';
import { MODULE_DEFINITIONS } from './RoleModal';

interface UsersManagerProps {
  users: UserProfile[];
  roles?: Role[];
  searchQuery: string;
  onAddUser: () => void;
  onEditUser: (user: UserProfile) => void;
  onDeleteUser: (id: string) => void;
  onAddRole?: () => void;
  onEditRole?: (role: Role) => void;
  onDeleteRole?: (id: string) => void;
  canWrite?: boolean;
  isLoading?: boolean;
}

const roleOf = (usr: UserProfile): string => usr.role || 'customer';
const statusOf = (usr: UserProfile): string => (usr.active !== false ? 'active' : 'blocked');

export const UsersManager: React.FC<UsersManagerProps> = ({
  users,
  roles = [],
  searchQuery,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onAddRole,
  onEditRole,
  onDeleteRole,
  canWrite = true,
  isLoading = false,
}) => {
  const [currentTab, setCurrentTab] = useState<'users' | 'roles'>('users');
  const [localSearch, setLocalSearch] = useState('');

  const activeQuery = (searchQuery || localSearch).trim().toLowerCase();

  const getRoleDisplayName = (usr: UserProfile) => {
    if (usr.role === 'superadmin') return 'Super Administrador';
    if (usr.role === 'customer') return 'Cliente';
    const found = roles.find((r) => r.slug === usr.role || r.id === usr.roleId);
    if (found) return found.name;
    if (usr.role === 'admin') return 'Administrador';
    return usr.role || 'Cliente';
  };

  const getRoleBadgeStyle = (usr: UserProfile) => {
    if (usr.role === 'superadmin') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (usr.role === 'customer') {
      return 'bg-slate-100 text-slate-700 border-slate-200';
    }
    return 'bg-blue-50 text-[#0A3088] border-blue-200';
  };

  const columns: DataTableColumn<UserProfile>[] = [
    {
      key: 'user',
      label: 'Usuario',
      minWidth: '200px',
      sortable: true,
      sortSelector: (usr) => usr.fullName,
      render: (usr) => (
        <div className="flex items-center gap-3">
          <UserAvatar
            avatarUrl={usr.avatarUrl}
            fullName={usr.fullName}
            className="w-10 h-10"
            textClassName="text-xs font-black"
          />
          <div>
            <p className="font-extrabold text-slate-900 group-hover:text-[#E60012] transition-colors font-display text-xs">
              {usr.fullName}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">{usr.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Fecha Registro',
      minWidth: '110px',
      render: (usr) => (
        <p className="text-[11px] font-mono text-slate-400 font-bold">{usr.createdAt}</p>
      ),
    },
    {
      key: 'document',
      label: 'Cédula / NIT',
      minWidth: '120px',
      render: (usr) => (
        <span className="font-mono font-bold text-xs text-slate-800">{usr.documentId}</span>
      ),
    },
    {
      key: 'city',
      label: 'Ciudad',
      minWidth: '120px',
      filterable: true,
      accessor: (usr) => usr.city || '',
      render: (usr) => (
        <p className="font-bold text-slate-900 text-xs font-display">{usr.city}</p>
      ),
    },
    {
      key: 'phone',
      label: 'Teléfono',
      minWidth: '120px',
      render: (usr) => (
        <p className="text-[11px] font-mono text-slate-500 font-bold">{usr.phone}</p>
      ),
    },
    {
      key: 'role',
      label: 'Rol / Grupo',
      minWidth: '160px',
      filterable: true,
      accessor: (usr) => usr.role || 'customer',
      render: (usr) => {
        const isCustomer = usr.role === 'customer';
        const isSuper = usr.role === 'superadmin';
        return (
          <div className="space-y-1">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1.5 w-fit ${getRoleBadgeStyle(usr)}`}>
              {isSuper ? <Shield className="w-3 h-3 text-[#E60012]" /> : isCustomer ? <Users className="w-3 h-3 text-slate-400" /> : <ShieldCheck className="w-3 h-3 text-blue-600" />}
              {getRoleDisplayName(usr)}
            </span>
            {!isCustomer && usr.permissions && usr.permissions.length > 0 && !isSuper && (
              <span className="text-[9px] text-slate-500 block font-mono">
                {usr.permissions.filter(p => p.canRead).length} módulos asignados
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Estado',
      minWidth: '100px',
      filterable: true,
      accessor: statusOf,
      filterOptions: [
        { value: 'active', label: 'Activa' },
        { value: 'blocked', label: 'Bloqueada' },
      ],
      render: (usr) =>
        statusOf(usr) === 'active' ? (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Activa
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200">
            Bloqueada
          </span>
        ),
    },
  ];

  const handleSearchFilter = (usr: UserProfile, query: string) =>
    usr.fullName.toLowerCase().includes(query) ||
    usr.id.toLowerCase().includes(query) ||
    usr.documentId?.toLowerCase().includes(query) ||
    usr.email.toLowerCase().includes(query) ||
    usr.city?.toLowerCase().includes(query) ||
    usr.phone?.toLowerCase().includes(query) ||
    usr.address?.toLowerCase().includes(query);

  const totalUsers = users.length;
  const customersCount = users.filter(u => roleOf(u) === 'customer').length;
  const staffCount = users.filter(u => roleOf(u) !== 'customer').length;
  const rolesCount = roles.length;

  return (
    <div id="users-manager" className="space-y-6">
      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase leading-tight">Usuarios Totales</p>
            <p className="text-lg sm:text-2xl font-black text-slate-900 font-display mt-1 leading-none">{totalUsers}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-red-50 text-[#E60012] border border-red-200 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase leading-tight">Clientes Tienda</p>
            <p className="text-lg sm:text-2xl font-black text-emerald-600 font-display mt-1 leading-none">{customersCount}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase leading-tight">Equipo & Admins</p>
            <p className="text-lg sm:text-2xl font-black text-[#0A3088] font-display mt-1 leading-none">{staffCount}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 text-[#0A3088] border border-blue-200 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase leading-tight">Roles / Grupos</p>
            <p className="text-lg sm:text-2xl font-black text-purple-600 font-display mt-1 leading-none">{rolesCount}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Sub-Navigation Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setCurrentTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold font-display transition-all flex items-center gap-2 cursor-pointer ${
            currentTab === 'users'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuarios Registrados ({totalUsers})</span>
        </button>

        <button
          onClick={() => setCurrentTab('roles')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold font-display transition-all flex items-center gap-2 cursor-pointer ${
            currentTab === 'roles'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4 text-[#E60012]" />
          <span>Roles y Grupos de Permisos ({rolesCount})</span>
        </button>
      </div>

      {currentTab === 'users' ? (
        <>
          {/* Action & Search Toolbar for Users */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <AdminSearchInput
                value={localSearch}
                onChange={setLocalSearch}
                placeholder="Buscar cliente, CC, correo..."
              />
              {canWrite && (
                <button
                  type="button"
                  onClick={onAddUser}
                  className="px-4 py-2 bg-[#E60012] hover:bg-[#b5000b] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all shrink-0 w-fit cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Usuario</span>
                </button>
              )}
            </div>
          </div>

          {/* Users DataTable */}
          <DataTable
            data={users}
            columns={columns}
            keyField="id"
            loading={isLoading}
            itemLabel="usuarios"
            emptyMessage="No se encontraron usuarios con los filtros aplicados"
            searchQuery={activeQuery}
            searchFilter={handleSearchFilter}
            actions={(usr) => (
              <>
                {canWrite && (
                  <>
                    <button
                      onClick={() => onEditUser(usr)}
                      className="p-2 text-slate-500 hover:text-[#0A3088] hover:bg-blue-50 rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
                      title="Editar perfil y permisos del usuario"
                    >
                      <Edit className="w-4 h-4 text-[#0A3088]" />
                    </button>
                    <button
                      onClick={() => onDeleteUser(usr.id)}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </>
                )}
              </>
            )}
          />
        </>
      ) : (
        /* Roles & Permission Groups View */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-black text-slate-900 font-display flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#E60012]" />
                Gestión de Roles y Matriz de Control de Acceso
              </h3>
              <p className="text-xs text-slate-500">
                Configura los grupos de permisos para delegar funciones específicas a los miembros de tu equipo
              </p>
            </div>
            {canWrite && onAddRole && (
              <button
                type="button"
                onClick={onAddRole}
                className="px-4 py-2 bg-[#E60012] hover:bg-[#b5000b] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all shrink-0 w-fit cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Rol de Permisos</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((r) => {
              const readModules = r.permissions?.filter(p => p.canRead) || [];
              const writeModules = r.permissions?.filter(p => p.canWrite) || [];
              const isSuper = r.slug === 'superadmin';

              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          isSuper ? 'bg-red-50 text-[#E60012] border-red-200' : 'bg-blue-50 text-[#0A3088] border-blue-200'
                        }`}>
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900 font-display">{r.name}</h4>
                            {r.isSystem && (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                                Sistema
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-slate-400 font-bold">{r.slug}</p>
                        </div>
                      </div>

                      {canWrite && (
                        <div className="flex items-center gap-1">
                          {onEditRole && (
                            <button
                              onClick={() => onEditRole(r)}
                              className="p-1.5 text-slate-400 hover:text-[#0A3088] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar rol y permisos"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {!r.isSystem && onDeleteRole && (
                            <button
                              onClick={() => onDeleteRole(r.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar rol"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-600">
                      {r.description || 'Sin descripción detallada.'}
                    </p>

                    {/* Permissions summary */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700 font-display flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          Módulos Lectura:
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {isSuper ? 'Todos (13)' : `${readModules.length} de 13`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700 font-display flex items-center gap-1">
                          <Edit className="w-3.5 h-3.5 text-red-600" />
                          Módulos Edición:
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {isSuper ? 'Todos (13)' : `${writeModules.length} de 13`}
                        </span>
                      </div>

                      {/* Badges preview */}
                      <div className="flex flex-wrap gap-1 pt-1 max-h-24 overflow-y-auto">
                        {isSuper ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-red-50 text-[#E60012] border border-red-200">
                            ★ Control Total en Todos los Módulos
                          </span>
                        ) : (
                          readModules.map((p) => {
                            const modDef = MODULE_DEFINITIONS.find(m => m.id === p.module);
                            return (
                              <span
                                key={p.module}
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                  p.canWrite
                                    ? 'bg-red-50 text-red-800 border-red-200'
                                    : 'bg-blue-50 text-blue-800 border-blue-200'
                                }`}
                              >
                                {modDef?.label || p.module}
                                {p.canWrite ? '✎' : '👁'}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};