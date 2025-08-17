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
// apps/shop-bcd/src/app/api/checkout-session/route.ts
require("@acme/zod-utils/initZod");
var cartCookie_1 = require("@/lib/cartCookie");
var _auth_1 = require("@auth");
var session_1 = require("@platform-core/checkout/session");
var shop_json_1 = require("../../../shop.json");
var server_1 = require("next/server");
var zod_1 = require("zod");
var address_1 = require("@platform-core/schemas/address");
exports.runtime = "edge";
var schema = zod_1.z
    .object({
    returnDate: zod_1.z.string().optional(),
    coupon: zod_1.z.string().optional(),
    currency: zod_1.z.string().optional(),
    taxRegion: zod_1.z.string().optional(),
    customer: zod_1.z.string().optional(),
    shipping: address_1.shippingSchema.optional(),
    billing_details: address_1.billingSchema.optional(),
})
    .strict();
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var rawCookie, cookieValue, cart, parsed, _a, _b, _c, returnDate, coupon, _d, currency, _e, taxRegion, customerId, shipping, billing_details, customerSession, customer, clientIp, result, err_1;
        var _f, _g, _h, _j, _k;
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0:
                    rawCookie = (_f = req.cookies.get(cartCookie_1.CART_COOKIE)) === null || _f === void 0 ? void 0 : _f.value;
                    cookieValue = (0, cartCookie_1.decodeCartCookie)(rawCookie);
                    cart = {};
                    if (cookieValue) {
                        try {
                            cart = JSON.parse(cookieValue);
                        }
                        catch (_m) {
                            cart = {};
                        }
                    }
                    if (!Object.keys(cart).length) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Cart is empty" }, { status: 400 })];
                    }
                    _b = (_a = schema).safeParse;
                    return [4 /*yield*/, req.json().catch(function () { return undefined; })];
                case 1:
                    parsed = _b.apply(_a, [_l.sent()]);
                    if (!parsed.success) {
                        return [2 /*return*/, server_1.NextResponse.json(parsed.error.flatten().fieldErrors, { status: 400 })];
                    }
                    _c = parsed.data, returnDate = _c.returnDate, coupon = _c.coupon, _d = _c.currency, currency = _d === void 0 ? "EUR" : _d, _e = _c.taxRegion, taxRegion = _e === void 0 ? "" : _e, customerId = _c.customer, shipping = _c.shipping, billing_details = _c.billing_details;
                    return [4 /*yield*/, (0, _auth_1.getCustomerSession)()];
                case 2:
                    customerSession = _l.sent();
                    customer = customerId !== null && customerId !== void 0 ? customerId : customerSession === null || customerSession === void 0 ? void 0 : customerSession.customerId;
                    clientIp = (_k = (_j = (_h = (_g = req.headers) === null || _g === void 0 ? void 0 : _g.get) === null || _h === void 0 ? void 0 : _h.call(_g, "x-forwarded-for")) === null || _j === void 0 ? void 0 : _j.split(",")[0]) !== null && _k !== void 0 ? _k : "";
                    _l.label = 3;
                case 3:
                    _l.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, (0, session_1.createCheckoutSession)(cart, {
                            returnDate: returnDate,
                            coupon: coupon,
                            currency: currency,
                            taxRegion: taxRegion,
                            customerId: customer,
                            shipping: shipping,
                            billing_details: billing_details,
                            successUrl: "".concat(req.nextUrl.origin, "/success"),
                            cancelUrl: "".concat(req.nextUrl.origin, "/cancelled"),
                            clientIp: clientIp,
                            shopId: shop_json_1.default.id,
                        })];
                case 4:
                    result = _l.sent();
                    return [2 /*return*/, server_1.NextResponse.json(result)];
                case 5:
                    err_1 = _l.sent();
                    if (err_1 instanceof Error && /Invalid returnDate/.test(err_1.message)) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Invalid returnDate" }, { status: 400 })];
                    }
                    console.error("Failed to create Stripe checkout session", err_1);
                    return [2 /*return*/, server_1.NextResponse.json({ error: "Checkout failed" }, { status: 502 })];
                case 6: return [2 /*return*/];
            }
        });
    });
}
