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
require("@acme/zod-utils/initZod");
var stripe_1 = require("@acme/stripe");
var pricing_1 = require("@platform-core/pricing");
var rentalOrders_server_1 = require("@platform-core/repositories/rentalOrders.server");
var shops_server_1 = require("@platform-core/repositories/shops.server");
var server_1 = require("next/server");
var zod_1 = require("zod");
var _shared_utils_1 = require("@shared-utils");
exports.runtime = "edge";
var RentalSchema = zod_1.z.object({ sessionId: zod_1.z.string() }).strict();
var ReturnSchema = zod_1.z
    .object({
    sessionId: zod_1.z.string(),
    damage: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
})
    .strict();
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var parsed, sessionId, session, deposit, expected;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, (0, _shared_utils_1.parseJsonBody)(req, RentalSchema, "1mb")];
                case 1:
                    parsed = _d.sent();
                    if ("response" in parsed)
                        return [2 /*return*/, parsed.response];
                    sessionId = parsed.data.sessionId;
                    return [4 /*yield*/, stripe_1.stripe.checkout.sessions.retrieve(sessionId)];
                case 2:
                    session = _d.sent();
                    deposit = Number((_b = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.depositTotal) !== null && _b !== void 0 ? _b : 0);
                    expected = ((_c = session.metadata) === null || _c === void 0 ? void 0 : _c.returnDate) || undefined;
                    return [4 /*yield*/, (0, rentalOrders_server_1.addOrder)("bcd", sessionId, deposit, expected)];
                case 3:
                    _d.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ ok: true })];
            }
        });
    });
}
function PATCH(req) {
    return __awaiter(this, void 0, void 0, function () {
        var parsed, _a, sessionId, damage, order, shop, session, coverageCodes, damageFee, pi, refund;
        var _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, (0, _shared_utils_1.parseJsonBody)(req, ReturnSchema, "1mb")];
                case 1:
                    parsed = _f.sent();
                    if ("response" in parsed)
                        return [2 /*return*/, parsed.response];
                    _a = parsed.data, sessionId = _a.sessionId, damage = _a.damage;
                    return [4 /*yield*/, (0, rentalOrders_server_1.markReturned)("bcd", sessionId)];
                case 2:
                    order = _f.sent();
                    if (!order) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Order not found" }, { status: 404 })];
                    }
                    return [4 /*yield*/, (0, shops_server_1.readShop)("bcd")];
                case 3:
                    shop = _f.sent();
                    return [4 /*yield*/, stripe_1.stripe.checkout.sessions.retrieve(sessionId, {
                            expand: ["payment_intent"],
                        })];
                case 4:
                    session = _f.sent();
                    coverageCodes = (_d = (_c = (_b = session.metadata) === null || _b === void 0 ? void 0 : _b.coverage) === null || _c === void 0 ? void 0 : _c.split(",").filter(Boolean)) !== null && _d !== void 0 ? _d : [];
                    if (shop.coverageIncluded && typeof damage === "string") {
                        coverageCodes = Array.from(new Set(__spreadArray(__spreadArray([], coverageCodes, true), [damage], false)));
                    }
                    return [4 /*yield*/, (0, pricing_1.computeDamageFee)(damage, order.deposit, coverageCodes, shop.coverageIncluded)];
                case 5:
                    damageFee = _f.sent();
                    if (!damageFee) return [3 /*break*/, 7];
                    return [4 /*yield*/, (0, rentalOrders_server_1.markReturned)("bcd", sessionId, damageFee)];
                case 6:
                    _f.sent();
                    _f.label = 7;
                case 7:
                    pi = typeof session.payment_intent === "string"
                        ? session.payment_intent
                        : (_e = session.payment_intent) === null || _e === void 0 ? void 0 : _e.id;
                    if (!(pi && order.deposit)) return [3 /*break*/, 9];
                    refund = Math.max(order.deposit - damageFee, 0);
                    if (!(refund > 0)) return [3 /*break*/, 9];
                    return [4 /*yield*/, stripe_1.stripe.refunds.create({ payment_intent: pi, amount: refund * 100 })];
                case 8:
                    _f.sent();
                    _f.label = 9;
                case 9: return [2 /*return*/, server_1.NextResponse.json({ ok: true })];
            }
        });
    });
}
