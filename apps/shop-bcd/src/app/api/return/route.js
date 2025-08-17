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
exports.GET = GET;
// apps/shop-bcd/src/app/api/return/route.ts
require("@acme/zod-utils/initZod");
var server_1 = require("next/server");
var zod_1 = require("zod");
var _shared_utils_1 = require("@shared-utils");
var orders_1 = require("@platform-core/orders");
var returnLogistics_1 = require("@platform-core/returnLogistics");
var shop_json_1 = require("../../../../shop.json");
exports.runtime = "nodejs";
var ReturnSchema = zod_1.z.object({ sessionId: zod_1.z.string() }).strict();
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
                case 4: return [4 /*yield*/, (0, orders_1.setReturnTracking)(shop_json_1.default.id, sessionId, trackingNumber, labelUrl)];
                case 5:
                    _b.sent();
                    return [2 /*return*/, { trackingNumber: trackingNumber, labelUrl: labelUrl }];
            }
        });
    });
}
function getUpsStatus(tracking) {
    return __awaiter(this, void 0, void 0, function () {
        var res, data, _a;
        var _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _f.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("https://www.ups.com/track/api/Track/GetStatus?loc=en_US&tracknum=".concat(tracking))];
                case 1:
                    res = _f.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _f.sent();
                    return [2 /*return*/, (_e = (_d = (_c = (_b = data === null || data === void 0 ? void 0 : data.trackDetails) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.packageStatus) === null || _d === void 0 ? void 0 : _d.statusType) !== null && _e !== void 0 ? _e : null];
                case 3:
                    _a = _f.sent();
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var parsed, sessionId, cfg, svc, _a, trackingNumber, labelUrl;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, (0, _shared_utils_1.parseJsonBody)(req, ReturnSchema, "1mb")];
                case 1:
                    parsed = _d.sent();
                    if (parsed.success === false) {
                        return [2 /*return*/, parsed.response];
                    }
                    sessionId = parsed.data.sessionId;
                    return [4 /*yield*/, (0, returnLogistics_1.getReturnLogistics)()];
                case 2:
                    cfg = _d.sent();
                    svc = ((_b = shop_json_1.default.returnService) !== null && _b !== void 0 ? _b : {});
                    if (!(cfg.labelService === "ups" && svc.upsEnabled && cfg.returnCarrier.includes("ups"))) {
                        return [2 /*return*/, server_1.NextResponse.json({ ok: false, error: "unsupported carrier" }, { status: 400 })];
                    }
                    return [4 /*yield*/, createUpsLabel(sessionId)];
                case 3:
                    _a = _d.sent(), trackingNumber = _a.trackingNumber, labelUrl = _a.labelUrl;
                    return [2 /*return*/, server_1.NextResponse.json({
                            ok: true,
                            dropOffProvider: (_c = cfg.dropOffProvider) !== null && _c !== void 0 ? _c : null,
                            returnCarrier: cfg.returnCarrier,
                            tracking: { number: trackingNumber, labelUrl: labelUrl },
                            bagType: svc.bagEnabled ? cfg.bagType : null,
                            homePickupZipCodes: svc.homePickupEnabled ? cfg.homePickupZipCodes : [],
                        })];
            }
        });
    });
}
function GET(req) {
    return __awaiter(this, void 0, void 0, function () {
        var tracking, cfg, svc, status;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    tracking = req.nextUrl.searchParams.get("tracking");
                    if (!tracking) {
                        return [2 /*return*/, server_1.NextResponse.json({ ok: false, error: "missing tracking" }, { status: 400 })];
                    }
                    return [4 /*yield*/, (0, returnLogistics_1.getReturnLogistics)()];
                case 1:
                    cfg = _b.sent();
                    svc = ((_a = shop_json_1.default.returnService) !== null && _a !== void 0 ? _a : {});
                    if (!(cfg.labelService === "ups" && svc.upsEnabled && cfg.returnCarrier.includes("ups"))) {
                        return [2 /*return*/, server_1.NextResponse.json({ ok: false, error: "unsupported carrier" }, { status: 400 })];
                    }
                    return [4 /*yield*/, getUpsStatus(tracking)];
                case 2:
                    status = _b.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ ok: true, status: status })];
            }
        });
    });
}
