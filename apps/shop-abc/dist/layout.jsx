// src/app/layout.tsx
import "@/app/globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { Geist, Geist_Mono } from "next/font/google";
const geistSans = Geist({
    subsets: ["latin"],
    variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
    subsets: ["latin"],
    variable: "--font-geist-mono",
});
export const metadata = {
    title: "Base-Shop",
    description: "Sustainable footwear built with Next.js 15",
};
export default function RootLayout({ children, }) {
    return (<html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        {/* Global providers go here */}
        <CartProvider>{children}</CartProvider>
      </body>
    </html>);
}
