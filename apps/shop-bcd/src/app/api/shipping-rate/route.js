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
// apps/shop-bcd/src/app/api/shipping-rate/route.ts
require("@acme/zod-utils/initZod");
var shipping_1 = require("@platform-core/shipping");
var settings_server_1 = require("@platform-core/repositories/settings.server");
var shop_json_1 = require("../../../../shop.json");
var server_1 = require("next/server");
var zod_1 = require("zod");
var _shared_utils_1 = require("@shared-utils");
exports.runtime = "edge";
var schema = zod_1.z
    .object({
    provider: zod_1.z.enum(["ups", "dhl", "premier-shipping"]),
    fromPostalCode: zod_1.z.string(),
    toPostalCode: zod_1.z.string(),
    weight: zod_1.z.number(),
    region: zod_1.z.string().optional(),
    window: zod_1.z.string().optional(),
    carrier: zod_1.z.string().optional(),
})
    .superRefine(function (val, ctx) {
    if (val.provider === "premier-shipping") {
        if (!val.region) {
            ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ["region"], message: "Required" });
        }
        if (!val.window) {
            ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ["window"], message: "Required" });
        }
        if (!val.carrier) {
            ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ["carrier"], message: "Required" });
        }
    }
});
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var parsed, body, premierDelivery, provider, settings, rate, err_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, _shared_utils_1.parseJsonBody)(req, schema, "1mb")];
                case 1:
                    parsed = _b.sent();
                    if (parsed.success === false) {
                        return [2 /*return*/, parsed.response];
                    }
                    body = parsed.data;
                    provider = body.provider;
                    if (!(body.provider === "premier-shipping")) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, settings_server_1.getShopSettings)(shop_json_1.default.id)];
                case 2:
                    settings = _b.sent();
                    if (((_a = settings.luxuryFeatures) === null || _a === void 0 ? void 0 : _a.premierDelivery) &&
                        settings.premierDelivery &&
                        body.region &&
                        settings.premierDelivery.regions.includes(body.region)) {
                        premierDelivery = settings.premierDelivery;
                    }
                    else {
                        provider = "dhl";
                    }
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, (0, shipping_1.getShippingRate)({
                            provider: provider,
                            fromPostalCode: body.fromPostalCode,
                            toPostalCode: body.toPostalCode,
                            weight: body.weight,
                            region: body.region,
                            window: body.window,
                            carrier: body.carrier,
                            premierDelivery: premierDelivery,
                        })];
                case 4:
                    rate = _b.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ rate: rate })];
                case 5:
                    err_1 = _b.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ error: err_1.message }, { status: 500 })];
                case 6: return [2 /*return*/];
            }
        });
    });
}
