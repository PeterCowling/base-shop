import "../styles/globals.css";

import type { AppProps } from "next/app";
import Link from "next/link";

import { TranslationsProvider } from "@acme/i18n";
import enMessages from "@acme/i18n/en.json";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <TranslationsProvider messages={enMessages as Record<string, string>}>
      <div className="min-h-dvh bg-bg-2 text-fg">
        <header className="border-b border-border bg-bg">
          <div className="mx-auto flex w-full items-center justify-between px-4 py-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Upgrade Dashboard</p>
              <p className="text-xs text-fg-muted">Aggregator preview</p>
            </div>
            <nav className="flex items-center gap-4 text-sm font-semibold">
              <Link className="text-fg-muted hover:text-fg" href="/dashboard">
                Dashboard
              </Link>
              <Link className="text-fg-muted hover:text-fg" href="/shops">
                Shops
              </Link>
              <Link className="text-fg-muted hover:text-fg" href="/workboard">
                Workboard
              </Link>
              <Link className="text-fg-muted hover:text-fg" href="/history">
                History
              </Link>
              <Link className="text-link hover:text-link" href="/Upgrade">
                Upgrade
              </Link>
            </nav>
          </div>
        </header>
        <main className="dash-content mx-auto w-full px-4 py-6">
          <Component {...pageProps} />
        </main>
      </div>
    </TranslationsProvider>
  );
}
