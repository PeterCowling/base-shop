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
exports.runtime = void 0;
exports.POST = POST;
// packages/template-app/src/api/checkout-session/route.ts
var cartCookie_1 = require("@platform-core/cartCookie");
var cartStore_1 = require("@platform-core/cartStore");
var pricing_1 = require("@platform-core/pricing");
var session_1 = require("@platform-core/checkout/session");
var core_1 = require("@acme/config/env/core");
var shops_server_1 = require("@platform-core/repositories/shops.server");
var server_1 = require("next/server");
exports.runtime = "edge";
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var rawCookie, cartId, cart, _a, _b, returnDate, coupon, _c, currency, _d, taxRegion, customerId, shipping, billing_details, coverage, shop, shopInfo, coverageCodes, lineItemsExtra, metadataExtra, subtotalExtra, depositAdjustment, pricing, coverageFee, coverageWaiver, _i, coverageCodes_1, code, rule, feeConv, waiveConv, clientIp, result, err_1;
        var _e, _f, _g, _h, _j, _k;
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0:
                    rawCookie = (_e = req.cookies.get(cartCookie_1.CART_COOKIE)) === null || _e === void 0 ? void 0 : _e.value;
                    cartId = (0, cartCookie_1.decodeCartCookie)(rawCookie);
                    if (!cartId) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, cartStore_1.getCart)(cartId)];
                case 1:
                    _a = (_l.sent());
                    return [3 /*break*/, 3];
                case 2:
                    _a = {};
                    _l.label = 3;
                case 3:
                    cart = _a;
                    if (!Object.keys(cart).length) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Cart is empty" }, { status: 400 })];
                    }
                    return [4 /*yield*/, req.json().catch(function () { return ({}); })];
                case 4:
                    _b = (_l.sent()), returnDate = _b.returnDate, coupon = _b.coupon, _c = _b.currency, currency = _c === void 0 ? "EUR" : _c, _d = _b.taxRegion, taxRegion = _d === void 0 ? "" : _d, customerId = _b.customer, shipping = _b.shipping, billing_details = _b.billing_details, coverage = _b.coverage;
                    shop = core_1.coreEnv.NEXT_PUBLIC_DEFAULT_SHOP || "shop";
                    return [4 /*yield*/, (0, shops_server_1.readShop)(shop)];
                case 5:
                    shopInfo = _l.sent();
                    coverageCodes = Array.isArray(coverage) ? coverage : [];
                    lineItemsExtra = [];
                    metadataExtra = {};
                    subtotalExtra = 0;
                    depositAdjustment = 0;
                    if (!(shopInfo.coverageIncluded && coverageCodes.length)) return [3 /*break*/, 9];
                    return [4 /*yield*/, (0, pricing_1.getPricing)()];
                case 6:
                    pricing = _l.sent();
                    coverageFee = 0;
                    coverageWaiver = 0;
                    for (_i = 0, coverageCodes_1 = coverageCodes; _i < coverageCodes_1.length; _i++) {
                        code = coverageCodes_1[_i];
                        rule = (_f = pricing.coverage) === null || _f === void 0 ? void 0 : _f[code];
                        if (rule) {
                            coverageFee += rule.fee;
                            coverageWaiver += rule.waiver;
                        }
                    }
                    return [4 /*yield*/, (0, pricing_1.convertCurrency)(coverageFee, currency)];
                case 7:
                    feeConv = _l.sent();
                    return [4 /*yield*/, (0, pricing_1.convertCurrency)(coverageWaiver, currency)];
                case 8:
                    waiveConv = _l.sent();
                    if (feeConv > 0) {
                        lineItemsExtra.push({
                            price_data: {
                                currency: currency.toLowerCase(),
                                unit_amount: feeConv * 100,
                                product_data: { name: "Coverage" },
                            },
                            quantity: 1,
                        });
                        subtotalExtra = feeConv;
                    }
                    if (waiveConv > 0) {
                        depositAdjustment = -waiveConv;
                    }
                    metadataExtra = {
                        coverage: coverageCodes.join(","),
                        coverageFee: String(feeConv),
                        coverageWaiver: String(waiveConv),
                    };
                    _l.label = 9;
                case 9:
                    clientIp = (_k = (_j = (_h = (_g = req.headers) === null || _g === void 0 ? void 0 : _g.get) === null || _h === void 0 ? void 0 : _h.call(_g, "x-forwarded-for")) === null || _j === void 0 ? void 0 : _j.split(",")[0]) !== null && _k !== void 0 ? _k : "";
                    _l.label = 10;
                case 10:
                    _l.trys.push([10, 12, , 13]);
                    return [4 /*yield*/, (0, session_1.createCheckoutSession)(cart, {
                            returnDate: returnDate,
                            coupon: coupon,
                            currency: currency,
                            taxRegion: taxRegion,
                            customerId: customerId,
                            shipping: shipping,
                            billing_details: billing_details,
                            successUrl: "".concat(req.nextUrl.origin, "/success"),
                            cancelUrl: "".concat(req.nextUrl.origin, "/cancelled"),
                            clientIp: clientIp,
                            shopId: shop,
                            lineItemsExtra: lineItemsExtra,
                            metadataExtra: metadataExtra,
                            subtotalExtra: subtotalExtra,
                            depositAdjustment: depositAdjustment,
                        })];
                case 11:
                    result = _l.sent();
                    return [2 /*return*/, server_1.NextResponse.json(result)];
                case 12:
                    err_1 = _l.sent();
                    if (err_1 instanceof Error && /Invalid returnDate/.test(err_1.message)) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Invalid returnDate" }, { status: 400 })];
                    }
                    console.error("Failed to create Stripe checkout session", err_1);
                    return [2 /*return*/, server_1.NextResponse.json({ error: "Checkout failed" }, { status: 502 })];
                case 13: return [2 /*return*/];
            }
        });
    });
}
