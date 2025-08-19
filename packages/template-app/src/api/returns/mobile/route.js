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
var rentalOrders_server_1 = require("@platform-core/repositories/rentalOrders.server");
var returnLogistics_1 = require("@platform-core/returnLogistics");
var orders_1 = require("@platform-core/orders");
var server_1 = require("next/server");
var shops_server_1 = require("@platform-core/repositories/shops.server");
var settings_server_1 = require("@platform-core/repositories/settings.server");
var SHOP_ID = "bcd";
exports.runtime = "edge";
function createUpsLabel(sessionId) {
    return __awaiter(this, void 0, void 0, function () {
        var trackingNumber, labelUrl, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    trackingNumber = "1Z".concat(Math.random().toString().slice(2, 12));
                    labelUrl = "https://www.ups.com/track?loc=en_US&tracknum=".concat(trackingNumber);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch("https://www.ups.com/track/api/Track/GetStatus?loc=en_US&tracknum=".concat(trackingNumber))];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4: return [4 /*yield*/, (0, orders_1.setReturnTracking)(SHOP_ID, sessionId, trackingNumber, labelUrl)];
                case 5:
                    _b.sent();
                    return [2 /*return*/, { trackingNumber: trackingNumber, labelUrl: labelUrl }];
            }
        });
    });
}
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var shop, _a, cfg, info, settings, _b, sessionId, zip, order, labelUrl, tracking, label;
        var _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, (0, shops_server_1.readShop)(SHOP_ID)];
                case 1:
                    shop = _e.sent();
                    if (!shop.returnsEnabled) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Returns disabled" }, { status: 403 })];
                    }
                    return [4 /*yield*/, Promise.all([
                            (0, returnLogistics_1.getReturnLogistics)(),
                            (0, returnLogistics_1.getReturnBagAndLabel)(),
                            (0, settings_server_1.getShopSettings)(SHOP_ID),
                        ])];
                case 2:
                    _a = _e.sent(), cfg = _a[0], info = _a[1], settings = _a[2];
                    if (!cfg.mobileApp) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Mobile returns disabled" }, { status: 403 })];
                    }
                    return [4 /*yield*/, req.json()];
                case 3:
                    _b = (_e.sent()), sessionId = _b.sessionId, zip = _b.zip;
                    if (!sessionId) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Missing sessionId" }, { status: 400 })];
                    }
                    if (zip) {
                        if (!((_c = settings.returnService) === null || _c === void 0 ? void 0 : _c.homePickupEnabled)) {
                            return [2 /*return*/, server_1.NextResponse.json({ error: "Home pickup disabled" }, { status: 403 })];
                        }
                        if (!info.homePickupZipCodes.includes(zip)) {
                            return [2 /*return*/, server_1.NextResponse.json({ error: "ZIP not eligible" }, { status: 400 })];
                        }
                    }
                    return [4 /*yield*/, (0, rentalOrders_server_1.markReturned)(SHOP_ID, sessionId)];
                case 4:
                    order = _e.sent();
                    if (!order) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Order not found" }, { status: 404 })];
                    }
                    labelUrl = null;
                    tracking = null;
                    if (!(((_d = settings.returnService) === null || _d === void 0 ? void 0 : _d.upsEnabled) &&
                        info.returnCarrier.includes("ups"))) return [3 /*break*/, 6];
                    return [4 /*yield*/, createUpsLabel(sessionId)];
                case 5:
                    label = _e.sent();
                    labelUrl = label.labelUrl;
                    tracking = label.trackingNumber;
                    _e.label = 6;
                case 6: return [2 /*return*/, server_1.NextResponse.json({ ok: true, labelUrl: labelUrl, tracking: tracking })];
            }
        });
    });
}
