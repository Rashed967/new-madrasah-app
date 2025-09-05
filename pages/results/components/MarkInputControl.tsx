import React from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { MarkStatus } from '../../../types';

interface MarkInputControlProps {
  value: number | string;
  status: MarkStatus;
  fullMarks: number;
  error?: string;
  onValueChange: (value: string) => void;
  onStatusChange: (status: MarkStatus) => void;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const MarkInputControl = React.forwardRef<HTMLInputElement, MarkInputControlProps>(
  ({ value, status, fullMarks, error, onValueChange, onStatusChange, disabled, onKeyDown, onFocus }, ref) => {
    const isInputDisabled = status !== 'present' || disabled;
    
    const handleStatusClick = (newStatus: MarkStatus) => {
      if (disabled) return;
      onStatusChange(status === newStatus ? 'present' : newStatus);
    };

    return (
      <div className="flex items-center space-x-1">
        <Input
          ref={ref}
          type="number"
          value={isInputDisabled ? '' : value}
          onChange={(e) => {
            onValueChange(e.target.value);
            if (status !== 'present') { onStatusChange('present'); }
          }}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          min="0"
          max={fullMarks}
          className={`h-9 w-24 text-center no-spinners ${error ? 'border-red-500' : ''} ${isInputDisabled ? 'bg-gray-100 placeholder-gray-500' : ''}`}
          wrapperClassName="mb-0"
          error={error}
          placeholder={status === 'absent' ? 'অনুপস্থিত' : status === 'expelled' ? 'বাতিল' : ''}
          disabled={isInputDisabled}
        />
        <Button type="button" variant={status === 'absent' ? 'danger' : 'outline'} size="sm" onClick={() => handleStatusClick('absent')} className="h-9 w-8 p-0 text-xs" title="অনুপস্থিত" disabled={disabled}>A</Button>
        <Button type="button" variant={status === 'expelled' ? 'danger' : 'outline'} size="sm" onClick={() => handleStatusClick('expelled')} className="h-9 w-8 p-0 text-xs" title="বাতিল" disabled={disabled}>E</Button>
      </div>
    );
  }
);
