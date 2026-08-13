import React, { useState, useEffect } from "react";
import { X, MapPin, Check, AlertCircle, ChevronRight, ChevronDown } from "lucide-react";
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
  const [completeDepartments, setCompleteDepartments] = useState<string[]>([]);
  const [pointCities, setPointCities] = useState<{ department: string; city: string }[]>([]);
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const [allDepartments, setAllDepartments] = useState<string[]>([]);
  const [citiesByDept, setCitiesByDept] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (zoneToEdit) {
      setName(zoneToEdit.name || "");
      setDescription(zoneToEdit.description || "");
      setCompleteDepartments(zoneToEdit.departments || []);
      setPointCities(zoneToEdit.cities || []);
      setActive(zoneToEdit.active !== undefined ? zoneToEdit.active : true);
    } else {
      setName("");
      setDescription("");
      setCompleteDepartments([]);
      setPointCities([]);
      setActive(true);
    }
    setExpandedDept(null);
    setSearchTerm("");
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

    fetch("/api/cities")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const rows = (json?.data || []) as { department: string; city: string }[];
        const grouped: Record<string, string[]> = {};
        for (const row of rows) {
          if (!row.department || !row.city) continue;
          if (!grouped[row.department]) grouped[row.department] = [];
          if (!grouped[row.department].includes(row.city)) {
            grouped[row.department].push(row.city);
          }
        }
        for (const key of Object.keys(grouped)) {
          grouped[key].sort((a, b) => a.localeCompare(b));
        }
        if (!cancelled) setCitiesByDept(grouped);
      })
      .catch(() => {
        if (!cancelled) setCitiesByDept({});
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const citiesOf = (dept: string): string[] => citiesByDept[dept] || [];

  const pointCitiesOf = (dept: string): string[] =>
    pointCities.filter((c) => c.department === dept).map((c) => c.city);

  type DeptState = "checked" | "partial" | "empty";
  const deptState = (dept: string): DeptState => {
    if (completeDepartments.includes(dept)) return "checked";
    if (pointCitiesOf(dept).length > 0) return "partial";
    return "empty";
  };

  const handleToggleDepartment = (dept: string) => {
    const state = deptState(dept);
    let nextDepts = [...completeDepartments];
    let nextPoints = [...pointCities];

    if (state === "checked") {
      // Uncheck: clear the whole department (remove cities too)
      nextDepts = nextDepts.filter((d) => d !== dept);
      nextPoints = nextPoints.filter((c) => c.department !== dept);
    } else if (state === "partial") {
      // Gray (partial): clear the whole department
      nextDepts = nextDepts.filter((d) => d !== dept);
      nextPoints = nextPoints.filter((c) => c.department !== dept);
    } else {
      // Mark complete: remove any point cities of this dept
      nextDepts = nextDepts.includes(dept) ? nextDepts : [...nextDepts, dept];
      nextPoints = nextPoints.filter((c) => c.department !== dept);
    }

    setCompleteDepartments(nextDepts);
    setPointCities(nextPoints);
  };

  const handleToggleCity = (dept: string, city: string) => {
    const all = citiesOf(dept);
    const currentPoints = pointCitiesOf(dept);
    const wasSelected = currentPoints.includes(city);

    let nextDepts = completeDepartments.filter((d) => d !== dept);
    let nextPoints = pointCities.filter((c) => c.department !== dept);

    let selectedSet: string[];
    if (completeDepartments.includes(dept)) {
      // Was complete: unselect this one city
      selectedSet = all.filter((c) => c !== city);
    } else {
      selectedSet = wasSelected
        ? currentPoints.filter((c) => c !== city)
        : [...currentPoints, city];
    }

    if (all.length > 0 && all.every((c) => selectedSet.includes(c))) {
      nextDepts = [...nextDepts, dept];
    } else if (selectedSet.length > 0) {
      nextPoints = [
        ...nextPoints,
        ...selectedSet.map((c) => ({ department: dept, city: c })),
      ];
    }

    setCompleteDepartments(nextDepts);
    setPointCities(nextPoints);
  };

  const selectAllDepartments = () => {
    setCompleteDepartments([...allDepartments]);
    setPointCities([]);
  };

  const clearAllDepartments = () => {
    setCompleteDepartments([]);
    setPointCities([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre de la zona es obligatorio");
      return;
    }

    onSave({
      ...(zoneToEdit?.id ? { id: zoneToEdit.id } : {}),
      name: name.trim(),
      description: description.trim(),
      departments: completeDepartments,
      cities: pointCities,
      active,
    });

    onClose();
  };

  return (
    <div id="zone-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
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
                Marca un departamento para cubrir todas sus ciudades, o
                expande y selecciona ciudades puntuales.
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

          {/* Selección de Cobertura */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700">
                Departamentos y Ciudades
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
              Al marcar un departamento quedan cubiertas todas sus ciudades. Al
              desmarcar ciudades puntuales, el departamento queda en cobertura
              parcial.
            </p>

            <div className="relative mb-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar departamento o ciudad..."
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-hidden font-medium"
              />
            </div>

            {allDepartments.length === 0 ? (
              <p className="text-xs italic text-slate-500 p-3">
                No hay departamentos cargados. Verifica que la geografía esté
                sembrada (endpoint /api/states).
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-2xl custom-scrollbar space-y-0.5">
                {allDepartments.map((dept) => {
                  const state = deptState(dept);
                  const cityList = citiesOf(dept);
                  const isExpanded = expandedDept === dept;
                  const selectedCount = pointCitiesOf(dept).length;
                  const q = searchTerm.trim().toLowerCase();

                  const deptMatches = dept.toLowerCase().includes(q);
                  const filteredCities = q
                    ? cityList.filter((c) => c.toLowerCase().includes(q))
                    : cityList;

                  if (q && !deptMatches && filteredCities.length === 0)
                    return null;

                  return (
                    <div key={dept} className="rounded-xl">
                      <div
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          state !== "empty"
                            ? "bg-white border border-slate-200 shadow-2xs"
                            : "hover:bg-white/70 border border-transparent"
                        }`}
                        onClick={() => {
                          setExpandedDept(isExpanded ? null : dept);
                        }}
                      >
                        <span className="text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </span>
                        <input
                          type="checkbox"
                          checked={state === "checked" || state === "partial"}
                          ref={(el) => {
                            if (el) el.indeterminate = state === "partial";
                          }}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleDepartment(dept);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="accent-[#E60012] w-3.5 h-3.5 cursor-pointer"
                        />
                        <span
                          className={`text-xs font-semibold ${
                            state !== "empty"
                              ? "text-slate-900 font-bold"
                              : "text-slate-600"
                          }`}
                        >
                          {dept}
                        </span>
                        {state === "checked" && (
                          <span className="ml-auto text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            TODAS LAS CIUDADES
                          </span>
                        )}
                        {state === "partial" && (
                          <span className="ml-auto text-[10px] font-mono font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            {selectedCount}/{cityList.length} CIUDADES
                          </span>
                        )}
                      </div>

                      {isExpanded && filteredCities.length > 0 && (
                        <div className="pl-9 pr-2 pb-2 pt-1">
                          <div className="max-h-44 overflow-y-auto custom-scrollbar space-y-1">
                            {filteredCities.map((city) => {
                              const isSelected =
                                state === "checked" ||
                                pointCitiesOf(dept).includes(city);
                              return (
                                <label
                                  key={city}
                                  onClick={(e) => e.stopPropagation()}
                                  className={`w-full flex items-center gap-2.5 px-1 py-1 text-[11px] font-medium transition-colors cursor-pointer rounded-lg ${
                                    isSelected
                                      ? "text-[#E60012] font-bold"
                                      : "text-slate-600 hover:text-slate-900"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleCity(dept, city)}
                                    className="accent-[#E60012] w-3.5 h-3.5 cursor-pointer shrink-0"
                                  />
                                  <span className="truncate">{city}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {isExpanded && filteredCities.length === 0 && (
                        <p className="pl-9 pr-2 pb-2 text-[11px] italic text-slate-400">
                          No hay ciudades que coincidan con "{searchTerm}" para
                          este departamento.
                        </p>
                      )}
                    </div>
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
