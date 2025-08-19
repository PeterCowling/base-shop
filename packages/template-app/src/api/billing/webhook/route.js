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
// packages/template-app/src/api/billing/webhook/route.ts
var stripe_1 = require("@acme/stripe");
var payments_1 = require("@acme/config/env/payments");
var server_1 = require("next/server");
var users_1 = require("@platform-core/repositories/users");
var shops_server_1 = require("@platform-core/repositories/shops.server");
var SHOP_ID = "bcd";
exports.runtime = "edge";
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var shop, body, signature, event, _a, sub, userId, sub, userId;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, (0, shops_server_1.readShop)(SHOP_ID)];
                case 1:
                    shop = _e.sent();
                    if (shop.billingProvider !== "stripe") {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Billing not enabled" }, { status: 400 })];
                    }
                    return [4 /*yield*/, req.text()];
                case 2:
                    body = _e.sent();
                    signature = (_b = req.headers.get("stripe-signature")) !== null && _b !== void 0 ? _b : "";
                    try {
                        event = stripe_1.stripe.webhooks.constructEvent(body, signature, payments_1.paymentEnv.STRIPE_WEBHOOK_SECRET);
                    }
                    catch (_f) {
                        return [2 /*return*/, new server_1.NextResponse("Invalid signature", { status: 400 })];
                    }
                    _a = event.type;
                    switch (_a) {
                        case "customer.subscription.deleted": return [3 /*break*/, 3];
                        case "customer.subscription.created": return [3 /*break*/, 6];
                        case "customer.subscription.updated": return [3 /*break*/, 6];
                    }
                    return [3 /*break*/, 9];
                case 3:
                    sub = event.data.object;
                    userId = (_c = sub.metadata) === null || _c === void 0 ? void 0 : _c.userId;
                    if (!userId) return [3 /*break*/, 5];
                    return [4 /*yield*/, (0, users_1.setStripeSubscriptionId)(userId, null, SHOP_ID)];
                case 4:
                    _e.sent();
                    _e.label = 5;
                case 5: return [3 /*break*/, 10];
                case 6:
                    sub = event.data.object;
                    userId = (_d = sub.metadata) === null || _d === void 0 ? void 0 : _d.userId;
                    if (!userId) return [3 /*break*/, 8];
                    return [4 /*yield*/, (0, users_1.setStripeSubscriptionId)(userId, sub.id, SHOP_ID)];
                case 7:
                    _e.sent();
                    _e.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9: return [3 /*break*/, 10];
                case 10: return [2 /*return*/, server_1.NextResponse.json({ received: true })];
            }
        });
    });
}
