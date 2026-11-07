import React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}) => {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-3 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={cn(
            'block h-6 w-11 rounded-full transition-colors duration-200',
            checked ? 'bg-accent' : 'bg-stone-300 dark:bg-stone-700'
          )}
        />
        <div
          className={cn(
            'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 shadow-sm',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </div>
      {label && (
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
          {label}
        </span>
      )}
    </label>
  );
};

