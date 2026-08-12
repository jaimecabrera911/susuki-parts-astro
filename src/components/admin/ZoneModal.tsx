import React, { useState, useEffect } from "react";
import { X, MapPin, Check, Plus, AlertCircle } from "lucide-react";
import type { ShippingZone } from "../../types";

interface ZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (zoneData: Partial<ShippingZone>) => void;
  zoneToEdit?: ShippingZone | null;
}

export const ZoneModal: React.FC<ZoneModalProps> = ({
  isOpen,
  onClose,
  onSave,
  zoneToEdit,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const [allDepartments, setAllDepartments] = useState<string[]>([]);

  useEffect(() => {
    if (zoneToEdit) {
      setName(zoneToEdit.name || "");
      setDescription(zoneToEdit.description || "");
      setDepartments(zoneToEdit.departments || []);
      setActive(zoneToEdit.active !== undefined ? zoneToEdit.active : true);
    } else {
      setName("");
      setDescription("");
      setDepartments([]);
      setActive(true);
    }
    setError("");
  }, [zoneToEdit, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetch("/api/states")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const rows = (json?.data || []) as { id: string; name: string }[];
        setAllDepartments(
          rows.map((s) => s.name).sort((a, b) => a.localeCompare(b)),
        );
      })
      .catch(() => {
        if (!cancelled) setAllDepartments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleDepartment = (dept: string) => {
    setDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept],
    );
  };

  const selectAllDepartments = () => {
    setDepartments([...allDepartments]);
  };

  const clearAllDepartments = () => {
    setDepartments([]);
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre de la zona es obligatorio");
      return;
    }

    onSave({
      ...(zoneToEdit?.id ? { id: zoneToEdit.id } : {}),
      name: name.trim(),
      description: description.trim(),
      departments,
      active,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E60012] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 font-display">
                {zoneToEdit ? "Editar Zona de Envío" : "Nueva Zona de Envío"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Configura los departamentos asignados a esta zona tarifaria.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre y Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre de la Zona <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Zona Local Oriental"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estado
              </label>
              <select
                value={active ? "true" : "false"}
                onChange={(e) => setActive(e.target.value === "true")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-hidden font-medium bg-white"
              >
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descripción / Notas
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Tarifas especiales para Bogotá y la sabana"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-hidden font-medium"
            />
          </div>

          {/* Selección de Departamentos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700">
                Departamentos Incluidos ({departments.length})
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllDepartments}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700"
                >
                  Seleccionar Todos
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={clearAllDepartments}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-700"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mb-3">
              Haz clic en los departamentos para agregarlos o quitarlos de esta
              zona tarifaria:
            </p>

            {allDepartments.length === 0 ? (
              <p className="text-xs italic text-slate-500 p-3">
                No hay departamentos cargados. Verifica que la geografía esté
                sembrada (endpoint /api/states).
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap gap-1.5 custom-scrollbar">
                {allDepartments.map((dept) => {
                  const isSelected = departments.includes(dept);
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => toggleDepartment(dept)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                        isSelected
                          ? "bg-red-50 text-[#E60012] border-red-200 shadow-2xs font-bold"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900"
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3 text-[#E60012]" />
                      )}
                      {dept}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#E60012] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Guardar Zona
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
