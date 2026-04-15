import React from 'react';

interface MinimalToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const MinimalToggle: React.FC<MinimalToggleProps> = ({ label, checked, onChange }) => {
  return (
    <label className="flex items-center justify-between cursor-pointer w-full py-2">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-zinc-900' : 'bg-zinc-200'}`}></div>
        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-4' : ''}`}></div>
      </div>
    </label>
  );
};
