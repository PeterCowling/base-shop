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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
exports.PUT = PUT;
exports.DELETE = DELETE;
var options_1 = require("@cms/auth/options");
var next_auth_1 = require("next-auth");
var server_1 = require("next/server");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var dataRoot_1 = require("@platform-core/dataRoot");
var analytics_server_1 = require("@platform-core/repositories/analytics.server");
var config_1 = require("@acme/config");
function getShop(req) {
    var searchParams = new URL(req.url).searchParams;
    return (searchParams.get("shop") || config_1.env.NEXT_PUBLIC_DEFAULT_SHOP || "abc");
}
function filePath(shop) {
    return node_path_1.default.join((0, dataRoot_1.resolveDataRoot)(), shop, "discounts.json");
}
function readDiscounts(shop) {
    return __awaiter(this, void 0, void 0, function () {
        var buf, parsed, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, node_fs_1.promises.readFile(filePath(shop), "utf8")];
                case 1:
                    buf = _b.sent();
                    parsed = JSON.parse(buf);
                    return [2 /*return*/, Array.isArray(parsed) ? parsed : []];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function writeDiscounts(shop, discounts) {
    return __awaiter(this, void 0, void 0, function () {
        var fp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fp = filePath(shop);
                    return [4 /*yield*/, node_fs_1.promises.mkdir(node_path_1.default.dirname(fp), { recursive: true })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, node_fs_1.promises.writeFile(fp, JSON.stringify(discounts, null, 2), "utf8")];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function requireAdmin() {
    return __awaiter(this, void 0, void 0, function () {
        var session;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, next_auth_1.getServerSession)(options_1.authOptions)];
                case 1:
                    session = _a.sent();
                    if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Forbidden" }, { status: 403 })];
                    }
                    return [2 /*return*/, null];
            }
        });
    });
}
function GET(req) {
    return __awaiter(this, void 0, void 0, function () {
        var shop, _a, discounts, events, counts, _i, events_1, e, code;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    shop = getShop(req);
                    return [4 /*yield*/, Promise.all([
                            readDiscounts(shop),
                            (0, analytics_server_1.listEvents)(shop),
                        ])];
                case 1:
                    _a = _b.sent(), discounts = _a[0], events = _a[1];
                    counts = {};
                    for (_i = 0, events_1 = events; _i < events_1.length; _i++) {
                        e = events_1[_i];
                        if (e.type === "discount_redeemed" && typeof e.code === "string") {
                            code = e.code;
                            counts[code] = (counts[code] || 0) + 1;
                        }
                    }
                    return [2 /*return*/, server_1.NextResponse.json(discounts.map(function (d) { return (__assign(__assign({}, d), { redemptions: counts[d.code] || 0 })); }))];
            }
        });
    });
}
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var forbidden, shop, _a, code_1, description, discountPercent, discounts, idx, entry, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, requireAdmin()];
                case 1:
                    forbidden = _b.sent();
                    if (forbidden)
                        return [2 /*return*/, forbidden];
                    shop = getShop(req);
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 6, , 7]);
                    return [4 /*yield*/, req.json()];
                case 3:
                    _a = (_b.sent()), code_1 = _a.code, description = _a.description, discountPercent = _a.discountPercent;
                    if (!code_1 || typeof discountPercent !== "number") {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Invalid" }, { status: 400 })];
                    }
                    return [4 /*yield*/, readDiscounts(shop)];
                case 4:
                    discounts = _b.sent();
                    idx = discounts.findIndex(function (d) { return d.code.toLowerCase() === code_1.toLowerCase(); });
                    entry = { code: code_1, description: description, discountPercent: discountPercent, active: true };
                    if (idx >= 0)
                        discounts[idx] = entry;
                    else
                        discounts.push(entry);
                    return [4 /*yield*/, writeDiscounts(shop, discounts)];
                case 5:
                    _b.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ success: true })];
                case 6:
                    err_1 = _b.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ error: err_1.message }, { status: 400 })];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function PUT(req) {
    return __awaiter(this, void 0, void 0, function () {
        var forbidden, shop, _a, code_2, rest, discounts, idx, err_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, requireAdmin()];
                case 1:
                    forbidden = _b.sent();
                    if (forbidden)
                        return [2 /*return*/, forbidden];
                    shop = getShop(req);
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 6, , 7]);
                    return [4 /*yield*/, req.json()];
                case 3:
                    _a = (_b.sent()), code_2 = _a.code, rest = __rest(_a, ["code"]);
                    if (!code_2) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Missing code" }, { status: 400 })];
                    }
                    return [4 /*yield*/, readDiscounts(shop)];
                case 4:
                    discounts = _b.sent();
                    idx = discounts.findIndex(function (d) { return d.code.toLowerCase() === code_2.toLowerCase(); });
                    if (idx < 0) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Not found" }, { status: 404 })];
                    }
                    discounts[idx] = __assign(__assign({}, discounts[idx]), rest);
                    return [4 /*yield*/, writeDiscounts(shop, discounts)];
                case 5:
                    _b.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ success: true })];
                case 6:
                    err_2 = _b.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ error: err_2.message }, { status: 400 })];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function DELETE(req) {
    return __awaiter(this, void 0, void 0, function () {
        var forbidden, shop, searchParams, code_3, discounts, filtered, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, requireAdmin()];
                case 1:
                    forbidden = _a.sent();
                    if (forbidden)
                        return [2 /*return*/, forbidden];
                    shop = getShop(req);
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    searchParams = new URL(req.url).searchParams;
                    code_3 = searchParams.get("code");
                    if (!code_3) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Missing code" }, { status: 400 })];
                    }
                    return [4 /*yield*/, readDiscounts(shop)];
                case 3:
                    discounts = _a.sent();
                    filtered = discounts.filter(function (d) { return d.code.toLowerCase() !== code_3.toLowerCase(); });
                    return [4 /*yield*/, writeDiscounts(shop, filtered)];
                case 4:
                    _a.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ success: true })];
                case 5:
                    err_3 = _a.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ error: err_3.message }, { status: 400 })];
                case 6: return [2 /*return*/];
            }
        });
    });
}
