// apps/reception/src/app/layout.tsx
import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import OfflineIndicator from "@/components/OfflineIndicator";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Reception",
  description: "Hostel reception management system",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [{ color: "black" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} theme-dark dark`} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="antialiased">
        <ServiceWorkerRegistration />
        <OfflineIndicator />
        {children}
      </body>
    </html>
  );
}
