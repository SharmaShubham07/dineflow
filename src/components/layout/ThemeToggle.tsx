import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, Laptop } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-xl p-1 bg-stone-200/70 dark:bg-stone-800/70 border border-stone-300/40 dark:border-stone-700/40',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        title="Light theme"
        className={cn(
          'p-1.5 rounded-lg transition-all',
          theme === 'light'
            ? 'bg-white text-stone-900 shadow-sm'
            : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
        )}
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        title="Dark theme"
        className={cn(
          'p-1.5 rounded-lg transition-all',
          theme === 'dark'
            ? 'bg-stone-900 text-stone-100 shadow-sm'
            : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
        )}
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme('system')}
        title="Follow system"
        className={cn(
          'p-1.5 rounded-lg transition-all',
          theme === 'system'
            ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
            : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
        )}
      >
        <Laptop className="h-4 w-4" />
      </button>
    </div>
  );
};

