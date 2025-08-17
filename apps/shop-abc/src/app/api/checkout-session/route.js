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
// apps/shop-abc/src/app/api/checkout-session/route.ts
require("@acme/zod-utils/initZod");
var cartCookie_1 = require("@platform-core/cartCookie");
var cartStore_1 = require("@platform-core/cartStore");
var _auth_1 = require("@auth");
var checkout_1 = require("../../../services/checkout");
var shop_json_1 = require("../../../../shop.json");
var server_1 = require("next/server");
var zod_1 = require("zod");
var address_1 = require("@platform-core/schemas/address");
var _shared_utils_1 = require("@shared-utils");
exports.runtime = "edge";
var schema = zod_1.z
    .object({
    returnDate: zod_1.z.string().optional(),
    coupon: zod_1.z.string().optional(),
    currency: zod_1.z.enum(["EUR", "USD", "GBP"]).default("EUR"),
    taxRegion: zod_1.z.enum(["", "EU", "US"]).default(""),
    customer: zod_1.z.string().optional(),
    shipping: address_1.shippingSchema.optional(),
    billing_details: address_1.billingSchema.optional(),
})
    .strict();
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var rawCookie, cartId, cart, _a, session, _b, parsed, _c, returnDate, coupon, currency, taxRegion, customerId, shipping, billing_details, clientIp, result, err_1;
        var _d, _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    rawCookie = (_d = req.cookies.get(cartCookie_1.CART_COOKIE)) === null || _d === void 0 ? void 0 : _d.value;
                    cartId = (0, cartCookie_1.decodeCartCookie)(rawCookie);
                    if (!cartId) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, cartStore_1.getCart)(cartId)];
                case 1:
                    _a = _j.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = {};
                    _j.label = 3;
                case 3:
                    cart = _a;
                    if (!Object.keys(cart).length) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Cart is empty" }, { status: 400 })];
                    }
                    _j.label = 4;
                case 4:
                    _j.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, (0, _auth_1.requirePermission)("checkout")];
                case 5:
                    session = _j.sent();
                    return [3 /*break*/, 7];
                case 6:
                    _b = _j.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 })];
                case 7: return [4 /*yield*/, (0, _shared_utils_1.parseJsonBody)(req, schema, "1mb")];
                case 8:
                    parsed = _j.sent();
                    if (!parsed.success)
                        return [2 /*return*/, parsed.response];
                    _c = parsed.data, returnDate = _c.returnDate, coupon = _c.coupon, currency = _c.currency, taxRegion = _c.taxRegion, customerId = _c.customer, shipping = _c.shipping, billing_details = _c.billing_details;
                    clientIp = (_h = (_g = (_f = (_e = req.headers) === null || _e === void 0 ? void 0 : _e.get) === null || _f === void 0 ? void 0 : _f.call(_e, "x-forwarded-for")) === null || _g === void 0 ? void 0 : _g.split(",")[0]) !== null && _h !== void 0 ? _h : "";
                    _j.label = 9;
                case 9:
                    _j.trys.push([9, 11, , 12]);
                    return [4 /*yield*/, (0, checkout_1.createCheckoutSession)(cart, {
                            returnDate: returnDate,
                            coupon: coupon,
                            currency: currency,
                            taxRegion: taxRegion,
                            customerId: customerId !== null && customerId !== void 0 ? customerId : session.customerId,
                            shipping: shipping,
                            billing_details: billing_details,
                            successUrl: "".concat(req.nextUrl.origin, "/success"),
                            cancelUrl: "".concat(req.nextUrl.origin, "/cancelled"),
                            clientIp: clientIp,
                            shopId: shop_json_1.default.id,
                        })];
                case 10:
                    result = _j.sent();
                    return [2 /*return*/, server_1.NextResponse.json(result)];
                case 11:
                    err_1 = _j.sent();
                    if (err_1 instanceof Error && /Invalid returnDate/.test(err_1.message)) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Invalid returnDate" }, { status: 400 })];
                    }
                    console.error("Failed to create Stripe checkout session", err_1);
                    return [2 /*return*/, server_1.NextResponse.json({ error: "Checkout failed" }, { status: 502 })];
                case 12: return [2 /*return*/];
            }
        });
    });
}
