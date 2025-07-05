import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/app/layout.tsx
import { CartProvider } from "@/contexts/CartContext";
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
export const metadata = {
    title: "Base-Shop",
    description: "Sustainable footwear built with Next.js 15",
};
export default function RootLayout({ children, }) {
    return (_jsx("html", { lang: "en", className: `${geistSans.variable} ${geistMono.variable}`, children: _jsxs("body", { className: "antialiased", children: [_jsx(AnalyticsScripts, {}), _jsx(CartProvider, { children: children })] }) }));
}
