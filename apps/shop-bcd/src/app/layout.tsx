// apps/shop-bcd/src/app/layout.tsx
import { CartProvider } from "@platform-core/contexts/CartContext";
import { initTheme } from "@platform-core/utils";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
  description: "Sustainable footwear built with Next.js 15",
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
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
