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
// apps/shop-bcd/src/app/[lang]/checkout/page.tsx
var CheckoutForm_1 = require("@/components/checkout/CheckoutForm");
var OrderSummary_1 = require("@/components/organisms/OrderSummary");
var organisms_1 = require("@ui/components/organisms");
var locales_1 = require("@/i18n/locales");
var cartCookie_1 = require("@/lib/cartCookie");
var headers_1 = require("next/headers");
var settings_server_1 = require("@platform-core/repositories/settings.server");
var shop_json_1 = require("../../../../shop.json");
exports.metadata = {
    title: "Checkout · Base-Shop",
};
/**
 * Next 15 delivers `params` as a Promise, and `cookies()` is async in
 * the edge runtime.  Await both.
 */
function CheckoutPage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var rawLang, lang, cookieStore, cart, settings, premierDelivery, hasPremierShipping;
        var _c, _d;
        var params = _b.params;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    rawLang = (_e.sent()).lang;
                    lang = (0, locales_1.resolveLocale)(rawLang);
                    return [4 /*yield*/, (0, headers_1.cookies)()];
                case 2:
                    cookieStore = _e.sent();
                    cart = (0, cartCookie_1.decodeCartCookie)((_c = cookieStore.get(cartCookie_1.CART_COOKIE)) === null || _c === void 0 ? void 0 : _c.value);
                    /* ---------- empty cart guard ---------- */
                    if (!Object.keys(cart).length) {
                        return [2 /*return*/, <p className="p-8 text-center">Your cart is empty.</p>];
                    }
                    return [4 /*yield*/, (0, settings_server_1.getShopSettings)(shop_json_1.default.id)];
                case 3:
                    settings = _e.sent();
                    premierDelivery = settings.premierDelivery;
                    hasPremierShipping = (_d = shop_json_1.default.shippingProviders) === null || _d === void 0 ? void 0 : _d.includes("premier-shipping");
                    /* ---------- render ---------- */
                    return [2 /*return*/, (<div className="mx-auto flex max-w-4xl flex-col gap-10 p-6">
      <OrderSummary_1.default />
      {hasPremierShipping && premierDelivery && (<PremierDeliveryPicker windows={premierDelivery.windows} regions={premierDelivery.regions}/>)}
      <CheckoutForm_1.default locale={lang} taxRegion={settings.taxRegion}/>
    </div>)];
            }
        });
    });
}
function PremierDeliveryPicker(_a) {
    "use client";
    var windows = _a.windows, regions = _a.regions;
    return (<organisms_1.DeliveryScheduler windows={windows} regions={regions} onChange={function (_a) {
            var region = _a.region, window = _a.window, date = _a.date;
            if (!region || !window || !date)
                return;
            fetch("/api/delivery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ region: region, date: date, window: window }),
            }).catch(function () { });
        }}/>);
}
