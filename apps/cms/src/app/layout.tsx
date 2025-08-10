// apps/cms/src/app/layout.tsx
import { CartProvider } from "@/contexts/CartContext";
import { applyFriendlyZodMessages } from "@lib/zodErrorMap";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

// Ensure friendly Zod messages for all validations
applyFriendlyZodMessages();

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('theme-dark');
                } else {
                  document.documentElement.classList.remove('theme-dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        {/* Global providers go here */}
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
