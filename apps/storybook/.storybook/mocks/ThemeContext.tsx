import React, { createContext, useContext, useMemo, useState } from 'react';

export type Theme = 'base' | 'dark' | 'system' | 'brandx';

interface Ctx {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeCtx = createContext<Ctx | null>(null);

export function ThemeProvider({ children, initial = 'base' as Theme }: { children: React.ReactNode; initial?: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial);
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  // reflect on html class similar to SB tokens switch
  if (typeof document !== 'undefined') {
    const cls = document.documentElement.classList;
    cls.remove('theme-base', 'theme-dark', 'theme-system', 'theme-brandx');
    cls.add(`theme-${theme}`);
  }
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeCtx);
  if (!ctx) return { theme: 'base', setTheme: () => {} };
  return ctx;
}

