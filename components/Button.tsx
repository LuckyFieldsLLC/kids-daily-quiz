import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const base = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

const variantStyles: Record<string, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
  secondary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-blue-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  ghost: 'text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-400',
  subtle: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-400'
};

const sizeStyles: Record<string, string> = {
  sm: 'text-xs px-2 py-1 h-7 gap-1',
  md: 'text-sm px-3 py-2 h-9 gap-2',
  lg: 'text-base px-4 py-2.5 h-11 gap-2'
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loading,
  fullWidth,
  className,
  children,
  disabled,
  ...rest
}) => {
  return (
    <button
      className={clsx(
        base,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        loading && 'relative text-transparent',
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {leftIcon && <span className="shrink-0" aria-hidden>{leftIcon}</span>}
      <span className="inline-flex items-center">{children}</span>
      {rightIcon && <span className="shrink-0" aria-hidden>{rightIcon}</span>}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
        </span>
      )}
    </button>
  );
};

export default Button;
