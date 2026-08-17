import React, { useState, useEffect, useMemo } from "react";
import { X, MapPin, Check, Plus, AlertCircle, ChevronDown, ChevronRight, Search } from "lucide-react";
import type { ShippingZone, ShippingZoneDepartment } from "../../types";

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
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");

  // Selector de cobertura
  const [isNational, setIsNational] = useState(false);
  const [selected, setSelected] = useState<ShippingZoneDepartment[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  // Geografía
  const [allDepartments, setAllDepartments] = useState<string[]>([]);
  const [citiesByDept, setCitiesByDept] = useState<Map<string, string[]>>(new Map());

  useEffect(() => {
    if (zoneToEdit) {
      const depts = zoneToEdit.departments || [];
      setName(zoneToEdit.name || "");
      setDescription(zoneToEdit.description || "");
      setActive(zoneToEdit.active !== undefined ? zoneToEdit.active : true);
      setSelected(depts);
      setIsNational(depts.length === 0);
      setExpanded(new Set(depts.filter(d => d.cities.length > 0).map(d => d.name)));
    } else {
      setName("");
      setDescription("");
      setSelected([]);
      setIsNational(false);
      setExpanded(new Set());
      setActive(true);
    }
    setError("");
    setSearch("");
  }, [zoneToEdit, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    Promise.all([
      fetch("/api/states").then(r => r.json()),
      fetch("/api/cities").then(r => r.json())
    ]).then(([statesJson, citiesJson]) => {
      if (cancelled) return;

      const rows = (statesJson?.data || []) as { id: string; name: string }[];
      setAllDepartments(rows.map(s => s.name).sort((a, b) => a.localeCompare(b)));

      const cityRows = (citiesJson?.data || []) as { department: string; city: string }[];
      const map = new Map<string, string[]>();
      for (const r of cityRows) {
        if (!r.department || !r.city) continue;
        const arr = map.get(r.department) || [];
        arr.push(r.city);
        map.set(r.department, arr);
      }
      for (const [k, v] of map) {
        map.set(k, [...new Set(v)].sort((a, b) => a.localeCompare(b)));
      }
      setCitiesByDept(map);
    }).catch(() => {
      if (!cancelled) {
        setAllDepartments([]);
        setCitiesByDept(new Map());
      }
    });

    return () => { cancelled = true; };
  }, [isOpen]);

  const filteredDepartments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allDepartments;
    return allDepartments.filter(dept => {
      if (dept.toLowerCase().includes(q)) return true;
      const cities = citiesByDept.get(dept) || [];
      return cities.some(c => c.toLowerCase().includes(q));
    });
  }, [allDepartments, citiesByDept, search]);

  if (!isOpen) return null;

  const entryFor = (deptName: string) => selected.find(s => s.name === deptName);

  const isWhole = (deptName: string) => {
    const e = entryFor(deptName);
    return Boolean(e) && e!.cities.length === 0;
  };

  const selectedCities = (deptName: string) => entryFor(deptName)?.cities || [];

  const toggleNational = (val: boolean) => {
    setIsNational(val);
    if (val) setSelected([]);
  };

  const toggleDept = (deptName: string) => {
    setIsNational(false);
    setSelected(prev => {
      const existing = prev.find(s => s.name === deptName);
      if (existing) return prev.filter(s => s.name !== deptName);
      return [...prev, { name: deptName, cities: [] }];
    });
  };

  const toggleCity = (deptName: string, cityName: string, allCityNames: string[]) => {
    setIsNational(false);
    setSelected(prev => {
      const existing = prev.find(s => s.name === deptName);
      const current = existing ? existing.cities : [];
      const nextCities = current.includes(cityName)
        ? current.filter(c => c !== cityName)
        : [...current, cityName];

      if (nextCities.length === 0) return prev.filter(s => s.name !== deptName);
      if (nextCities.length === allCityNames.length) {
        return prev.map(s => (s.name === deptName ? { ...s, cities: [] } : s));
      }
      if (existing) return prev.map(s => (s.name === deptName ? { ...s, cities: nextCities } : s));
      return [...prev, { name: deptName, cities: nextCities }];
    });
  };

  const toggleExpand = (deptName: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(deptName)) next.delete(deptName);
      else next.add(deptName);
      return next;
    });
  };

  const selectedDeptCount = selected.filter(d => d.cities.length === 0).length;
  const selectedCityCount = selected.reduce((acc, d) => acc + d.cities.length, 0);

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre de la zona es obligatorio");
      return;
    }
    if (!isNational && selected.length === 0) {
      setError("Selecciona al menos un departamento o ciudad, o marca 'Cobertura nacional'.");
      return;
    }

    onSave({
      ...(zoneToEdit?.id ? { id: zoneToEdit.id } : {}),
      name: name.trim(),
      description: description.trim(),
      departments: isNational ? [] : selected,
      active,
    });

    onClose();
  };

  return (
    <div id="zone-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E60012] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 font-display">
                {zoneToEdit ? "Editar Zona de Envío" : "Nueva Zona de Envío"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Configura los departamentos y ciudades asignados a esta zona tarifaria.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
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
                Departamentos Incluidos
              </label>
              <div className="flex items-center gap-3 text-[11px] font-mono font-bold text-slate-500">
                <span>{selectedDeptCount} depto(s) completos</span>
                <span>•</span>
                <span>{selectedCityCount} ciudad(es) puntuales</span>
              </div>
            </div>

            {/* Cobertura nacional (catch-all) */}
            <label className={`flex items-center gap-3 p-3 rounded-2xl border mb-3 cursor-pointer transition-all ${isNational ? "bg-red-50 border-red-200" : "bg-white border-slate-200 hover:border-slate-300"}`}>
              <input
                type="checkbox"
                checked={isNational}
                onChange={(e) => toggleNational(e.target.checked)}
                className="w-4 h-4 text-[#E60012] focus:ring-[#E60012] rounded"
              />
              <div className="flex-1">
                <span className="block text-xs font-black text-slate-900">
                  Cobertura nacional (todo el país)
                </span>
                <span className="block text-[11px] text-slate-500">
                  Esta zona cubrirá todos los departamentos y ciudades de Colombia. Desmarca para seleccionar cobertura específica.
                </span>
              </div>
            </label>

            {/* Buscador */}
            {!isNational && (
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar departamento o ciudad..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-hidden font-medium"
                />
              </div>
            )}

            {!isNational ? (
              allDepartments.length === 0 ? (
                <p className="text-xs italic text-slate-500 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  No hay departamentos cargados. Verifica que la geografía esté sembrada (endpoints /api/states y /api/cities).
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 custom-scrollbar">
                  {filteredDepartments.length === 0 && (
                    <p className="text-xs italic text-slate-500 p-3">
                      Sin resultados para "{search}".
                    </p>
                  )}
                  {filteredDepartments.map((dept) => {
                    const cities = citiesByDept.get(dept) || [];
                    const entry = entryFor(dept);
                    const whole = isWhole(dept);
                    const partial = Boolean(entry && entry.cities.length > 0);
                    const checked = whole || partial;
                    const isExpanded = expanded.has(dept);
                    const hasCities = cities.length > 0;

                    return (
                      <div key={dept} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="flex items-center gap-2 px-2.5 py-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            ref={(el) => { if (el) el.indeterminate = partial; }}
                            onChange={() => toggleDept(dept)}
                            className="w-4 h-4 text-[#E60012] focus:ring-[#E60012] rounded shrink-0"
                          />
                          <span className={`text-xs font-semibold flex-1 truncate ${checked ? "text-slate-900" : "text-slate-600"}`}>
                            {dept}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                            {whole ? `${cities.length} ciudades` : partial ? `${entry!.cities.length}/${cities.length}` : `${cities.length} ciudades`}
                          </span>
                          {hasCities && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(dept)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all shrink-0 cursor-pointer"
                              title={isExpanded ? "Contraer ciudades" : "Desplegar ciudades"}
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          )}
                        </div>

                        {isExpanded && hasCities && (
                          <div className="px-3 pb-2.5 pt-1 bg-slate-50/70 border-t border-slate-100">
                            <div className="flex flex-wrap gap-1.5">
                              {cities.map((cityName) => {
                                const cityChecked = whole || selectedCities(dept).includes(cityName);
                                return (
                                  <label
                                    key={cityName}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-all ${cityChecked ? "bg-red-50 text-[#E60012] border-red-200" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={cityChecked}
                                      disabled={whole}
                                      onChange={() => toggleCity(dept, cityName, cities)}
                                      className="w-3.5 h-3.5 text-[#E60012] focus:ring-[#E60012] rounded"
                                    />
                                    {cityName}
                                  </label>
                                );
                              })}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1.5">
                              {whole
                                ? "Departamento completo: todas sus ciudades están cubiertas."
                                : "Marca solo las ciudades puntuales que deseas incluir."}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                Zona con <strong className="text-slate-700">cobertura nacional</strong>. Todos los departamentos y ciudades quedan incluidos.
              </p>
            )}
          </div>

          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/70 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#E60012] hover:bg-red-700 active:bg-[#900008] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Zona</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};