import React from 'react';

interface MinimalSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
}

export const MinimalSlider: React.FC<MinimalSliderProps> = ({ label, value, min, max, step = 0.1, onChange }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-zinc-700">{label}</label>
        <span className="text-xs text-zinc-500 font-mono">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
      />
    </div>
  );
};
