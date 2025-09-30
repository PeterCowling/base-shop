import * as React from 'react';

export type Currency = 'EUR' | 'USD' | 'GBP';

const Ctx = React.createContext<[Currency, (c: Currency) => void] | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const initial = (typeof window !== 'undefined' && (window as any).__SB_GLOBALS__?.currency) || 'USD';
  const [currency, setCurrency] = React.useState<Currency>(initial);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { currency?: string } | undefined;
      if (detail?.currency && (['USD','EUR','GBP'] as const).includes(detail.currency as any)) {
        setCurrency(detail.currency as Currency);
      }
    };
    window.addEventListener('sb:globals', handler as EventListener);
    return () => window.removeEventListener('sb:globals', handler as EventListener);
  }, []);

  return <Ctx.Provider value={[currency, setCurrency]}>{children}</Ctx.Provider>;
}

export function useCurrency(): [Currency, (c: Currency) => void] {
  const v = React.useContext(Ctx);
  if (!v) throw new Error('useCurrency must be used within CurrencyProvider (storybook mock)');
  return v;
}

