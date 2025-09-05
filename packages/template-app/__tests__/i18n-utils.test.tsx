/** @jest-environment jsdom */
import { render, screen, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import {
  TranslationsProvider,
  useTranslations,
  assertLocales,
  resolveLocale,
} from '@acme/i18n';

describe('TranslationsProvider', () => {
  function Show({ k }: { k: string }) {
    const t = useTranslations();
    return <span>{t(k)}</span>;
  }

  function Capture({ onRender }: { onRender: (t: (key: string) => string) => void }) {
    const t = useTranslations();
    onRender(t);
    return null;
  }

  it('provides messages to children', () => {
    render(
      <TranslationsProvider messages={{ greet: 'Hello' }}>
        <>
          <Show k="greet" />
          <Show k="missing" />
        </>
      </TranslationsProvider>
    );

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('missing')).toBeInTheDocument();
  });

  it('only updates translator when messages change', () => {
    const messages = { greet: 'Hello' };
    const renders: ((key: string) => string)[] = [];

    const { rerender } = render(
      <TranslationsProvider messages={messages}>
        <Capture onRender={(t) => renders.push(t)} />
      </TranslationsProvider>
    );

    rerender(
      <TranslationsProvider messages={messages}>
        <Capture onRender={(t) => renders.push(t)} />
      </TranslationsProvider>
    );

    expect(renders[0]).toBe(renders[1]);

    rerender(
      <TranslationsProvider messages={{ greet: 'Hi' }}>
        <Capture onRender={(t) => renders.push(t)} />
      </TranslationsProvider>
    );

    expect(renders[1]).not.toBe(renders[2]);
    expect(renders[2]('greet')).toBe('Hi');
  });
});

describe('useTranslations', () => {
  it('returns a stable function and falls back to key', () => {
    let messages: Record<string, string> = { greet: 'Hello' };
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={messages}>{children}</TranslationsProvider>
    );

    const { result, rerender } = renderHook(() => useTranslations(), { wrapper });

    expect(result.current('greet')).toBe('Hello');
    expect(result.current('missing')).toBe('missing');

    const first = result.current;
    rerender();
    expect(result.current).toBe(first);

    messages = { greet: 'Hi' };
    rerender();
    expect(result.current).not.toBe(first);
  });
});

describe('locales utilities', () => {
  it('assertLocales validates input', () => {
    expect(() => assertLocales(undefined as any)).toThrow('LOCALES must be a non-empty array');
    expect(() => assertLocales([] as any)).toThrow('LOCALES must be a non-empty array');
    expect(() => assertLocales(['en'])).not.toThrow();
  });

  it("resolveLocale returns supported locale or defaults to 'en'", () => {
    expect(resolveLocale('de')).toBe('de');
    expect(resolveLocale('fr')).toBe('en');
    expect(resolveLocale(undefined)).toBe('en');
  });
});
