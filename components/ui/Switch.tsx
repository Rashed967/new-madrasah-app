import React, { useState, useEffect } from 'react';

interface SwitchProps {
  id?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  defaultChecked?: boolean;
  label?: string;
  labelPosition?: 'left' | 'right';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  srOnlyLabel?: string; // For accessibility if label is not visually present
}

export const Switch: React.FC<SwitchProps> = ({
  id,
  checked: controlledChecked,
  onChange,
  defaultChecked = false,
  label,
  labelPosition = 'right',
  disabled = false,
  size = 'md',
  className = '',
  srOnlyLabel
}) => {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = controlledChecked !== undefined;
  const currentChecked = isControlled ? controlledChecked : internalChecked;

  useEffect(() => {
    if (isControlled && controlledChecked !== undefined) {
      setInternalChecked(controlledChecked);
    }
  }, [controlledChecked, isControlled]);

  const handleToggle = () => {
    if (disabled) return;
    const newCheckedState = !currentChecked;
    if (!isControlled) {
      setInternalChecked(newCheckedState);
    }
    onChange?.(newCheckedState);
  };

  const baseClasses = "relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#52b788]";
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
  
  const sizeClasses = {
    sm: { container: "h-5 w-9", knob: "h-4 w-4", knobTranslate: "translate-x-4" },
    md: { container: "h-6 w-11", knob: "h-5 w-5", knobTranslate: "translate-x-5" },
    lg: { container: "h-7 w-12", knob: "h-6 w-6", knobTranslate: "translate-x-5" },
  };

  const currentSize = sizeClasses[size];

  const knobClasses = `pointer-events-none inline-block ${currentSize.knob} transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`;

  const switchElement = (
    <button
      type="button"
      role="switch"
      aria-checked={currentChecked}
      aria-disabled={disabled}
      aria-label={srOnlyLabel || label}
      onClick={handleToggle}
      id={id}
      className={`${baseClasses} ${currentSize.container} ${disabledClasses} ${currentChecked ? 'bg-[#52b788]' : 'bg-gray-300'} ${className}`}
    >
      <span
        className={`${knobClasses} ${currentChecked ? currentSize.knobTranslate : 'translate-x-0.5'}`}
      />
    </button>
  );

  if (label) {
    return (
      <div className={`flex items-center ${disabled ? 'cursor-not-allowed' : ''}`}>
        {labelPosition === 'left' && <span className={`mr-3 text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}</span>}
        {switchElement}
        {labelPosition === 'right' && <span className={`ml-3 text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}</span>}
      </div>
    );
  }

  return switchElement;
};
