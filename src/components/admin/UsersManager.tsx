import React, { useState } from 'react';
import { Users, Shield, Plus, Edit, Trash2, UserCheck, CheckCircle2 } from 'lucide-react';
import type { UserProfile } from '../../types';
import { UserAvatar } from '../UserAvatar';
import { AdminSearchInput } from './AdminSearchInput';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

interface UsersManagerProps {
  users: UserProfile[];
  searchQuery: string;
  onAddUser: () => void;
  onEditUser: (user: UserProfile) => void;
  onDeleteUser: (id: string) => void;
  isLoading?: boolean;
}

const roleOf = (usr: UserProfile): string => usr.role || 'customer';
const statusOf = (usr: UserProfile): string => (usr.active !== false ? 'active' : 'blocked');

export const UsersManager: React.FC<UsersManagerProps> = ({
  users,
  searchQuery,
  onAddUser,
  onEditUser,
  onDeleteUser,
  isLoading = false,
}) => {
  const [localSearch, setLocalSearch] = useState('');

  const activeQuery = (searchQuery || localSearch).trim().toLowerCase();

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
          <p className="font-extrabold text-slate-900 group-hover:text-[#E60012] transition-colors font-display text-xs">
            {usr.fullName}
          </p>
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
      key: 'email',
      label: 'Correo',
      minWidth: '180px',
      render: (usr) => (
        <p className="text-xs font-medium text-slate-900">{usr.email}</p>
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
      key: 'address',
      label: 'Dirección',
      minWidth: '160px',
      render: (usr) => (
        <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{usr.address}</p>
      ),
    },
    {
      key: 'role',
      label: 'Rol',
      minWidth: '100px',
      filterable: true,
      accessor: roleOf,
      filterOptions: [
        { value: 'customer', label: 'Cliente' },
        { value: 'admin', label: 'Admin' },
      ],
      render: (usr) =>
        roleOf(usr) === 'admin' ? (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-[#0A3088] border border-blue-200 flex items-center gap-1 w-fit">
            <Shield className="w-3 h-3" />
            Admin
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 w-fit">
            <Users className="w-3 h-3 text-slate-400" />
            Cliente
          </span>
        ),
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
  const adminsCount = users.filter(u => roleOf(u) === 'admin').length;
  const activeUsersCount = users.filter(u => u.active !== false).length;

  return (
    <div id="users-manager" className="space-y-6">
      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase leading-tight">Usuarios Registrados</p>
            <p className="text-lg sm:text-2xl font-black text-slate-900 font-display mt-1 leading-none">{totalUsers}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-red-50 text-[#E60012] border border-red-200 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase leading-tight">Clientes Activos</p>
            <p className="text-lg sm:text-2xl font-black text-emerald-600 font-display mt-1 leading-none">{customersCount}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase leading-tight">Administradores</p>
            <p className="text-lg sm:text-2xl font-black text-[#0A3088] font-display mt-1 leading-none">{adminsCount}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 text-[#0A3088] border border-blue-200 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase leading-tight">Cuentas Habilitadas</p>
            <p className="text-lg sm:text-2xl font-black text-purple-600 font-display mt-1 leading-none">{activeUsersCount}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Action & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <AdminSearchInput
            value={localSearch}
            onChange={setLocalSearch}
            placeholder="Buscar cliente, CC, correo..."
          />
          <button
            type="button"
            onClick={onAddUser}
            className="px-4 py-1.5 bg-[#E60012] hover:bg-[#b5000b] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all shrink-0 w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Users DataTable with per-column dynamic filters */}
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
            <button
              onClick={() => onEditUser(usr)}
              className="p-2 text-slate-500 hover:text-[#0A3088] hover:bg-blue-50 rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
              title="Editar perfil de usuario"
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
      />
    </div>
  );
};