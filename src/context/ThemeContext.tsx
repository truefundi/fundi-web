'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = 'fundi-theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const storedMode = window.localStorage.getItem(STORAGE_KEY);
    const initialMode = isThemeMode(storedMode) ? storedMode : 'system';
    setMode(initialMode);
    applyTheme(initialMode);
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;

    window.localStorage.setItem(STORAGE_KEY, mode);
    applyTheme(mode);

    if (mode !== 'system') return;

    const preference = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');
    preference.addEventListener('change', handleChange);
    return () => preference.removeEventListener('change', handleChange);
  }, [initialized, mode]);

  const value = useMemo(() => ({ mode, setMode }), [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
