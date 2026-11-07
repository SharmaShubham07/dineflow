import React from 'react';
import { Outlet } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Sparkles, Languages } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

export const CustomerLayout: React.FC = () => {
  const { liteMode, toggleLiteMode, language, toggleLanguage } = useUIStore();

  return (
    <div className="min-h-screen max-w-md mx-auto bg-surface-light dark:bg-surface-dark flex flex-col relative shadow-2xl border-x border-stone-200/40 dark:border-stone-800/40 transition-colors duration-200">
      {/* Top Bar for Customer */}
      <header className="glass-surface sticky top-0 z-30 px-4 py-3 border-b border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-accent text-white font-bold flex items-center justify-center text-sm shadow-sm">
            DF
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-tight">
              DineFlow
            </h2>
            <p className="text-[11px] font-medium text-stone-500">QR Table Ordering</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Hindi / English Switcher */}
          <button
            onClick={toggleLanguage}
            title="Switch Language (English / हिन्दी)"
            className="px-2 py-1 rounded-lg text-xs font-bold border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:border-accent flex items-center gap-1"
          >
            <Languages className="h-3.5 w-3.5 text-accent" />
            <span>{language === 'en' ? 'हिन्दी' : 'EN'}</span>
          </button>

          <ThemeToggle className="scale-90" />
          <button
            onClick={toggleLiteMode}
            title={liteMode ? 'Disable Lite Mode' : 'Enable Lite Mode'}
            className="p-1 text-stone-500 hover:text-accent"
          >
            <Sparkles className={`h-4 w-4 ${liteMode ? 'text-accent' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

