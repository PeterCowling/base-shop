import type { AppProps } from "next/app";
import Link from "next/link";
import { TranslationsProvider } from "@acme/i18n";
import enMessages from "@acme/i18n/en.json";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <TranslationsProvider messages={enMessages as Record<string, string>}>
      <div className="min-h-dvh bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex w-full items-center justify-between px-4 py-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Upgrade Dashboard</p>
              <p className="text-xs text-slate-600">Aggregator preview</p>
            </div>
            <nav className="flex items-center gap-4 text-sm font-semibold">
              <Link className="text-slate-700 hover:text-slate-900" href="/dashboard">
                Dashboard
              </Link>
              <Link className="text-slate-700 hover:text-slate-900" href="/shops">
                Shops
              </Link>
              <Link className="text-slate-700 hover:text-slate-900" href="/workboard">
                Workboard
              </Link>
              <Link className="text-slate-700 hover:text-slate-900" href="/history">
                History
              </Link>
              <Link className="text-blue-700 hover:text-blue-900" href="/Upgrade">
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
