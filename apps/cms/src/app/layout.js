"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
// apps/cms/src/app/layout.tsx
var CartContext_1 = require("@/contexts/CartContext");
var utils_1 = require("@platform-core/utils");
require("@acme/lib/initZod");
var google_1 = require("next/font/google");
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
    return (<html lang="en" className={"".concat(geistSans.variable, " ").concat(geistMono.variable)} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark"/>
        <script dangerouslySetInnerHTML={{ __html: utils_1.initTheme }}/>
      </head>
      <body className="antialiased">
        {/* Global providers go here */}
        <CartContext_1.CartProvider>{children}</CartContext_1.CartProvider>
      </body>
    </html>);
}
