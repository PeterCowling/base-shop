// src/app/layout.tsx
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { initTheme } from "@platform-core/utils";
import "@acme/lib/initZod";
import { initPlugins } from "@acme/platform-core/plugins";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import path from "node:path";
import { fileURLToPath } from "node:url";
import shop from "../../shop.json";


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginsDir = path.resolve(__dirname, "../../../../packages/plugins");

const pluginsReady = initPlugins({
  directories: [pluginsDir],
  config: (shop as any).plugins,
});

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await pluginsReady;
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: initTheme }} />
      </head>
      <body className="antialiased">
        {/* Global providers go here */}
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
