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
exports.GET = GET;
var server_1 = require("next/server");
var products_1 = require("@platform-core/products");
var products_server_1 = require("@platform-core/repositories/products.server");
var settings_server_1 = require("@platform-core/repositories/settings.server");
var analytics_1 = require("@platform-core/analytics");
var core_1 = require("@acme/config/env/core");
var DEFAULT_FIELDS = ["id", "title", "description", "price", "media"];
exports.runtime = "nodejs";
function parseIntOr(val, def) {
    var n = Number.parseInt(val !== null && val !== void 0 ? val : "", 10);
    return Number.isFinite(n) && n > 0 ? n : def;
}
function GET(req) {
    return __awaiter(this, void 0, void 0, function () {
        var shop, settings, ai, fields, all, lastModifiedDate, lastModified, searchParams, page, limit, start, paged, status, ims, imsDate, items;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    shop = core_1.coreEnv.NEXT_PUBLIC_SHOP_ID || "default";
                    return [4 /*yield*/, (0, settings_server_1.getShopSettings)(shop)];
                case 1:
                    settings = _d.sent();
                    ai = (_a = settings.seo) === null || _a === void 0 ? void 0 : _a.aiCatalog;
                    if (!(ai === null || ai === void 0 ? void 0 : ai.enabled)) {
                        return [2 /*return*/, new server_1.NextResponse(null, { status: 404 })];
                    }
                    fields = (((_b = ai.fields) === null || _b === void 0 ? void 0 : _b.length) ? ai.fields : DEFAULT_FIELDS);
                    return [4 /*yield*/, (0, products_server_1.readRepo)(shop)];
                case 2:
                    all = _d.sent();
                    lastModifiedDate = all.reduce(function (max, p) {
                        var d = p.updated_at ? new Date(p.updated_at) : new Date(0);
                        return d > max ? d : max;
                    }, new Date(0));
                    lastModified = new Date(lastModifiedDate.toUTCString());
                    searchParams = req.nextUrl.searchParams;
                    page = parseIntOr(searchParams.get("page"), 1);
                    limit = parseIntOr(searchParams.get("limit"), (_c = ai.pageSize) !== null && _c !== void 0 ? _c : 50);
                    start = (page - 1) * limit;
                    paged = all.slice(start, start + limit);
                    status = 200;
                    ims = req.headers.get("if-modified-since");
                    if (!ims) return [3 /*break*/, 4];
                    imsDate = new Date(ims);
                    if (!(!Number.isNaN(imsDate.getTime()) && lastModified <= imsDate)) return [3 /*break*/, 4];
                    status = 304;
                    return [4 /*yield*/, (0, analytics_1.trackEvent)(shop, { type: "ai_crawl", page: page, status: status })];
                case 3:
                    _d.sent();
                    return [2 /*return*/, new server_1.NextResponse(null, {
                            status: status,
                            headers: { "Last-Modified": lastModified.toUTCString() },
                        })];
                case 4:
                    items = paged.map(function (p) {
                        var _a, _b, _c, _d;
                        var sku = (0, products_1.getProductById)(p.sku);
                        var item = {};
                        if (fields.includes("id"))
                            item.id = p.id;
                        if (fields.includes("title"))
                            item.title = p.title;
                        if (fields.includes("description"))
                            item.description = p.description;
                        if (fields.includes("price"))
                            item.price = (_b = (_a = p.price) !== null && _a !== void 0 ? _a : sku === null || sku === void 0 ? void 0 : sku.price) !== null && _b !== void 0 ? _b : null;
                        if (fields.includes("media")) {
                            item.media = ((_c = p.media) === null || _c === void 0 ? void 0 : _c.length) ? p.media : (_d = sku === null || sku === void 0 ? void 0 : sku.media) !== null && _d !== void 0 ? _d : [];
                        }
                        return item;
                    });
                    return [4 /*yield*/, (0, analytics_1.trackEvent)(shop, {
                            type: "ai_crawl",
                            page: page,
                            status: status,
                            items: items.length,
                        })];
                case 5:
                    _d.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ items: items, page: page, total: all.length }, { headers: { "Last-Modified": lastModified.toUTCString() } })];
            }
        });
    });
}
