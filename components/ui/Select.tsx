import React from 'react';
import { SelectOption } from '../../types'; 

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  wrapperClassName?: string;
  placeholderOption?: string; 
}

export const Select: React.FC<SelectProps> = ({
  label,
  id,
  error,
  options,
  className = '',
  wrapperClassName = '',
  placeholderOption,
  ...props
}) => {
  const baseSelectClasses = "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
  const errorClasses = error ? "border-red-500 focus-visible:ring-red-500" : "border-gray-300";

  return (
    <div className={`mb-4 ${wrapperClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select
        id={id}
        className={`${baseSelectClasses} ${errorClasses} ${className}`}
        {...props}
      >
        {placeholderOption && <option value="">{placeholderOption}</option>}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};