import "./globals.css";

import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";

import { ThemeModeProvider } from "@acme/platform-core/contexts/ThemeModeContext";
import { initTheme } from "@acme/platform-core/utils";

const heading = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cormorant-garamond",
});

const body = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  variable: "--font-dm-sans",
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
    <html lang="en" className={`${heading.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: initTheme }} />
      </head>
      <body className="min-h-dvh bg-bg text-foreground antialiased">
        <ThemeModeProvider>{children}</ThemeModeProvider>
      </body>
    </html>
  );
}
