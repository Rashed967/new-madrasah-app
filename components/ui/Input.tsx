import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode; // This is for left icon
  rightIcon?: React.ReactNode; // New prop for right icon
  onRightIconClick?: () => void; // New prop for right icon click handler
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, error, icon, rightIcon, onRightIconClick, className = '', wrapperClassName = '', type, ...props }, ref) => {
    const isDateType = type === 'date'; // Keep this for potential future use, though CustomDatePicker overrides type to text
    const baseInputClasses =
      'flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-[13px] text-black placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788] focus-visible:ring-offset-0 focus-visible:border-[#52b788] disabled:cursor-not-allowed disabled:opacity-50';

    const leftIconPadding = icon && !isDateType ? 'pl-10' : '';
    const rightIconPadding = rightIcon ? 'pr-10' : '';
    const errorClasses = error ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-300';

    return (
      <div className={` ${wrapperClassName}`}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium mb-1 text-black">
            {label}
          </label>
        )}
        <div className="relative">
          {/* Show left icon only if not date type (original logic) */}
          {icon && !isDateType && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref} 
            id={id}
            type={type}
            className={`${baseInputClasses} ${leftIconPadding} ${rightIconPadding} ${errorClasses} ${className}`}
            {...props}
          />
          {/* Right Icon Area */}
          {rightIcon && (
            <div
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              style={onRightIconClick ? { cursor: 'pointer' } : {}}
              onClick={onRightIconClick}
              role={onRightIconClick ? "button" : undefined}
              aria-label={onRightIconClick ? "Open date picker" : undefined} // More specific label if possible
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';