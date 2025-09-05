
import React, { useState, useEffect, useRef, useMemo, ChangeEvent, RefObject } from 'react';
import { Input } from './Input'; 
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from './Icon'; 
import { Button } from './Button';

interface CustomDatePickerProps {
  id: string;
  label?: string;
  value?: string; // Expected format: YYYY-MM-DD
  onChange: (dateString: string) => void; // Returns date in YYYY-MM-DD
  error?: string;
  wrapperClassName?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const MONTH_NAMES_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];
const DAY_NAMES_BN_SHORT = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

const formatDateToYyyyMmDd = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseYyyyMmDd = (dateString?: string): Date | null => {
  if (!dateString) return null;
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      const date = new Date(year, month, day);
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date;
      }
    }
  }
  return null;
};


export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  id,
  label,
  value,
  onChange,
  error,
  wrapperClassName = '',
  required,
  disabled,
  placeholder = 'YYYY-MM-DD',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState<Date>(parseYyyyMmDd(value) || new Date());
  const [inputValue, setInputValue] = useState<string>(value || '');

  const pickerWrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value || '');
    const parsedDate = parseYyyyMmDd(value);
    if (parsedDate) {
        setDisplayDate(parsedDate);
    } else {
        setDisplayDate(new Date()); 
    }
  }, [value]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerWrapperRef.current && !pickerWrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDateSelect = (date: Date) => {
    const dateString = formatDateToYyyyMmDd(date);
    setInputValue(dateString);
    onChange(dateString);
    setIsOpen(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const parsed = parseYyyyMmDd(val);
    if (parsed) {
        onChange(formatDateToYyyyMmDd(parsed));
        setDisplayDate(parsed);
    } else if (val === '') { 
        onChange('');
    }
  };

  const handleInputBlur = () => {
    const parsed = parseYyyyMmDd(inputValue);
    if (parsed) {
        const formatted = formatDateToYyyyMmDd(parsed);
        setInputValue(formatted); 
        onChange(formatted);
        setDisplayDate(parsed);
    } else if(inputValue !== '') {
        const originalParsed = parseYyyyMmDd(value);
        if (originalParsed) {
            setInputValue(formatDateToYyyyMmDd(originalParsed));
        } else {
            setInputValue('');
        }
    } else { 
        onChange('');
    }
  };

  const openPicker = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };


  const daysInMonth = useMemo(() => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const date = new Date(year, month, 1);
    const days: { date: Date; isCurrentMonth: boolean; isSelected: boolean }[] = [];
    
    const firstDayOfMonth = date.getDay(); 
    for (let i = 0; i < firstDayOfMonth; i++) {
        const prevMonthDay = new Date(year, month, i - firstDayOfMonth + 1);
        days.push({ date: prevMonthDay, isCurrentMonth: false, isSelected: false });
    }

    while (date.getMonth() === month) {
      const currentDate = new Date(date);
      const isSelected = !!value && formatDateToYyyyMmDd(currentDate) === value;
      days.push({ date: currentDate, isCurrentMonth: true, isSelected });
      date.setDate(date.getDate() + 1);
    }

    const cellsInGrid = days.length % 7 === 0 ? days.length : days.length + (7 - (days.length % 7));
    
    let dayCounter = 1;
    while (days.length < cellsInGrid) {
        const nextMonthDay = new Date(year, month + 1, dayCounter++);
        days.push({ date: nextMonthDay, isCurrentMonth: false, isSelected: false });
    }

    return days;
  }, [displayDate, value]);

  const changeMonth = (amount: number) => {
    setDisplayDate(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
  };
  
  const changeYear = (amount: number) => {
    setDisplayDate(prev => new Date(prev.getFullYear() + amount, prev.getMonth(), 1));
  };

  return (
    <div className={`relative ${wrapperClassName}`} ref={pickerWrapperRef}>
      <Input
        ref={inputRef as RefObject<HTMLInputElement>}
        type="text"
        id={id}
        label={label}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={openPicker}
        placeholder={placeholder}
        error={error}
        required={required}
        disabled={disabled}
        rightIcon={<CalendarDaysIcon className="w-5 h-5 text-gray-500" />}
        onRightIconClick={openPicker}
        wrapperClassName="mb-0"
      />
     
      {isOpen && !disabled && (
        <div className="absolute z-40 mt-1 w-full sm:w-80 rounded-md bg-white shadow-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => changeYear(-1)} aria-label="Previous year" className="p-1">&lt;&lt;</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => changeMonth(-1)} aria-label="Previous month" className="p-1">
              <ChevronLeftIcon className="w-5 h-5" />
            </Button>
            <div className="text-sm font-semibold text-gray-700 text-center">
              {MONTH_NAMES_BN[displayDate.getMonth()]} {displayDate.getFullYear().toLocaleString('bn-BD', { useGrouping: false })}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => changeMonth(1)} aria-label="Next month" className="p-1">
              <ChevronRightIcon className="w-5 h-5" />
            </Button>
             <Button type="button" variant="ghost" size="sm" onClick={() => changeYear(1)} aria-label="Next year" className="p-1">&gt;&gt;</Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-1">
            {DAY_NAMES_BN_SHORT.map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map(({ date, isCurrentMonth, isSelected }, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleDateSelect(date)}
                className={`p-1 text-xs rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#52b788] transition-colors
                  ${isSelected ? 'bg-[#52b788] text-white font-semibold' : 
                   isCurrentMonth ? 'text-gray-700 hover:bg-emerald-50' : 
                   'text-gray-400 hover:bg-gray-100'}`}
              >
                {date.getDate().toLocaleString('bn-BD')}
              </button>
            ))}
          </div>
           <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between">
            <Button type="button" variant="ghost" size="sm" onClick={() => handleDateSelect(new Date())} className="text-xs">
              আজ
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-xs">
              বন্ধ করুন
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
