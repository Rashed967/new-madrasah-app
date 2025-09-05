
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  title?: string;
  titleClassName?: string;
  bodyClassName?: string;
  footer?: React.ReactNode;
  footerClassName?: string;
}

export const Card: React.FC<CardProps> = ({ 
    children, 
    className = '', 
    title, 
    titleClassName = 'text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200 mb-4',
    bodyClassName = '',
    footer,
    footerClassName = 'pt-4 border-t border-gray-200 mt-4',
    ...props
}) => {
  return (
    <div className={`bg-white shadow-lg rounded-xl ${className}`} {...props}> {/* Removed overflow-hidden */}
      {title && <div className={`p-4 sm:p-6 ${titleClassName}`}>{title}</div>}
      <div className={`p-4 sm:p-6 ${bodyClassName}`}>
        {children}
      </div>
      {footer && <div className={`p-4 sm:p-6 ${footerClassName}`}>{footer}</div>}
    </div>
  );
};