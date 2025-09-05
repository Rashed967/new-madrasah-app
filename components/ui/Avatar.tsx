
import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  fallback?: React.ReactNode; // e.g. initials
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt = 'User Avatar', size = 'md', fallback, className = '' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const fallbackTextSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  return (
    <div className={`relative inline-flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden ${sizeClasses[size]} ${className}`}>
      {src ? (
        <img className="h-full w-full object-cover" src={src} alt={alt} />
      ) : (
        fallback ? (
          <span className={`font-medium text-gray-600 dark:text-gray-300 ${fallbackTextSize[size]}`}>
            {fallback}
          </span>
        ) : (
          <svg className="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )
      )}
    </div>
  );
};
