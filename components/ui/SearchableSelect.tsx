import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Input } from './Input';
import { ChevronDownIcon, ChevronUpIcon, XMarkIcon } from './Icon';

export interface SearchableSelectOption {
  value: string;
  label: string;
  code?: number | string; // Added code property
  [key: string]: any;
}

interface SearchableSelectProps {
  id: string;
  label?: string;
  options: SearchableSelectOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  onInputChange?: (value: string) => void; // For free text
  allowFreeText?: boolean;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  wrapperClassName?: string;
  required?: boolean;
  buttonClassName?: string; // New prop for custom button classes
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  label,
  options,
  value,
  onChange,
  onInputChange,
  allowFreeText = false,
  placeholder = 'নির্বাচন করুন...',
  disabled = false,
  error,
  wrapperClassName = '',
  required,
  buttonClassName = 'h-10', // Default height
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const selectedOptionLabel = useMemo(() => {
    const selectedOption = options.find(opt => opt.value === value);
    if (selectedOption) {
      return selectedOption.label;
    }
    return allowFreeText ? value : '';
  }, [options, value, allowFreeText]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) {
      return options;
    }
    const term = searchTerm.toLowerCase();
    return options.filter(option =>
      option.label.toLowerCase().includes(term) ||
      (option.code && option.code.toString().toLowerCase().includes(term)) // Search by code
    );
  }, [options, searchTerm]);
  
  // Effect to calculate dropdown position
  useEffect(() => {
    const calculatePosition = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownStyle({
          position: 'fixed',
          top: `${rect.bottom + 4}px`, // 4px gap
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          zIndex: 60, // Higher z-index to be above modals (z-50)
        });
      }
    };
    calculatePosition(); // Calculate on open

    if (isOpen) {
      window.addEventListener('resize', calculatePosition);
      window.addEventListener('scroll', calculatePosition, true); // Use capture to listen to all scroll events
    }
    
    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [isOpen]);

  // Effect for closing on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside the main component wrapper
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        // Also check if the click is outside the portal dropdown
        const portalNode = document.getElementById(`searchable-select-portal-${id}`);
        if (!portalNode || !portalNode.contains(event.target as Node)) {
             setIsOpen(false);
             if (allowFreeText) {
                setSearchTerm(selectedOptionLabel || '');
             } else {
                setSearchTerm('');
             }
        }
      }
    };
    if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, id, allowFreeText, selectedOptionLabel]);

  const handleSelectOption = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
    setIsOpen(false);
  };

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen(prev => !prev);
    if (!isOpen) {
        if (allowFreeText) {
            setSearchTerm(selectedOptionLabel || '');
        }
        setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    if (allowFreeText && onInputChange) {
      onInputChange(newSearchTerm);
    }
  }

  const dropdownContent = (
     <div id={`searchable-select-portal-${id}`} style={dropdownStyle} className="bg-white shadow-2xl border border-gray-200 rounded-md max-h-60 overflow-hidden flex flex-col">
        <div className="p-2 border-b">
          <Input
            ref={inputRef}
            type="text"
            placeholder="অনুসন্ধান করুন..."
            value={searchTerm}
            onChange={handleSearchChange}
            wrapperClassName="mb-0"
            className="h-9 text-xs"
            autoFocus
          />
        </div>
        <ul className="overflow-y-auto flex-grow" tabIndex={-1} role="listbox">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <li
                key={option.value}
                onClick={() => handleSelectOption(option.value)}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-emerald-50
                  ${option.value === value ? 'bg-emerald-100 text-emerald-700 font-semibold' : 'text-gray-900'}
                `}
                role="option"
                aria-selected={option.value === value}
              >
                {option.label}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-gray-500 text-center">কোনো ফলাফল পাওয়া যায়নি।</li>
          )}
        </ul>
      </div>
  );

  return (
    <div className={`mb-4 ${wrapperClassName}`} ref={wrapperRef}>
      {label && (
        <label htmlFor={`${id}-button`} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          id={`${id}-button`}
          onClick={toggleOpen}
          disabled={disabled}
          className={`flex items-center justify-between w-full px-3 py-2 text-left text-[13px] bg-white border rounded-md shadow-sm
            ${buttonClassName}
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'}
          `}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={`truncate ${value ? 'text-gray-900' : 'text-gray-500'}`}>
            {selectedOptionLabel || placeholder}
          </span>
          <div className="flex items-center">
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="mr-1 p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                aria-label="নির্বাচন মুছুন"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            )}
            {isOpen ? <ChevronUpIcon className="w-4 h-4 text-gray-500" /> : <ChevronDownIcon className="w-4 h-4 text-gray-500" />}
          </div>
        </button>

        {isOpen && !disabled && createPortal(dropdownContent, document.body)}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};
