import "./globals.css";

import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { ShopThemeProvider } from "@acme/platform-core/contexts/ShopThemeContext";
import { initTheme } from "@acme/platform-core/utils";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-display",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body",
});

export const metadata: Metadata = {
  title:
    "Handbag Configurator" /* i18n-exempt -- HAND-001 developer scaffold title */,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: initTheme }} />
      </head>
      <body className="min-h-dvh bg-bg text-foreground antialiased">
        <ShopThemeProvider>{children}</ShopThemeProvider>
      </body>
    </html>
  );
}
