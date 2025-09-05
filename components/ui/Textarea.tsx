import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, id, error, className = '', wrapperClassName = '', ...props }) => {
  const baseTextareaClasses = "flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-[13px] text-gray-800 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788] focus-visible:ring-offset-0 focus-visible:border-[#52b788] disabled:cursor-not-allowed disabled:opacity-50";
  const errorClasses = error ? "border-red-500 focus-visible:ring-red-500" : "border-gray-300"; // Error border overrides default

  return (
    <div className={`mb-4 ${wrapperClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <textarea
        id={id}
        className={`${baseTextareaClasses} ${error ? errorClasses : ''} ${className}`}
        rows={3} // Default rows
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};