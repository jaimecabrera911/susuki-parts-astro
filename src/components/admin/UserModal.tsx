import React, { useState, useEffect } from "react";
import { X, User, CheckCircle2, Eye, EyeOff, Shield, ShieldCheck, ShieldAlert, Check } from "lucide-react";
import type { UserProfile, Role, UserPermission } from "../../types";
import { LocationSelector } from "../LocationSelector";
import { fetchCities, fetchRoles } from "../../services/api";
import { getDefaultLocation } from "../../utils/config";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: UserProfile | null;
  onSaveUser: (savedUser: UserProfile) => void;
  availableRoles?: Role[];
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  onSaveUser,
  availableRoles = []
}) => {
  if (!isOpen) return null;

  const [fullName, setFullName] = useState(userToEdit?.fullName || "");
  const [email, setEmail] = useState(userToEdit?.email || "");
  const [phone, setPhone] = useState(userToEdit?.phone || "");
  const [documentId, setDocumentId] = useState(userToEdit?.documentId || "");
  const [country, setCountry] = useState(
    (userToEdit as any)?.country || getDefaultLocation().country,
  );
  const [department, setDepartment] = useState(
    (userToEdit as any)?.department || getDefaultLocation().department,
  );
  const [city, setCity] = useState(userToEdit?.city || getDefaultLocation().city);
  const [address, setAddress] = useState(userToEdit?.address || "");
  const [postalCode, setPostalCode] = useState(userToEdit?.postalCode || "");
  const [role, setRole] = useState<string>(
    userToEdit?.role || "customer",
  );
  const [roleId, setRoleId] = useState<string>(
    userToEdit?.roleId || ""
  );
  const [active, setActive] = useState<boolean>(
    userToEdit?.active !== undefined ? userToEdit.active : true,
  );
  const [notes, setNotes] = useState(userToEdit?.notes || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [citiesList, setCitiesList] = useState<
    {
      id: string;
      country: string;
      department: string;
      city: string;
      active: boolean;
    }[]
  >([]);
  const [roles, setRoles] = useState<Role[]>(availableRoles);

  useEffect(() => {
    fetchCities()
      .then((data: any) => {
        if (data && data.length > 0)
          setCitiesList(data.filter((c: any) => c.active));
      })
      .catch((err) =>
        console.error("Error cargando ciudades en modal usuario:", err),
      );

    if (availableRoles.length === 0) {
      fetchRoles()
        .then((data: Role[]) => {
          if (data && data.length > 0) setRoles(data);
        })
        .catch((err) => console.error("Error cargando roles en modal usuario:", err));
    }
  }, [availableRoles]);

  useEffect(() => {
    if (userToEdit) {
      setFullName(userToEdit.fullName);
      setEmail(userToEdit.email);
      setPhone(userToEdit.phone);
      setDocumentId(userToEdit.documentId);
      setCountry((userToEdit as any)?.country || getDefaultLocation().country);
      setDepartment((userToEdit as any)?.department || getDefaultLocation().department);
      setCity(userToEdit.city);
      setAddress(userToEdit.address);
      setPostalCode(userToEdit.postalCode);
      setRole(userToEdit.role || "customer");
      setRoleId(userToEdit.roleId || "");
      setActive(userToEdit.active !== undefined ? userToEdit.active : true);
      setNotes(userToEdit.notes || "");
    } else {
      setFullName("");
      setEmail("");
      setPhone("");
      setDocumentId("");
      setCountry(getDefaultLocation().country);
      setDepartment(getDefaultLocation().department);
      setCity(getDefaultLocation().city);
      setAddress("");
      setPostalCode("");
      setRole("customer");
      setRoleId("");
      setActive(true);
      setNotes("");
      setPassword("");
    }
  }, [userToEdit]);

  const handleRoleSelection = (selectedRoleSlug: string) => {
    setRole(selectedRoleSlug);
    const matchedRole = roles.find((r) => r.slug === selectedRoleSlug);
    if (matchedRole) {
      setRoleId(matchedRole.id);
    } else {
      setRoleId("");
    }
  };

  const selectedRoleObj = roles.find((r) => r.slug === role || r.id === roleId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = userToEdit?.id || crypto.randomUUID();
    
    // Assign permissions from the selected role
    let assignedPermissions: UserPermission[] = userToEdit?.permissions || [];
    if (selectedRoleObj && selectedRoleObj.permissions) {
      assignedPermissions = selectedRoleObj.permissions;
    }

    const saved: UserProfile = {
      id,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      documentId: documentId.trim(),
      city: city.trim(),
      address: address.trim(),
      postalCode: postalCode.trim(),
      favoritePartIds: userToEdit?.favoritePartIds || [],
      createdAt:
        userToEdit?.createdAt || new Date().toISOString().split("T")[0],
      avatarUrl:
        userToEdit?.avatarUrl ||
        "https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/users/avatar.jpg",
      role,
      roleId: selectedRoleObj?.id || roleId,
      permissions: assignedPermissions,
      active,
      notes: notes.trim(),
    };
    (saved as any).country = country;
    (saved as any).department = department;
    if (password.trim()) {
      (saved as any).password = password.trim();
    }
    onSaveUser(saved);
    onClose();
  };

  return (
    <div id="user-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-[95vw] md:max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 md:px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#E60012] border border-red-200 flex items-center justify-center shrink-0 shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 font-display">
                {userToEdit
                  ? `Editar Usuario: ${userToEdit.fullName}`
                  : "Crear Nuevo Usuario / Cliente"}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {userToEdit
                  ? `ID: ${userToEdit.id} • Registrado el ${userToEdit.createdAt}`
                  : "Registra un cliente o administrador manualmente"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5 custom-scrollbar"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Carlos Alberto Mendoza"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E60012]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                Cédula / NIT (Documento) *
              </label>
              <input
                type="text"
                required
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="Ej. 1.098.765.432"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E60012]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos@email.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#E60012]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                Teléfono de Contacto *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+57 310 456 7890"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E60012]"
              />
            </div>

            {/* Selección en Cascada de Ubicación */}
            <div className="md:col-span-2">
              <LocationSelector
                country={country}
                department={department}
                city={city}
                citiesList={citiesList}
                onChange={(loc) => {
                  setCountry(loc.country);
                  setDepartment(loc.department);
                  setCity(loc.city);
                }}
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                Código Postal
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="110221"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E60012]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                Dirección Residencial / Despacho *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Carrera 15 # 93-47, Apto 502"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#E60012]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1 flex items-center justify-between">
                <span>Rol / Grupo de Permisos *</span>
                {role === 'customer' ? (
                  <span className="text-[10px] text-slate-400 font-bold">Sin acceso al Dashboard</span>
                ) : (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Acceso al Dashboard Habilitado
                  </span>
                )}
              </label>
              <select
                value={role}
                onChange={(e) => handleRoleSelection(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E60012]"
              >
                <optgroup label="Clientes">
                  <option value="customer">👤 Cliente Registrado (Solo Compras en Tienda)</option>
                </optgroup>
                <optgroup label="Administración & Roles del Dashboard">
                  {roles.length > 0 ? (
                    roles.map((r) => (
                      <option key={r.id} value={r.slug}>
                        🛡️ {r.name} {r.description ? `(${r.description})` : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="superadmin">🛡️ Super Administrador (Control Total)</option>
                      <option value="admin">🛡️ Administrador del Sistema</option>
                    </>
                  )}
                </optgroup>
              </select>

              {/* Informative banner according to selected role */}
              {role === 'customer' ? (
                <div className="mt-2 p-2.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-2 text-slate-600 text-xs">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Este usuario es un cliente de la tienda y no puede acceder al panel administrativo.</span>
                </div>
              ) : selectedRoleObj ? (
                <div className="mt-2 p-3 bg-red-50/70 rounded-xl border border-red-100 text-xs text-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5 font-display">
                      <Shield className="w-3.5 h-3.5 text-[#E60012]" />
                      Permisos de {selectedRoleObj.name}:
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {selectedRoleObj.permissions?.filter(p => p.canRead).length || 0} módulos autorizados
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedRoleObj.permissions?.filter(p => p.canRead).map((p) => (
                      <span
                        key={p.module}
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                          p.canWrite
                            ? 'bg-red-100/80 text-red-800 border-red-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {p.module} {p.canWrite ? '(Lectura/Escritura)' : '(Solo Ver)'}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                Estado de la Cuenta *
              </label>
              <select
                value={active ? "true" : "false"}
                onChange={(e) => setActive(e.target.value === "true")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E60012]"
              >
                <option value="true">Activa (Permite Iniciar Sesión)</option>
                <option value="false">Inactiva / Bloqueada</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                {userToEdit ? "Establecer Nueva Contraseña (Opcional)" : "Contraseña de Acceso *"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={userToEdit ? "Dejar en blanco para mantener contraseña actual" : "Ingresa contraseña segura"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#E60012]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-md transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                Notas & Observaciones del Cliente
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Propietario de motocicleta, historial de compras, preferencias..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#E60012] resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Usuario</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
