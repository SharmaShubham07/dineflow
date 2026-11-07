import React from 'react';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'flat' | 'raised' | 'interactive';
  children: React.ReactNode;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'flat', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'glass-surface rounded-glass-md p-5 transition-all duration-200',
          variant === 'raised' && 'shadow-glass-hover border-white/50 dark:border-white/10',
          variant === 'interactive' &&
            'cursor-pointer active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-glass-hover',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

