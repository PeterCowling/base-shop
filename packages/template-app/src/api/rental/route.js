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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.POST = POST;
exports.PATCH = PATCH;
var stripe_1 = require("@acme/stripe");
var shops_server_1 = require("@platform-core/repositories/shops.server");
var rentalOrders_server_1 = require("@platform-core/repositories/rentalOrders.server");
var inventory_server_1 = require("@platform-core/repositories/inventory.server");
var products_server_1 = require("@platform-core/repositories/products.server");
var rentalAllocation_1 = require("@platform-core/orders/rentalAllocation");
var pricing_1 = require("@platform-core/pricing");
var server_1 = require("next/server");
var SHOP_ID = "bcd";
exports.runtime = "edge";
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var sessionId, shop, session, deposit, expected, orderItems, _a, inventory, products, _loop_1, _i, orderItems_1, _b, sku, from, to;
        var _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0: return [4 /*yield*/, req.json()];
                case 1:
                    sessionId = (_g.sent()).sessionId;
                    if (!sessionId) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Missing sessionId" }, { status: 400 })];
                    }
                    return [4 /*yield*/, (0, shops_server_1.readShop)(SHOP_ID)];
                case 2:
                    shop = _g.sent();
                    return [4 /*yield*/, stripe_1.stripe.checkout.sessions.retrieve(sessionId)];
                case 3:
                    session = _g.sent();
                    deposit = Number((_d = (_c = session.metadata) === null || _c === void 0 ? void 0 : _c.depositTotal) !== null && _d !== void 0 ? _d : 0);
                    expected = ((_e = session.metadata) === null || _e === void 0 ? void 0 : _e.returnDate) || undefined;
                    orderItems = ((_f = session.metadata) === null || _f === void 0 ? void 0 : _f.items) ? JSON.parse(session.metadata.items) : [];
                    if (!(shop.rentalInventoryAllocation && orderItems.length)) return [3 /*break*/, 8];
                    return [4 /*yield*/, Promise.all([
                            (0, inventory_server_1.readInventory)(SHOP_ID),
                            (0, products_server_1.readRepo)(SHOP_ID),
                        ])];
                case 4:
                    _a = _g.sent(), inventory = _a[0], products = _a[1];
                    _loop_1 = function (sku, from, to) {
                        var skuInfo, items;
                        return __generator(this, function (_h) {
                            switch (_h.label) {
                                case 0:
                                    skuInfo = products.find(function (p) { return p.sku === sku; });
                                    if (!skuInfo)
                                        return [2 /*return*/, "continue"];
                                    items = inventory.filter(function (i) { return i.sku === sku; });
                                    return [4 /*yield*/, (0, rentalAllocation_1.reserveRentalInventory)(SHOP_ID, items, skuInfo, from, to)];
                                case 1:
                                    _h.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, orderItems_1 = orderItems;
                    _g.label = 5;
                case 5:
                    if (!(_i < orderItems_1.length)) return [3 /*break*/, 8];
                    _b = orderItems_1[_i], sku = _b.sku, from = _b.from, to = _b.to;
                    return [5 /*yield**/, _loop_1(sku, from, to)];
                case 6:
                    _g.sent();
                    _g.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 5];
                case 8: return [4 /*yield*/, (0, rentalOrders_server_1.addOrder)(SHOP_ID, sessionId, deposit, expected)];
                case 9:
                    _g.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ ok: true })];
            }
        });
    });
}
function PATCH(req) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, sessionId, damage, shop, order, session, coverageCodes, damageFee, clientSecret, remaining, intent;
        var _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0: return [4 /*yield*/, req.json()];
                case 1:
                    _a = (_g.sent()), sessionId = _a.sessionId, damage = _a.damage;
                    if (!sessionId) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Missing sessionId" }, { status: 400 })];
                    }
                    return [4 /*yield*/, (0, shops_server_1.readShop)(SHOP_ID)];
                case 2:
                    shop = _g.sent();
                    return [4 /*yield*/, (0, rentalOrders_server_1.markReturned)(SHOP_ID, sessionId)];
                case 3:
                    order = _g.sent();
                    if (!order) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Order not found" }, { status: 404 })];
                    }
                    return [4 /*yield*/, stripe_1.stripe.checkout.sessions.retrieve(sessionId)];
                case 4:
                    session = _g.sent();
                    coverageCodes = (_d = (_c = (_b = session.metadata) === null || _b === void 0 ? void 0 : _b.coverage) === null || _c === void 0 ? void 0 : _c.split(",").filter(Boolean)) !== null && _d !== void 0 ? _d : [];
                    if (shop.coverageIncluded && typeof damage === "string") {
                        coverageCodes = Array.from(new Set(__spreadArray(__spreadArray([], coverageCodes, true), [damage], false)));
                    }
                    return [4 /*yield*/, (0, pricing_1.computeDamageFee)(damage, order.deposit, coverageCodes, shop.coverageIncluded)];
                case 5:
                    damageFee = _g.sent();
                    if (!damageFee) return [3 /*break*/, 7];
                    return [4 /*yield*/, (0, rentalOrders_server_1.markReturned)(SHOP_ID, sessionId, damageFee)];
                case 6:
                    _g.sent();
                    _g.label = 7;
                case 7:
                    if (!(damageFee > order.deposit)) return [3 /*break*/, 9];
                    remaining = damageFee - order.deposit;
                    return [4 /*yield*/, stripe_1.stripe.paymentIntents.create(__assign(__assign({ amount: remaining * 100, currency: (_e = session.currency) !== null && _e !== void 0 ? _e : "usd" }, (session.customer ? { customer: session.customer } : {})), { metadata: { sessionId: sessionId, purpose: "damage_fee" } }))];
                case 8:
                    intent = _g.sent();
                    clientSecret = (_f = intent.client_secret) !== null && _f !== void 0 ? _f : undefined;
                    _g.label = 9;
                case 9: return [2 /*return*/, server_1.NextResponse.json(__assign({ ok: true }, (clientSecret ? { clientSecret: clientSecret } : {})), { status: 200 })];
            }
        });
    });
}
