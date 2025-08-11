import { jsx as _jsx } from "react/jsx-runtime";
// src/app/layout.tsx
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { applyFriendlyZodMessages } from "@acme/lib";
import { Geist, Geist_Mono } from "next/font/google";
applyFriendlyZodMessages();
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
    return (_jsx("html", { lang: "en", className: `${geistSans.variable} ${geistMono.variable}`, children: _jsx("body", { className: "antialiased", children: _jsx(CartProvider, { children: children }) }) }));
}
