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
exports.GET = GET;
// apps/shop-abc/src/app/api/delivery/schedule/route.ts
require("@acme/zod-utils/initZod");
var settings_server_1 = require("@platform-core/repositories/settings.server");
var server_1 = require("next/server");
var zod_1 = require("zod");
var _shared_utils_1 = require("@shared-utils");
var shop_json_1 = require("../../../../shop.json");
var plugins_1 = require("@platform-core/plugins");
var node_path_1 = require("node:path");
var node_url_1 = require("node:url");
exports.runtime = "edge";
var __dirname = node_path_1.default.dirname((0, node_url_1.fileURLToPath)(import.meta.url));
var pluginsDir = node_path_1.default.resolve(__dirname, "../../../../../../packages/plugins");
var pluginsReady = (0, plugins_1.initPlugins)({
    directories: [pluginsDir],
    config: __assign(__assign({}, shop_json_1.default.plugins), { "premier-shipping": shop_json_1.default.premierDelivery }),
});
var schema = zod_1.z
    .object({
    region: zod_1.z.string(),
    window: zod_1.z.string(),
    carrier: zod_1.z.string().optional(),
})
    .strict();
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var parsed, settings, pd, res;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, _shared_utils_1.parseJsonBody)(req, schema, "1mb")];
                case 1:
                    parsed = _b.sent();
                    if (!parsed.success)
                        return [2 /*return*/, parsed.response];
                    return [4 /*yield*/, (0, settings_server_1.getShopSettings)(shop_json_1.default.id)];
                case 2:
                    settings = _b.sent();
                    pd = settings.premierDelivery;
                    if (!((_a = settings.luxuryFeatures) === null || _a === void 0 ? void 0 : _a.premierDelivery) ||
                        !pd ||
                        !pd.regions.includes(parsed.data.region) ||
                        !pd.windows.includes(parsed.data.window)) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Premier delivery not available" }, { status: 400 })];
                    }
                    res = server_1.NextResponse.json({ ok: true });
                    res.cookies.set("delivery", JSON.stringify({
                        region: parsed.data.region,
                        window: parsed.data.window,
                        carrier: parsed.data.carrier,
                    }), { path: "/" });
                    return [2 /*return*/, res];
            }
        });
    });
}
function GET(req) {
    return __awaiter(this, void 0, void 0, function () {
        var region, settings, manager, provider, slots;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    region = (_a = req.nextUrl.searchParams.get("region")) !== null && _a !== void 0 ? _a : "";
                    return [4 /*yield*/, (0, settings_server_1.getShopSettings)(shop_json_1.default.id)];
                case 1:
                    settings = _c.sent();
                    if (!((_b = settings.luxuryFeatures) === null || _b === void 0 ? void 0 : _b.premierDelivery) ||
                        !settings.premierDelivery ||
                        !region ||
                        !settings.premierDelivery.regions.includes(region)) {
                        return [2 /*return*/, server_1.NextResponse.json({ windows: [], carriers: [] })];
                    }
                    return [4 /*yield*/, pluginsReady];
                case 2:
                    manager = _c.sent();
                    provider = manager.shipping.get("premier-shipping");
                    if (!provider) {
                        return [2 /*return*/, server_1.NextResponse.json({ windows: [], carriers: [] })];
                    }
                    try {
                        slots = provider.getAvailableSlots(region);
                        return [2 /*return*/, server_1.NextResponse.json(slots)];
                    }
                    catch (_d) {
                        return [2 /*return*/, server_1.NextResponse.json({ windows: [], carriers: [] })];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
