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
exports.default = CheckoutPage;
// packages/template-app/src/app/[lang]/checkout/page.tsx
var CheckoutForm_1 = require("@/components/checkout/CheckoutForm");
var OrderSummary_1 = require("@/components/organisms/OrderSummary");
var locales_1 = require("@/i18n/locales");
var cartCookie_1 = require("@platform-core/cartCookie");
var cartStore_1 = require("@platform-core/cartStore");
var products_1 = require("@platform-core/products");
var headers_1 = require("next/headers");
var settings_server_1 = require("@platform-core/repositories/settings.server");
var shops_server_1 = require("@platform-core/repositories/shops.server");
var react_1 = require("react");
exports.metadata = {
    title: "Checkout · Base-Shop",
};
/**
 * Next 15 delivers `params` as a Promise, and `cookies()` is async in
 * the edge runtime.  Await both.
 */
function CheckoutPage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var rawLang, lang, cookieStore, cartId, cart, _c, validatedCart, _i, _d, _e, id, line, sku, lines, subtotal, deposit, total, _f, settings, shop;
        var _g;
        var params = _b.params;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    rawLang = (_h.sent()).lang;
                    lang = (0, locales_1.resolveLocale)(rawLang);
                    return [4 /*yield*/, (0, headers_1.cookies)()];
                case 2:
                    cookieStore = _h.sent();
                    cartId = (0, cartCookie_1.decodeCartCookie)((_g = cookieStore.get(cartCookie_1.CART_COOKIE)) === null || _g === void 0 ? void 0 : _g.value);
                    if (!cartId) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, cartStore_1.getCart)(cartId)];
                case 3:
                    _c = _h.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _c = {};
                    _h.label = 5;
                case 5:
                    cart = _c;
                    /* ---------- empty cart guard ---------- */
                    if (!Object.keys(cart).length) {
                        return [2 /*return*/, <p className="p-8 text-center">Your cart is empty.</p>];
                    }
                    validatedCart = {};
                    for (_i = 0, _d = Object.entries(cart); _i < _d.length; _i++) {
                        _e = _d[_i], id = _e[0], line = _e[1];
                        sku = (0, products_1.getProductById)(id);
                        if (!sku)
                            continue; // skip items that no longer exist
                        validatedCart[id] = { sku: sku, qty: line.qty, size: line.size };
                    }
                    lines = Object.values(validatedCart);
                    subtotal = lines.reduce(function (sum, l) { return sum + l.sku.price * l.qty; }, 0);
                    deposit = lines.reduce(function (sum, l) { var _a; return sum + ((_a = l.sku.deposit) !== null && _a !== void 0 ? _a : 0) * l.qty; }, 0);
                    total = subtotal + deposit;
                    return [4 /*yield*/, Promise.all([
                            (0, settings_server_1.getShopSettings)("shop"),
                            (0, shops_server_1.readShop)("shop"),
                        ])];
                case 6:
                    _f = _h.sent(), settings = _f[0], shop = _f[1];
                    if (shop.type !== "rental") {
                        return [2 /*return*/, (<div className="mx-auto flex max-w-4xl flex-col gap-10 p-6">
        <OrderSummary_1.default cart={validatedCart} totals={{ subtotal: subtotal, deposit: deposit, total: total }}/>
        <CheckoutSection locale={lang} taxRegion={settings.taxRegion}/>
      </div>)];
                    }
                    return [2 /*return*/, <p className="p-8 text-center">Rental checkout not implemented.</p>];
            }
        });
    });
}
function CheckoutSection(_a) {
    "use client";
    var locale = _a.locale, taxRegion = _a.taxRegion;
    var _b = (0, react_1.useState)(false), coverage = _b[0], setCoverage = _b[1];
    return (<div className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={coverage} onChange={function (e) { return setCoverage(e.target.checked); }}/>
        Add coverage
      </label>
      <CheckoutForm_1.default locale={locale} taxRegion={taxRegion} coverage={coverage ? ["scuff", "tear"] : []}/>
    </div>);
}
