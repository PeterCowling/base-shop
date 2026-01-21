import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Mono, Work_Sans } from "next/font/google";

import { CurrencyProvider } from "@acme/platform-core/contexts/CurrencyContext";
import { ThemeProvider } from "@acme/platform-core/contexts/ThemeContext";

import { XaShell } from "../components/XaShell";
import { XaServiceWorkerRegistration } from "../components/XaServiceWorkerRegistration.client";
import { CartProvider } from "../contexts/XaCartContext";
import { WishlistProvider } from "../contexts/XaWishlistContext";
import { siteConfig } from "../lib/siteConfig";

export const runtime = "edge";

const atelierSans = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-atelier-sans",
});
const atelierMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-atelier-mono",
});

const stealthEnabled = ["1", "true", "yes", "on"].includes(
  (
    process.env.XA_STEALTH_MODE ??
    process.env.STEALTH_MODE ??
    process.env.NEXT_PUBLIC_STEALTH_MODE ??
    ""
  ).toLowerCase(),
);
const metadataTitle = siteConfig.brandName;
const metadataDescription = stealthEnabled
  ? "Private preview." // i18n-exempt -- XA-0030: metadata, not UI copy
  : `${siteConfig.brandName} storefront for ${siteConfig.catalog.productDescriptor}.`; // i18n-exempt -- XA-0001: metadata, not UI copy

export const metadata: Metadata = {
  title: metadataTitle,
  description: metadataDescription,
  robots: stealthEnabled
    ? {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
          index: false,
          follow: false,
          noimageindex: true,
          noarchive: true,
          nosnippet: true,
        },
      }
    : undefined,
  openGraph: {
    title: metadataTitle,
    description: metadataDescription,
  },
  twitter: {
    card: "summary",
    title: metadataTitle,
    description: metadataDescription,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const htmlClassName = [
    atelierSans.variable,
    atelierMono.variable,
    stealthEnabled ? "xa-stealth" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html lang="en" className={htmlClassName}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <CartProvider>
          <WishlistProvider>
            <ThemeProvider>
              <CurrencyProvider>
                <XaServiceWorkerRegistration />
                <XaShell>{children}</XaShell>
              </CurrencyProvider>
            </ThemeProvider>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
