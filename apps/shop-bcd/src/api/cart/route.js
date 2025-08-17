"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.PATCH = PATCH;
exports.DELETE = DELETE;
exports.GET = GET;
// apps/shop-abc/src/app/api/cart/route.ts
require("@acme/zod-utils/initZod");
var cartCookie_1 = require("@/lib/cartCookie");
var products_1 = require("@/lib/products");
var server_1 = require("next/server");
var cart_1 = require("@platform-core/schemas/cart");
var zod_1 = require("zod");
exports.runtime = "edge";
var deleteSchema = zod_1.z.object({ id: zod_1.z.string() }).strict();
// This simple handler echoes back the posted body and status 200.
// Stripe / KV integration will extend this in Sprint 5.
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var json, parsed, _a, skuId, qty, size, sku, exists, status_1, error, cookie, cart, id, line, newQty, res;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, req.json()];
                case 1:
                    json = _e.sent();
                    parsed = cart_1.postSchema.safeParse(json);
                    if (!parsed.success) {
                        return [2 /*return*/, server_1.NextResponse.json(parsed.error.flatten().fieldErrors, {
                                status: 400,
                            })];
                    }
                    _a = parsed.data, skuId = _a.sku.id, qty = _a.qty, size = _a.size;
                    sku = (0, products_1.getProductById)(skuId);
                    if (!sku) {
                        exists = products_1.PRODUCTS.some(function (p) { return p.id === skuId; });
                        status_1 = exists ? 409 : 404;
                        error = exists ? "Out of stock" : "Item not found";
                        return [2 /*return*/, server_1.NextResponse.json({ error: error }, { status: status_1 })];
                    }
                    if (sku.sizes.length && !size) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Size required" }, { status: 400 })];
                    }
                    cookie = (_b = req.cookies.get(cartCookie_1.CART_COOKIE)) === null || _b === void 0 ? void 0 : _b.value;
                    cart = JSON.parse((_c = (0, cartCookie_1.decodeCartCookie)(cookie)) !== null && _c !== void 0 ? _c : "{}");
                    id = size ? "".concat(sku.id, ":").concat(size) : sku.id;
                    line = cart[id];
                    newQty = ((_d = line === null || line === void 0 ? void 0 : line.qty) !== null && _d !== void 0 ? _d : 0) + qty;
                    if (newQty > sku.stock) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Insufficient stock" }, { status: 409 })];
                    }
                    cart[id] = { sku: sku, size: size, qty: newQty };
                    res = server_1.NextResponse.json({ ok: true, cart: cart });
                    res.headers.set("Set-Cookie", (0, cartCookie_1.asSetCookieHeader)((0, cartCookie_1.encodeCartCookie)(JSON.stringify(cart))));
                    return [2 /*return*/, res];
            }
        });
    });
}
function PATCH(req) {
    return __awaiter(this, void 0, void 0, function () {
        var json, parsed, _a, id, qty, cookie, cart, line, res;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, req.json()];
                case 1:
                    json = _d.sent();
                    parsed = cart_1.patchSchema.safeParse(json);
                    if (!parsed.success) {
                        return [2 /*return*/, server_1.NextResponse.json(parsed.error.flatten().fieldErrors, {
                                status: 400,
                            })];
                    }
                    _a = parsed.data, id = _a.id, qty = _a.qty;
                    cookie = (_b = req.cookies.get(cartCookie_1.CART_COOKIE)) === null || _b === void 0 ? void 0 : _b.value;
                    cart = JSON.parse((_c = (0, cartCookie_1.decodeCartCookie)(cookie)) !== null && _c !== void 0 ? _c : "{}");
                    line = cart[id];
                    if (!line) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Item not in cart" }, { status: 404 })];
                    }
                    if (qty === 0) {
                        delete cart[id];
                    }
                    else {
                        cart[id] = __assign(__assign({}, line), { qty: qty });
                    }
                    res = server_1.NextResponse.json({ ok: true, cart: cart });
                    res.headers.set("Set-Cookie", (0, cartCookie_1.asSetCookieHeader)((0, cartCookie_1.encodeCartCookie)(JSON.stringify(cart))));
                    return [2 /*return*/, res];
            }
        });
    });
}
function DELETE(req) {
    return __awaiter(this, void 0, void 0, function () {
        var json, parsed, id, cookie, cart, res;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, req.json().catch(function () { return ({}); })];
                case 1:
                    json = _c.sent();
                    parsed = deleteSchema.safeParse(json);
                    if (!parsed.success) {
                        return [2 /*return*/, server_1.NextResponse.json(parsed.error.flatten().fieldErrors, {
                                status: 400,
                            })];
                    }
                    id = parsed.data.id;
                    cookie = (_a = req.cookies.get(cartCookie_1.CART_COOKIE)) === null || _a === void 0 ? void 0 : _a.value;
                    cart = JSON.parse((_b = (0, cartCookie_1.decodeCartCookie)(cookie)) !== null && _b !== void 0 ? _b : "{}");
                    if (!cart[id]) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Item not in cart" }, { status: 404 })];
                    }
                    delete cart[id];
                    res = server_1.NextResponse.json({ ok: true, cart: cart });
                    res.headers.set("Set-Cookie", (0, cartCookie_1.asSetCookieHeader)((0, cartCookie_1.encodeCartCookie)(JSON.stringify(cart))));
                    return [2 /*return*/, res];
            }
        });
    });
}
function GET(req) {
    return __awaiter(this, void 0, void 0, function () {
        var cookie, cart;
        var _a, _b;
        return __generator(this, function (_c) {
            cookie = (_a = req.cookies.get(cartCookie_1.CART_COOKIE)) === null || _a === void 0 ? void 0 : _a.value;
            cart = JSON.parse((_b = (0, cartCookie_1.decodeCartCookie)(cookie)) !== null && _b !== void 0 ? _b : "{}");
            return [2 /*return*/, server_1.NextResponse.json({ ok: true, cart: cart })];
        });
    });
}
