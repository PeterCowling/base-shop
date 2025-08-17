"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
// src/app/layout.tsx
require("./globals.css");
var CartContext_1 = require("@/contexts/CartContext");
var utils_1 = require("@platform-core/utils");
require("@acme/zod-utils/initZod");
var plugins_1 = require("@platform-core/plugins");
var google_1 = require("next/font/google");
var node_path_1 = require("node:path");
var node_url_1 = require("node:url");
var shop_json_1 = require("../../shop.json");
var __dirname = node_path_1.default.dirname((0, node_url_1.fileURLToPath)(import.meta.url));
var pluginsDir = node_path_1.default.resolve(__dirname, "../../../../packages/plugins");
var pluginsReady = (0, plugins_1.initPlugins)({
    directories: [pluginsDir],
    config: shop_json_1.default.plugins,
});
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
    return __awaiter(this, arguments, void 0, function (_b) {
        var children = _b.children;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, pluginsReady];
                case 1:
                    _c.sent();
                    return [2 /*return*/, (<html lang="en" className={"".concat(geistSans.variable, " ").concat(geistMono.variable)} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark"/>
        <script dangerouslySetInnerHTML={{ __html: utils_1.initTheme }}/>
      </head>
      <body className="antialiased">
        {/* Global providers go here */}
        <CartContext_1.CartProvider>{children}</CartContext_1.CartProvider>
      </body>
    </html>)];
            }
        });
    });
}
