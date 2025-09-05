
import React from 'react';
import { CheckIcon } from './Icon'; // Import the CheckIcon

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
  wrapperClassName?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  id,
  className = '', // This className will be applied to the sr-only input
  labelClassName = 'text-sm text-black font-medium',
  wrapperClassName = 'flex items-center',
  checked,
  onChange,
  disabled,
  ...props
}) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <label htmlFor={checkboxId} className={`${wrapperClassName} cursor-pointer group`}>
      <input
        id={checkboxId}
        type="checkbox"
        className={`sr-only ${className}`} // Hidden actual checkbox for accessibility
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
      <div
        className={`w-5 h-5 flex items-center justify-center rounded border-2 transition-colors duration-150 
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${checked ? 'bg-[#52b788] border-[#47a27a]' : 'bg-white border-gray-400 group-hover:border-gray-500'}
          focus-within:ring-2 focus-within:ring-offset-1 focus-within:ring-[#52b788]`}
        aria-hidden="true" // Visual element
      >
        {checked && <CheckIcon className="w-3.5 h-3.5 text-white" />}
      </div>
      {label && (
        <span className={`ml-2 ${labelClassName} ${disabled ? 'text-gray-400' : ''}`}>
          {label}
        </span>
      )}
    </label>
  );
};
