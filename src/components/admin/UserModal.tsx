import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import type { UserProfile } from '../../types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: UserProfile | null;
  onSaveUser: (savedUser: UserProfile) => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  onSaveUser
}) => {
  if (!isOpen) return null;

  const [fullName, setFullName] = useState(userToEdit?.fullName || '');
  const [email, setEmail] = useState(userToEdit?.email || '');
  const [phone, setPhone] = useState(userToEdit?.phone || '');
  const [documentId, setDocumentId] = useState(userToEdit?.documentId || '');
  const [city, setCity] = useState(userToEdit?.city || '');
  const [address, setAddress] = useState(userToEdit?.address || '');
  const [postalCode, setPostalCode] = useState(userToEdit?.postalCode || '');
  const [role, setRole] = useState<'customer' | 'admin'>(userToEdit?.role || 'customer');
  const [active, setActive] = useState<boolean>(userToEdit?.active !== undefined ? userToEdit.active : true);
  const [notes, setNotes] = useState(userToEdit?.notes || '');

  useEffect(() => {
    if (userToEdit) {
      setFullName(userToEdit.fullName);
      setEmail(userToEdit.email);
      setPhone(userToEdit.phone);
      setDocumentId(userToEdit.documentId);
      setCity(userToEdit.city);
      setAddress(userToEdit.address);
      setPostalCode(userToEdit.postalCode);
      setRole(userToEdit.role || 'customer');
      setActive(userToEdit.active !== undefined ? userToEdit.active : true);
      setNotes(userToEdit.notes || '');
    } else {
      setFullName('');
      setEmail('');
      setPhone('');
      setDocumentId('');
      setCity('');
      setAddress('');
      setPostalCode('');
      setRole('customer');
      setActive(true);
      setNotes('');
    }
  }, [userToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = userToEdit?.id || `usr-${Date.now().toString().slice(-6)}`;
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
      createdAt: userToEdit?.createdAt || new Date().toISOString().split('T')[0],
      avatarUrl: userToEdit?.avatarUrl || 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/users/avatar.jpg',
      role,
      active,
      notes: notes.trim()
    };
    onSaveUser(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-[95vw] md:max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 md:px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#E60012] border border-red-200 flex items-center justify-center shrink-0 shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 font-display">
                {userToEdit ? `Editar Usuario: ${userToEdit.fullName}` : 'Crear Nuevo Usuario / Cliente'}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {userToEdit ? `ID: ${userToEdit.id} • Registrado el ${userToEdit.createdAt}` : 'Registra un cliente o administrador manualmente'}
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5 custom-scrollbar">
          
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

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                Ciudad *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Bogotá D.C."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E60012]"
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

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                Rol de Usuario *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'customer' | 'admin')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E60012]"
              >
                <option value="customer">Cliente Registrado</option>
                <option value="admin">Administrador del Sistema</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                Estado de la Cuenta *
              </label>
              <select
                value={active ? 'true' : 'false'}
                onChange={(e) => setActive(e.target.value === 'true')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E60012]"
              >
                <option value="true">Activa (Permite Compras)</option>
                <option value="false">Inactiva / Bloqueada</option>
              </select>
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
