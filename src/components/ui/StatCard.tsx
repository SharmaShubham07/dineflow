import React from 'react';
import { GlassCard } from './GlassCard';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  description,
  className,
}) => {
  return (
    <GlassCard variant="flat" className={cn('p-5 flex flex-col justify-between', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
          {label}
        </span>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <h4 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          {value}
        </h4>
        {(trend || description) && (
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            {trend && (
              <span
                className={cn(
                  'font-semibold',
                  trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
            {description && (
              <span className="text-stone-500 dark:text-stone-400">{description}</span>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
};

