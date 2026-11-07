import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'bottom' | 'right';
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'bottom',
  className,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed z-50 glass-surface bg-surface-light dark:bg-stone-900 p-6 shadow-2xl transition-transform duration-300',
          position === 'bottom' &&
            'inset-x-0 bottom-0 rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slideUp',
          position === 'right' &&
            'inset-y-0 right-0 w-full max-w-md h-full rounded-l-3xl overflow-y-auto',
          className
        )}
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-200/60 dark:border-stone-800">
          {title ? (
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              {title}
            </h3>
          ) : (
            <div />
          )}
          <IconButton size="sm" onClick={onClose} aria-label="Close drawer">
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
};

