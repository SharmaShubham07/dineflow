import { create } from 'zustand';
import { Language } from '@/lib/i18n';

type ThemeMode = 'light' | 'dark' | 'system';

interface UIState {
  theme: ThemeMode;
  liteMode: boolean;
  language: Language;
  sidebarCollapsed: boolean;
  setTheme: (theme: ThemeMode) => void;
  setLiteMode: (lite: boolean) => void;
  toggleLiteMode: () => void;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

// Low-spec hardware detection helper
function detectLowEndDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as any;
  const memory = nav?.deviceMemory;
  const cores = nav?.hardwareConcurrency;
  if ((memory && memory <= 2) || (cores && cores <= 4)) {
    return true;
  }
  return false;
}

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system';
  const saved = localStorage.getItem('dineflow_theme') as ThemeMode;
  return saved || 'system';
};

const getInitialLiteMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('dineflow_litemode');
  if (saved !== null) return saved === 'true';
  return detectLowEndDevice();
};

export const useUIStore = create<UIState>((set) => ({
  theme: getInitialTheme(),
  liteMode: getInitialLiteMode(),
  language: (localStorage.getItem('dineflow_lang') as Language) || 'en',
  sidebarCollapsed: false,

  setTheme: (theme) => {
    localStorage.setItem('dineflow_theme', theme);
    set({ theme });
  },

  setLiteMode: (liteMode) => {
    localStorage.setItem('dineflow_litemode', String(liteMode));
    set({ liteMode });
  },

  toggleLiteMode: () =>
    set((state) => {
      const next = !state.liteMode;
      localStorage.setItem('dineflow_litemode', String(next));
      return { liteMode: next };
    }),

  setLanguage: (language) => {
    localStorage.setItem('dineflow_lang', language);
    set({ language });
  },

  toggleLanguage: () =>
    set((state) => {
      const next: Language = state.language === 'en' ? 'hi' : 'en';
      localStorage.setItem('dineflow_lang', next);
      return { language: next };
    }),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
}));

