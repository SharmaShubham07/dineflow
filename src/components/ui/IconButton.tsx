import React from 'react';
import { cn } from '@/lib/utils';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = 'md', variant = 'ghost', children, ...props }, ref) => {
    const sizes = {
      sm: 'h-8 w-8 min-w-[32px] p-1.5 rounded-lg',
      md: 'h-11 w-11 min-w-[44px] p-2.5 rounded-xl',
      lg: 'h-13 w-13 min-w-[52px] p-3 rounded-2xl',
    };

    const variants = {
      primary: 'bg-accent text-white hover:bg-accent-hover',
      secondary:
        'bg-stone-200/80 text-stone-800 hover:bg-stone-300 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700',
      ghost:
        'bg-transparent text-stone-700 hover:bg-stone-200/60 dark:text-stone-300 dark:hover:bg-stone-800/60',
      outline:
        'border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-150 active:scale-95 disabled:opacity-50',
          sizes[size],
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

