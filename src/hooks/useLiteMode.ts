import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

export function useLiteMode() {
  const { liteMode, setLiteMode, toggleLiteMode } = useUIStore();

  useEffect(() => {
    const root = document.documentElement;
    if (liteMode) {
      root.classList.add('lite-mode');
    } else {
      root.classList.remove('lite-mode');
    }
  }, [liteMode]);

  return { liteMode, setLiteMode, toggleLiteMode };
}

