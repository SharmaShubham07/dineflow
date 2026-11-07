import React from 'react';
import { cn } from '@/lib/utils';
import { DietType } from '@/types/cafe';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'accent' | 'veg' | 'nonveg' | 'egg';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className,
}) => {
  const isDiet = ['veg', 'nonveg', 'egg'].includes(variant);

  if (isDiet) {
    const diet = variant as DietType;
    const borderColors = {
      veg: 'border-emerald-600',
      nonveg: 'border-rose-600',
      egg: 'border-amber-600',
    };
    const dotColors = {
      veg: 'bg-emerald-600',
      nonveg: 'bg-rose-600',
      egg: 'bg-amber-600',
    };

    return (
      <span
        title={diet.toUpperCase()}
        className={cn(
          'inline-flex items-center justify-center border-2 p-0.5 rounded-sm',
          borderColors[diet],
          size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
          className
        )}
      >
        <span
          className={cn(
            'rounded-full',
            dotColors[diet],
            size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'
          )}
        />
      </span>
    );
  }

  const variants = {
    neutral: 'bg-stone-200/80 text-stone-800 dark:bg-stone-800 dark:text-stone-300',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    error: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
    accent: 'bg-accent/15 text-accent font-medium',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full capitalize',
        variants[variant as keyof typeof variants],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};

