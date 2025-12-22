// src/root/HydrateFallback.tsx
// Lightweight, dependency-free skeleton used during hydration.
// Keep this file free of heavy imports to minimise the initial payload.

import type { ReactNode } from "react";

type HydrationOverrideGlobal = typeof globalThis & {
  __TEST_HYDRATE_OVERRIDE__?: ReactNode;
};

export function HydrateFallback(): JSX.Element {
  if (process.env.NODE_ENV === "test") {
    const override = (globalThis as HydrationOverrideGlobal).__TEST_HYDRATE_OVERRIDE__;
    if (override) {
      return <>{override}</>;
    }
  }
  return (
    <div className="relative min-h-dvh bg-brand-surface text-brand-text">
      <a
        href="#main"
        aria-label="Skip to content"
        className="absolute m-4 inline-flex size-11 items-center justify-center rounded bg-brand-surface text-brand-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-outline"
      />

      <header className="border-b border-brand-outline/30 bg-brand-surface">
        <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="h-6 w-32 rounded bg-brand-text/10" aria-hidden />
          <nav className="hidden items-center gap-4 md:flex">
            <span className="h-4 w-16 rounded bg-brand-text/10" />
            <span className="h-4 w-16 rounded bg-brand-text/10" />
            <span className="h-4 w-16 rounded bg-brand-text/10" />
          </nav>
          <div className="h-8 w-20 rounded bg-brand-text/10" aria-hidden />
        </div>
      </header>

      <section id="main" className="mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-8 w-2/3 rounded bg-brand-text/10" aria-hidden />
          <div className="h-4 w-full rounded bg-brand-text/10" aria-hidden />
          <div className="h-4 w-11/12 rounded bg-brand-text/10" aria-hidden />
          <div className="h-4 w-5/6 rounded bg-brand-text/10" aria-hidden />
          <div className="h-64 w-full rounded-lg bg-brand-text/10" aria-hidden />
        </div>
        <div role="status" aria-live="polite" aria-busy="true" className="sr-only">
          Loading…
        </div>
      </section>

      <footer className="mt-auto border-t border-brand-outline/30 bg-brand-surface">
        <div className="mx-auto grid grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
          <div className="space-y-2" aria-hidden>
            <div className="h-4 w-24 rounded bg-brand-text/10" />
            <div className="h-3 w-20 rounded bg-brand-text/10" />
            <div className="h-3 w-28 rounded bg-brand-text/10" />
          </div>
          <div className="space-y-2" aria-hidden>
            <div className="h-4 w-24 rounded bg-brand-text/10" />
            <div className="h-3 w-20 rounded bg-brand-text/10" />
            <div className="h-3 w-28 rounded bg-brand-text/10" />
          </div>
          <div className="space-y-2" aria-hidden>
            <div className="h-4 w-24 rounded bg-brand-text/10" />
            <div className="h-3 w-20 rounded bg-brand-text/10" />
            <div className="h-3 w-28 rounded bg-brand-text/10" />
          </div>
          <div className="space-y-2" aria-hidden>
            <div className="h-4 w-24 rounded bg-brand-text/10" />
            <div className="h-3 w-20 rounded bg-brand-text/10" />
            <div className="h-3 w-28 rounded bg-brand-text/10" />
          </div>
        </div>
      </footer>
    </div>
  );
}
