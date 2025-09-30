// src/app/layout.tsx
import { CartProvider } from "@platform-core/contexts/CartContext";
import { CurrencyProvider } from "@platform-core/contexts/CurrencyContext";
import type { Metadata } from "next";
import { TranslationsProvider } from "@acme/i18n";
import en from "@i18n/en.json";
import AnalyticsScripts from "./AnalyticsScripts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Base-Shop", // i18n-exempt -- ABC-123 [ttl=2025-12-31] default app metadata; localized variants come from page-level SEO
  description: "Sustainable footwear built with Next.js 15", // i18n-exempt -- ABC-123 [ttl=2025-12-31] default app metadata; localized variants come from page-level SEO
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* Global providers go here */}
        <AnalyticsScripts />
        <CurrencyProvider>
          <CartProvider>
            <TranslationsProvider messages={en}>
              {children}
            </TranslationsProvider>
          </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
