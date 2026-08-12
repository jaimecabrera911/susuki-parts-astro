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
  // 1. List of Countries — derived purely from the data (no hardcoded country)
  const countryOptions = useMemo(() => {
    const countriesFromDb = citiesList.map(c => c.country).filter(Boolean);
    return Array.from(new Set(countriesFromDb)).sort((a, b) => a.localeCompare(b));
  }, [citiesList]);

  // Current selected country (fallback to the first country present in the data)
  const defaultCountry = countryOptions[0] || '';
  const currentCountry = country || defaultCountry;

  // 2. Filter Departments for selected country
  const departmentOptions = useMemo(() => {
    const filtered = citiesList.filter(
      c => (c.country || '') === currentCountry
    );
    const depts = Array.from(new Set(filtered.map(c => c.department))).filter(Boolean);
    return depts.sort((a, b) => a.localeCompare(b));
  }, [citiesList, currentCountry]);

  // 3. Filter Cities for selected country & department
  const cityOptions = useMemo(() => {
    const filtered = citiesList.filter(
      c =>
        (c.country || '') === currentCountry &&
        (c.department || '') === (department || '')
    );
    const cities = Array.from(new Set(filtered.map(c => c.city))).filter(Boolean);
    return cities.sort((a, b) => a.localeCompare(b));
  }, [citiesList, currentCountry, department]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    const firstMatch = citiesList.find(c => (c.country || '') === newCountry);
    onChange({
      country: newCountry,
      department: firstMatch?.department || '',
      city: firstMatch?.city || ''
    });
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const newDept = e.target.value;
    const firstCityMatch = citiesList.find(
      c =>
        (c.country || '') === currentCountry &&
        c.department === newDept
    );
    const newCity = firstCityMatch?.city || '';

    onChange({
      country: currentCountry,
      department: newDept,
      city: newCity
    });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCity = e.target.value;
    const match = citiesList.find(
      c =>
        (c.country || '') === currentCountry &&
        c.city === newCity
    );
    onChange({
      country: currentCountry,
      department: match?.department || department,
      city: newCity
    });
  };

  const isCountryDisabled = disabled || countryOptions.length <= 1;

  // City is a reactive select gated on the selected department
  const isCityDisabled = disabled || !department || cityOptions.length === 0;
  const cityPlaceholder = !department
    ? 'Selecciona un departamento primero'
    : cityOptions.length === 0
      ? 'No hay ciudades registradas'
      : 'Selecciona Ciudad...';

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${className}`}>
      
      {/* 1. Selección de País */}
      <div>
        <label htmlFor="country" className="block text-xs font-bold uppercase text-slate-700 mb-1">
          País {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            id="country"
            name="country"
            required={required}
            disabled={isCountryDisabled}
            value={currentCountry}
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
        <label htmlFor="department" className="block text-xs font-bold uppercase text-slate-700 mb-1">
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
                value={department}
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
              value={department}
              onChange={handleDepartmentChange}
              placeholder="Ej. Cundinamarca o Provincia"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
            />
          )}
        </div>
      </div>

      {/* 3. Selección de Ciudad / Municipio (select reactivo bloqueado sin departamento) */}
      <div>
        <label htmlFor="city" className="block text-xs font-bold uppercase text-slate-700 mb-1">
          Ciudad / Municipio {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            id="city"
            name="city"
            required={required}
            disabled={isCityDisabled}
            value={city}
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
