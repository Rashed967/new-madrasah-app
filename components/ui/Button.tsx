import React from 'react';

// Define the props specific to our Button component, making it generic over the element type
type ButtonOwnProps<C extends React.ElementType> = {
  as?: C;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string; // We explicitly include className to use it
};

// Merge our own props with the props of the component being rendered (e.g., button, NavLink).
// We omit our own prop names from the underlying component's props to prevent clashes.
type ButtonProps<C extends React.ElementType> = ButtonOwnProps<C> &
  Omit<React.ComponentPropsWithoutRef<C>, keyof ButtonOwnProps<C>>;

// Use a generic component. C defaults to 'button' if not specified.
// The component is no longer a React.FC but a generic function, which is the standard for polymorphic components.
export const Button = <C extends React.ElementType = 'button'>({
  as,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  leftIcon,
  rightIcon,
  ...props
}: ButtonProps<C>) => {
  const Component = as || 'button';

  const baseStyles = 'font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: `bg-[#52b788] text-white hover:bg-[#47a27a] focus:ring-[#52b788]`,
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    ghost: 'bg-transparent text-[#52b788] hover:bg-emerald-50 focus:ring-[#52b788]',
    outline: 'border border-[#52b788] text-[#52b788] bg-transparent hover:bg-emerald-50 focus:ring-[#52b788]',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <Component
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </Component>
  );
};
