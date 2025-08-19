"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
// src/app/layout.tsx
var CartContext_1 = require("@platform-core/contexts/CartContext");
var google_1 = require("next/font/google");
var AnalyticsScripts_1 = require("./AnalyticsScripts");
require("./globals.css");
var geistSans = (0, google_1.Geist)({
    subsets: ["latin"],
    variable: "--font-geist-sans",
});
var geistMono = (0, google_1.Geist_Mono)({
    subsets: ["latin"],
    variable: "--font-geist-mono",
});
exports.metadata = {
    title: "Base-Shop",
    description: "Sustainable footwear built with Next.js 15",
};
function RootLayout(_a) {
    var children = _a.children;
    return (<html lang="en" className={"".concat(geistSans.variable, " ").concat(geistMono.variable)}>
      <body className="antialiased">
        {/* Global providers go here */}
        <AnalyticsScripts_1.default />
        <CartContext_1.CartProvider>{children}</CartContext_1.CartProvider>
      </body>
    </html>);
}
