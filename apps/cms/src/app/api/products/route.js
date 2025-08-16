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
exports.GET = GET;
require("@acme/lib/initZod");
var server_1 = require("next/server");
var zod_1 = require("zod");
var json_server_1 = require("@platform-core/repositories/json.server");
var searchSchema = zod_1.z
    .object({
    q: zod_1.z.string().optional(),
    slug: zod_1.z.string().optional(),
    shop: zod_1.z.string().default("abc"),
})
    .strict();
var paramsToObject = function (params) {
    return Object.fromEntries(params.entries());
};
function GET(req) {
    return __awaiter(this, void 0, void 0, function () {
        var searchParams, parsed, _a, q, slug, shop, query, _b, catalogue, inventory, stock, _i, inventory_1, item, toSku, product, matches;
        var _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    searchParams = new URL(req.url).searchParams;
                    parsed = searchSchema.safeParse(paramsToObject(searchParams));
                    if (!parsed.success) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Invalid search parameters" }, { status: 400 })];
                    }
                    _a = parsed.data, q = _a.q, slug = _a.slug, shop = _a.shop;
                    query = (_c = q === null || q === void 0 ? void 0 : q.toLowerCase()) !== null && _c !== void 0 ? _c : "";
                    return [4 /*yield*/, Promise.all([
                            (0, json_server_1.readRepo)(shop),
                            (0, json_server_1.readInventory)(shop),
                        ])];
                case 1:
                    _b = _e.sent(), catalogue = _b[0], inventory = _b[1];
                    stock = new Map();
                    for (_i = 0, inventory_1 = inventory; _i < inventory_1.length; _i++) {
                        item = inventory_1[_i];
                        stock.set(item.productId, ((_d = stock.get(item.productId)) !== null && _d !== void 0 ? _d : 0) + item.quantity);
                    }
                    toSku = function (p) {
                        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                        return ({
                            slug: (_a = p.sku) !== null && _a !== void 0 ? _a : p.id,
                            title: (_e = (_c = (_b = p.title) === null || _b === void 0 ? void 0 : _b.en) !== null && _c !== void 0 ? _c : Object.values((_d = p.title) !== null && _d !== void 0 ? _d : {})[0]) !== null && _e !== void 0 ? _e : "",
                            price: (_f = p.price) !== null && _f !== void 0 ? _f : 0,
                            media: (_g = p.media) !== null && _g !== void 0 ? _g : [],
                            stock: (_h = stock.get(p.id)) !== null && _h !== void 0 ? _h : 0,
                            availability: (_j = p.availability) !== null && _j !== void 0 ? _j : [],
                        });
                    };
                    if (slug) {
                        product = catalogue.find(function (p) { return p.sku === slug || p.id === slug; });
                        if (!product)
                            return [2 /*return*/, server_1.NextResponse.json({ error: "Not found" }, { status: 404 })];
                        return [2 /*return*/, server_1.NextResponse.json(toSku(product))];
                    }
                    matches = catalogue;
                    if (query) {
                        matches = matches.filter(function (p) {
                            var _a, _b, _c, _d;
                            var title = (_d = (_b = (_a = p.title) === null || _a === void 0 ? void 0 : _a.en) !== null && _b !== void 0 ? _b : Object.values((_c = p.title) !== null && _c !== void 0 ? _c : {})[0]) !== null && _d !== void 0 ? _d : "";
                            return title.toLowerCase().includes(query);
                        });
                    }
                    return [2 /*return*/, server_1.NextResponse.json(matches.slice(0, 5).map(toSku))];
            }
        });
    });
}
