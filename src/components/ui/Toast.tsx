import React from 'react';
import { useToastStore, ToastItem } from './ToastStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-4">
      {toasts.map((t) => (
        <ToastMessage key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
};

const ToastMessage: React.FC<{ toast: ToastItem; onClose: () => void }> = ({
  toast,
  onClose,
}) => {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-500 shrink-0" />,
  };

  const type = toast.type || 'info';

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-200 animate-slideUp',
        'bg-white/90 dark:bg-stone-900/90 text-stone-900 dark:text-stone-100 border-stone-200/80 dark:border-stone-800'
      )}
    >
      <div className="flex items-center gap-3">
        {icons[type]}
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-md"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

