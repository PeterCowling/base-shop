// apps/cover-me-pretty/src/app/layout.tsx
import { CartProvider } from "@platform-core/contexts/CartContext";
import { CurrencyProvider } from "@platform-core/contexts/CurrencyContext";
import { ThemeProvider } from "@platform-core/contexts/ThemeContext";
import { initTheme } from "@platform-core/utils";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConsentSection from "@acme/ui/components/cms/blocks/ConsentSection";
import AnalyticsPixelsSection from "@acme/ui/components/cms/blocks/AnalyticsPixelsSection";
import StructuredDataSection from "@acme/ui/components/cms/blocks/StructuredDataSection";
import RentalDemoProvider from "@acme/ui/components/cms/blocks/RentalDemoProvider.client";

/**
 * Root layout for the Shop app.
 *
 * This version removes any asynchronous side-effects (e.g. plugin loading)
 * so that Next.js can safely prerender error and not-found pages.  Plugin
 * initialization is now handled within API routes or specific server
 * components, not at the root.  Font variables and dark-mode theme are still
 * applied via <html> classes and an inline script.
 */

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Base-Shop",
  description: "Sustainable footwear built with Next.js 15", // i18n-exempt -- ABC-123 demo metadata description [ttl=2025-06-30]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        {/* Apply persisted theme (light/dark/brandx) without blocking render */}
        <script dangerouslySetInnerHTML={{ __html: initTheme }} />
      </head>
      <body className="antialiased">
        <CartProvider>
          <ThemeProvider>
            <CurrencyProvider>
              {/* Demo rental provider wiring; safe no-op without consumers */}
              <RentalDemoProvider />
              {/* Consent + analytics (loads only after consent) */}
              <ConsentSection />
              <AnalyticsPixelsSection measurementId={process.env.NEXT_PUBLIC_GA4_ID} />
              {/* Structured data (BreadcrumbList) */}
              <StructuredDataSection breadcrumbs />
              <div className="sf-content">{children}</div>
            </CurrencyProvider>
          </ThemeProvider>
        </CartProvider>
      </body>
    </html>
  );
}
