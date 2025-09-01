// src/app/layout.tsx
import { CartProvider } from "@platform-core/contexts/CartContext";
import { CurrencyProvider } from "@platform-core/contexts/CurrencyContext";
import type { Metadata } from "next";
import AnalyticsScripts from "./AnalyticsScripts";
import "./globals.css";

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
    <html lang="en">
      <body className="antialiased">
        {/* Global providers go here */}
        <AnalyticsScripts />
        <CurrencyProvider>
          <CartProvider>{children}</CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
