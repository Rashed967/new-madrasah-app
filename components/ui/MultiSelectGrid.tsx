
import React from 'react';
import { DistrictOption } from '../../types'; // Assuming DistrictOption is defined in types.ts

interface MultiSelectGridProps {
  options: DistrictOption[];
  selectedValues: string[];
  onChange: (newSelectedValues: string[]) => void;
  label?: string;
  error?: string;
  wrapperClassName?: string;
  gridCols?: number; // Number of columns, e.g., 3
  visibleRows?: number; // Number of rows visible before scrolling, e.g., 4
  itemHeight?: number; // Approximate height of each item in px for max-height calculation
  required?: boolean;
}

export const MultiSelectGrid: React.FC<MultiSelectGridProps> = ({
  options,
  selectedValues,
  onChange,
  label,
  error,
  wrapperClassName = '',
  gridCols = 3,
  visibleRows = 4,
  itemHeight = 40, // Adjust based on item padding and font size
  required,
}) => {
  const handleToggle = (value: string) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newSelectedValues);
  };

  const maxHeight = visibleRows * itemHeight + (visibleRows -1) * 4; // 4px for gap-1

  return (
    <div className={`mb-4 ${wrapperClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div
        className={`grid gap-2 p-3 border rounded-md bg-white shadow-sm`}
        style={{ 
            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
            maxHeight: `${maxHeight}px`,
            overflowY: 'auto'
        }}
      >
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            onClick={() => handleToggle(option.value)}
            className={`p-2 border rounded-md text-sm text-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#52b788]
              ${
                selectedValues.includes(option.value)
                  ? 'bg-[#52b788] text-white border-[#47a27a] hover:bg-[#47a27a]'
                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
              }`}
            aria-pressed={selectedValues.includes(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};
