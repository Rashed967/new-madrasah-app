
import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { PaperClipIcon } from './Icon';

interface FileUploadProps {
  label?: string;
  id: string;
  error?: string;
  onFileChange: (file: File | null) => void;
  acceptedFileTypes?: string; // e.g., "image/png, image/jpeg"
  fileNameDisplay?: string;
  buttonText?: string;
  wrapperClassName?: string;
  required?: boolean;
  disabled?: boolean; // Added disabled prop
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  id,
  error,
  onFileChange,
  acceptedFileTypes,
  fileNameDisplay,
  buttonText = 'ফাইল নির্বাচন করুন',
  wrapperClassName = '',
  required,
  disabled = false, // Default to false
}) => {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(fileNameDisplay || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = event.target.files?.[0] || null;
    setSelectedFileName(file ? file.name : null);
    onFileChange(file);
  };

  const handleButtonClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const baseWrapperClasses = "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md transition-colors";
  const errorClasses = error ? "border-red-500" : "border-gray-300 hover:border-gray-400";
  const bgClasses = disabled ? "bg-gray-100 cursor-not-allowed" : "bg-gray-50";


  return (
    <div className={`mb-4 ${wrapperClassName} ${disabled ? 'opacity-70' : ''}`}>
      {label && <label htmlFor={`${id}-button`} className={`block text-sm font-medium text-gray-700 mb-1 ${disabled ? 'text-gray-400' : ''}`}>{label} {required && <span className="text-red-500">*</span>}</label>}
      <div className={`${baseWrapperClasses} ${errorClasses} ${bgClasses}`}>
        <input
          type="file"
          id={id}
          ref={fileInputRef}
          className="hidden"
          accept={acceptedFileTypes}
          onChange={handleFileChange}
          required={required}
          disabled={disabled} // Apply disabled to input
        />
        <PaperClipIcon className={`w-6 h-6 mb-2 ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
        <Button
          type="button"
          id={`${id}-button`}
          variant="outline"
          size="sm"
          onClick={handleButtonClick}
          className="mb-2"
          disabled={disabled} // Apply disabled to button
        >
          {buttonText}
        </Button>
        {selectedFileName ? (
          <p className={`text-xs ${disabled ? 'text-gray-500' : 'text-gray-700'}`}>নির্বাচিত ফাইল: <span className="font-medium">{selectedFileName}</span></p>
        ) : (
          <p className={`text-xs ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>কোনো ফাইল নির্বাচন করা হয়নি</p>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};