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
var stripe_1 = require("@acme/stripe");
var rentalOrders_server_1 = require("@platform-core/repositories/rentalOrders.server");
var pricing_1 = require("@platform-core/pricing");
var server_1 = require("next/server");
var returnLogistics_1 = require("@platform-core/returnLogistics");
var shops_server_1 = require("@platform-core/repositories/shops.server");
var settings_server_1 = require("@platform-core/repositories/settings.server");
var SHOP_ID = "bcd";
exports.runtime = "edge";
function savePickup(appt) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Placeholder for database persistence
            console.log("pickup scheduled", appt);
            return [2 /*return*/];
        });
    });
}
function notifyCarrier(appt) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("https://carrier.invalid/pickup", {
                            method: "POST",
                            body: JSON.stringify(appt),
                        })];
                case 1:
                    _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, sessionId, damage, zip, date, time, shop, order, session, deposit, pi, coverageCodes, damageFee, refund, _b, info, settings, appt;
        var _c, _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0: return [4 /*yield*/, req.json()];
                case 1:
                    _a = (_k.sent()), sessionId = _a.sessionId, damage = _a.damage, zip = _a.zip, date = _a.date, time = _a.time;
                    return [4 /*yield*/, (0, shops_server_1.readShop)(SHOP_ID)];
                case 2:
                    shop = _k.sent();
                    if (!shop.returnsEnabled) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Returns disabled" }, { status: 403 })];
                    }
                    if (!sessionId) return [3 /*break*/, 11];
                    return [4 /*yield*/, (0, rentalOrders_server_1.markReturned)(SHOP_ID, sessionId)];
                case 3:
                    order = _k.sent();
                    if (!order) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Order not found" }, { status: 404 })];
                    }
                    return [4 /*yield*/, stripe_1.stripe.checkout.sessions.retrieve(sessionId, {
                            expand: ["payment_intent"],
                        })];
                case 4:
                    session = _k.sent();
                    deposit = Number((_d = (_c = session.metadata) === null || _c === void 0 ? void 0 : _c.depositTotal) !== null && _d !== void 0 ? _d : 0);
                    pi = typeof session.payment_intent === "string"
                        ? session.payment_intent
                        : (_e = session.payment_intent) === null || _e === void 0 ? void 0 : _e.id;
                    if (!deposit || !pi) {
                        return [2 /*return*/, server_1.NextResponse.json({ ok: false, message: "No deposit found" })];
                    }
                    coverageCodes = (_h = (_g = (_f = session.metadata) === null || _f === void 0 ? void 0 : _f.coverage) === null || _g === void 0 ? void 0 : _g.split(",").filter(Boolean)) !== null && _h !== void 0 ? _h : [];
                    if (shop.coverageIncluded && typeof damage === "string") {
                        coverageCodes = Array.from(new Set(__spreadArray(__spreadArray([], coverageCodes, true), [damage], false)));
                    }
                    return [4 /*yield*/, (0, pricing_1.computeDamageFee)(damage, deposit, coverageCodes, shop.coverageIncluded)];
                case 5:
                    damageFee = _k.sent();
                    if (!damageFee) return [3 /*break*/, 7];
                    return [4 /*yield*/, (0, rentalOrders_server_1.markReturned)(SHOP_ID, sessionId, damageFee)];
                case 6:
                    _k.sent();
                    _k.label = 7;
                case 7:
                    refund = Math.max(deposit - damageFee, 0);
                    if (!(refund > 0)) return [3 /*break*/, 10];
                    return [4 /*yield*/, stripe_1.stripe.refunds.create({ payment_intent: pi, amount: refund * 100 })];
                case 8:
                    _k.sent();
                    return [4 /*yield*/, (0, rentalOrders_server_1.markRefunded)(SHOP_ID, sessionId)];
                case 9:
                    _k.sent();
                    _k.label = 10;
                case 10: return [2 /*return*/, server_1.NextResponse.json({ ok: true })];
                case 11:
                    if (!(zip && date && time)) return [3 /*break*/, 15];
                    return [4 /*yield*/, Promise.all([
                            (0, returnLogistics_1.getReturnBagAndLabel)(),
                            (0, settings_server_1.getShopSettings)(SHOP_ID),
                        ])];
                case 12:
                    _b = _k.sent(), info = _b[0], settings = _b[1];
                    if (!((_j = settings.returnService) === null || _j === void 0 ? void 0 : _j.homePickupEnabled)) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Home pickup disabled" }, { status: 403 })];
                    }
                    if (!info.homePickupZipCodes.includes(zip)) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "ZIP not eligible" }, { status: 400 })];
                    }
                    appt = { zip: zip, date: date, time: time };
                    return [4 /*yield*/, savePickup(appt)];
                case 13:
                    _k.sent();
                    return [4 /*yield*/, notifyCarrier(appt)];
                case 14:
                    _k.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ ok: true })];
                case 15: return [2 /*return*/, server_1.NextResponse.json({ error: "Invalid request" }, { status: 400 })];
            }
        });
    });
}
