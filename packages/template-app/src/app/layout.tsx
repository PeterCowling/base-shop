// src/app/layout.tsx
import { CartProvider } from "@platform-core/src/contexts/CartContext";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AnalyticsScripts from "./AnalyticsScripts";
import "./globals.css";

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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        {/* Global providers go here */}
        <AnalyticsScripts />
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
