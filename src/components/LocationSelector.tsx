import React, { useMemo } from 'react';
import { Globe, MapPin, Building } from 'lucide-react';
import type { CityRecord } from '../types';

interface LocationSelectorProps {
  country: string;
  department: string;
  city: string;
  citiesList: CityRecord[];
  onChange: (location: { country: string; department: string; city: string }) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  country,
  department,
  city,
  citiesList,
  onChange,
  required = true,
  disabled = false,
  className = ''
}) => {
  // Helper to match country by name or code ('CO' vs 'Colombia')
  const matchCountry = (c: CityRecord, val: string) => {
    if (!val) return true;
    return c.country === val || c.countryId === val || (val === 'CO' && c.country === 'Colombia');
  };

  // Helper to match department by name or code ('11' vs 'Bogotá D.C.')
  const matchDepartment = (c: CityRecord, val: string) => {
    if (!val) return true;
    return c.department === val || c.stateId === val;
  };

  // 1. List of Countries — derived from citiesList
  const countryOptions = useMemo(() => {
    const countriesFromDb = citiesList.map(c => c.country).filter(Boolean);
    return Array.from(new Set(countriesFromDb)).sort((a, b) => a.localeCompare(b));
  }, [citiesList]);

  // Current selected country (resolve code to name if needed)
  const resolvedCountry = useMemo(() => {
    if (!country) return countryOptions[0] || 'Colombia';
    const match = citiesList.find(c => matchCountry(c, country));
    return match ? match.country : (countryOptions[0] || country);
  }, [citiesList, country, countryOptions]);

  // 2. Filter Departments for selected country
  const departmentOptions = useMemo(() => {
    const filtered = citiesList.filter(c => matchCountry(c, resolvedCountry));
    const depts = Array.from(new Set(filtered.map(c => c.department))).filter(Boolean);
    return depts.sort((a, b) => a.localeCompare(b));
  }, [citiesList, resolvedCountry]);

  // Resolved department name (if passed a code like '11', resolve to 'Bogotá D.C.')
  const resolvedDepartment = useMemo(() => {
    if (!department) return '';
    const match = citiesList.find(c => matchCountry(c, resolvedCountry) && matchDepartment(c, department));
    return match ? match.department : department;
  }, [citiesList, resolvedCountry, department]);

  // 3. Filter Cities for selected country & department
  const cityOptions = useMemo(() => {
    const filtered = citiesList.filter(
      c => matchCountry(c, resolvedCountry) && matchDepartment(c, resolvedDepartment)
    );
    const cities = Array.from(new Set(filtered.map(c => c.city))).filter(Boolean);
    return cities.sort((a, b) => a.localeCompare(b));
  }, [citiesList, resolvedCountry, resolvedDepartment]);

  // Resolved city name (if passed a code like '11001', resolve to 'Bogotá D.C.')
  const resolvedCity = useMemo(() => {
    if (!city) return '';
    const match = citiesList.find(
      c => matchCountry(c, resolvedCountry) && matchDepartment(c, resolvedDepartment) && (c.city === city || c.id === city || c.code === city)
    );
    return match ? match.city : city;
  }, [citiesList, resolvedCountry, resolvedDepartment, city]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    const firstMatch = citiesList.find(c => matchCountry(c, newCountry));
    onChange({
      country: newCountry,
      department: firstMatch?.department || '',
      city: firstMatch?.city || ''
    });
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const newDept = e.target.value;
    const firstCityMatch = citiesList.find(
      c => matchCountry(c, resolvedCountry) && matchDepartment(c, newDept)
    );
    const newCity = firstCityMatch?.city || '';

    onChange({
      country: resolvedCountry,
      department: newDept,
      city: newCity
    });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCity = e.target.value;
    const match = citiesList.find(
      c => matchCountry(c, resolvedCountry) && matchDepartment(c, resolvedDepartment) && c.city === newCity
    );
    onChange({
      country: resolvedCountry,
      department: match?.department || resolvedDepartment,
      city: newCity
    });
  };

  const isCountryDisabled = disabled || countryOptions.length <= 1;
  const isCityDisabled = disabled || !resolvedDepartment || cityOptions.length === 0;
  const cityPlaceholder = !resolvedDepartment
    ? 'Selecciona un departamento primero'
    : cityOptions.length === 0
      ? 'No hay ciudades registradas'
      : 'Selecciona Ciudad...';

  return (
    <div id="location-selector" className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${className}`}>
      
      {/* 1. Selección de País */}
      <div>
        <label htmlFor="country" className="block text-xs font-bold uppercase text-slate-700 mb-1 font-mono">
          País {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            id="country"
            name="country"
            required={required}
            disabled={isCountryDisabled}
            value={resolvedCountry}
            onChange={handleCountryChange}
            className={`w-full pl-10 pr-8 py-2.5 rounded-xl text-sm font-semibold transition-all appearance-none ${
              isCountryDisabled
                ? 'bg-slate-100 border border-slate-200 text-slate-600 cursor-not-allowed shadow-none'
                : 'bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012] cursor-pointer'
            }`}
          >
            {countryOptions.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {!isCountryDisabled && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
          )}
        </div>
      </div>

      {/* 2. Selección de Departamento / Estado */}
      <div>
        <label htmlFor="department" className="block text-xs font-bold uppercase text-slate-700 mb-1 font-mono">
          Departamento / Estado {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          {departmentOptions.length > 0 ? (
            <>
              <select
                id="department"
                name="department"
                required={required}
                disabled={disabled}
                value={resolvedDepartment}
                onChange={handleDepartmentChange}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012] appearance-none cursor-pointer"
              >
                <option value="" disabled>Selecciona Departamento...</option>
                {departmentOptions.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
            </>
          ) : (
            <input
              id="department"
              name="department"
              type="text"
              required={required}
              disabled={disabled}
              value={resolvedDepartment}
              onChange={handleDepartmentChange}
              placeholder="Ej. Cundinamarca o Provincia"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
            />
          )}
        </div>
      </div>

      {/* 3. Selección de Ciudad / Municipio */}
      <div>
        <label htmlFor="city" className="block text-xs font-bold uppercase text-slate-700 mb-1 font-mono">
          Ciudad / Municipio {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            id="city"
            name="city"
            required={required}
            disabled={isCityDisabled}
            value={resolvedCity}
            onChange={handleCityChange}
            className={`w-full pl-10 pr-8 py-2.5 rounded-xl text-sm font-medium transition-all appearance-none ${
              isCityDisabled
                ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012] cursor-pointer'
            }`}
          >
            <option value="" disabled>{cityPlaceholder}</option>
            {cityOptions.map(cityName => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
          {!isCityDisabled && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
          )}
        </div>
      </div>

    </div>
  );
};
