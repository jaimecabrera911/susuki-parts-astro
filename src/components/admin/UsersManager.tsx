import React, { useState } from 'react';
import { Users, Search, UserCheck, Shield, Plus, Edit, Trash2, Mail, Phone, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import type { UserProfile } from '../../types';
import { UserAvatar } from '../UserAvatar';

interface UsersManagerProps {
  users: UserProfile[];
  searchQuery: string;
  onAddUser: () => void;
  onEditUser: (user: UserProfile) => void;
  onDeleteUser: (id: string) => void;
}

export const UsersManager: React.FC<UsersManagerProps> = ({
  users,
  searchQuery,
  onAddUser,
  onEditUser,
  onDeleteUser
}) => {
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'admin'>('all');
  const [localSearch, setLocalSearch] = useState('');

  const activeQuery = (searchQuery || localSearch).trim().toLowerCase();

  const filteredUsers = users.filter(usr => {
    if (roleFilter !== 'all' && (usr.role || 'customer') !== roleFilter) return false;

    if (!activeQuery) return true;

    const matchesName = usr.fullName.toLowerCase().includes(activeQuery);
    const matchesDoc = usr.documentId?.toLowerCase().includes(activeQuery);
    const matchesEmail = usr.email.toLowerCase().includes(activeQuery);
    const matchesCity = usr.city?.toLowerCase().includes(activeQuery);
    const matchesPhone = usr.phone?.toLowerCase().includes(activeQuery);

    return matchesName || matchesDoc || matchesEmail || matchesCity || matchesPhone;
  });

  const totalUsers = users.length;
  const customersCount = users.filter(u => (u.role || 'customer') === 'customer').length;
  const adminsCount = users.filter(u => u.role === 'admin').length;
  const activeUsersCount = users.filter(u => u.active !== false).length;

  return (
    <div id="users-manager" className="space-y-6">
      
      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase">Usuarios Registrados</p>
            <p className="text-2xl font-black text-slate-900 font-display mt-0.5">{totalUsers}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E60012] border border-red-200 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase">Clientes Activos</p>
            <p className="text-2xl font-black text-emerald-600 font-display mt-0.5">{customersCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase">Administradores</p>
            <p className="text-2xl font-black text-[#0A3088] font-display mt-0.5">{adminsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A3088] border border-blue-200 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase">Cuentas Habilitadas</p>
            <p className="text-2xl font-black text-purple-600 font-display mt-0.5">{activeUsersCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Header */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Role Filters Pill Bar */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                roleFilter === 'all'
                  ? 'bg-[#E60012] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({totalUsers})
            </button>
            <button
              onClick={() => setRoleFilter('customer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                roleFilter === 'customer'
                  ? 'bg-[#E60012] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Clientes ({customersCount})
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                roleFilter === 'admin'
                  ? 'bg-[#E60012] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Admins ({adminsCount})
            </button>
          </div>

          {/* Right Actions: Local Search & Add User */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Buscar cliente, CC, correo..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] font-medium"
              />
            </div>

            <button
              type="button"
              onClick={onAddUser}
              className="px-4 py-1.5 bg-[#E60012] hover:bg-[#b5000b] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Usuario</span>
            </button>
          </div>

        </div>
      </div>

      {/* Users List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                <th className="py-3.5 px-5">Usuario / Fecha Registro</th>
                <th className="py-3.5 px-4">Cédula / NIT</th>
                <th className="py-3.5 px-4">Contacto (Email / Teléfono)</th>
                <th className="py-3.5 px-4">Ciudad & Dirección</th>
                <th className="py-3.5 px-4">Rol</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredUsers.map((usr) => (
                <tr key={usr.id} className="hover:bg-slate-50/70 transition-colors group">
                  
                  {/* User Name & Avatar */}
                  <td className="py-4 px-5">
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
                        <p className="text-[11px] font-mono text-slate-400 font-bold">
                          ID: {usr.id} • {usr.createdAt}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Document ID */}
                  <td className="py-4 px-4 font-mono font-bold text-xs text-slate-800">
                    {usr.documentId}
                  </td>

                  {/* Contact Info */}
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-xs font-medium text-slate-900">{usr.email}</p>
                      <p className="text-[11px] font-mono text-slate-500 font-bold">{usr.phone}</p>
                    </div>
                  </td>

                  {/* Address & City */}
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-bold text-slate-900 text-xs font-display">{usr.city}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{usr.address}</p>
                    </div>
                  </td>

                  {/* Role Badge */}
                  <td className="py-4 px-4">
                    {usr.role === 'admin' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-[#0A3088] border border-blue-200 flex items-center gap-1 w-fit">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 w-fit">
                        <Users className="w-3 h-3 text-slate-400" />
                        Cliente
                      </span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4">
                    {usr.active !== false ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Activa
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200">
                        Bloqueada
                      </span>
                    )}
                  </td>

                  {/* Actions (Icon Only) */}
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEditUser(usr)}
                        className="p-2 text-slate-500 hover:text-[#0A3088] hover:bg-blue-50 rounded-xl border border-slate-200 shadow-xs transition-colors"
                        title="Editar perfil de usuario"
                      >
                        <Edit className="w-4 h-4 text-[#0A3088]" />
                      </button>
                      <button
                        onClick={() => onDeleteUser(usr.id)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 shadow-xs transition-colors"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-mono font-bold">No se encontraron usuarios con los filtros aplicados</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
