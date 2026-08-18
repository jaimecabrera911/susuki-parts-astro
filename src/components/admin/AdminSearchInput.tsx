import React from 'react';
import { Search } from 'lucide-react';

interface AdminSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export const AdminSearchInput: React.FC<AdminSearchInputProps> = ({ value, onChange, placeholder }) => {
  return (
    <div className="relative flex-1 min-w-[180px] max-w-full">
      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/10 font-medium transition-all"
      />
    </div>
  );
};