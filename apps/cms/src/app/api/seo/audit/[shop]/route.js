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
exports.POST = POST;
var server_1 = require("next/server");
var lib_1 = require("@acme/lib");
var lighthouse_1 = require("lighthouse");
var chrome_launcher_1 = require("chrome-launcher");
var seoAudit_server_1 = require("@platform-core/repositories/seoAudit.server");
function runLighthouse(url) {
    return __awaiter(this, void 0, void 0, function () {
        var chrome, result, lhr, score, recommendations;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, chrome_launcher_1.default.launch({ chromeFlags: ["--headless"] })];
                case 1:
                    chrome = _d.sent();
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, , 4, 6]);
                    return [4 /*yield*/, (0, lighthouse_1.default)(url, {
                            port: chrome.port,
                            onlyCategories: ["seo"],
                            preset: "desktop",
                        })];
                case 3:
                    result = _d.sent();
                    lhr = result.lhr;
                    score = Math.round(((_c = (_b = (_a = lhr.categories) === null || _a === void 0 ? void 0 : _a.seo) === null || _b === void 0 ? void 0 : _b.score) !== null && _c !== void 0 ? _c : 0) * 100);
                    recommendations = Object.values(lhr.audits)
                        .filter(function (a) {
                        return a.score !== 1 &&
                            a.scoreDisplayMode !== "notApplicable" &&
                            a.title;
                    })
                        .map(function (a) { return a.title; });
                    return [2 /*return*/, { timestamp: new Date().toISOString(), score: score, recommendations: recommendations }];
                case 4: return [4 /*yield*/, chrome.kill()];
                case 5:
                    _d.sent();
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function GET(_req, context) {
    return __awaiter(this, void 0, void 0, function () {
        var shop, safeShop, audits;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, context.params];
                case 1:
                    shop = (_a.sent()).shop;
                    safeShop = (0, lib_1.validateShopName)(shop);
                    return [4 /*yield*/, (0, seoAudit_server_1.readSeoAudits)(safeShop)];
                case 2:
                    audits = _a.sent();
                    return [2 /*return*/, server_1.NextResponse.json(audits)];
            }
        });
    });
}
function POST(req, context) {
    return __awaiter(this, void 0, void 0, function () {
        var shop, safeShop, body, url, record;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, context.params];
                case 1:
                    shop = (_a.sent()).shop;
                    safeShop = (0, lib_1.validateShopName)(shop);
                    return [4 /*yield*/, req.json().catch(function () { return ({}); })];
                case 2:
                    body = _a.sent();
                    url = body.url || "http://localhost:3000/".concat(safeShop);
                    return [4 /*yield*/, runLighthouse(url)];
                case 3:
                    record = _a.sent();
                    return [4 /*yield*/, (0, seoAudit_server_1.appendSeoAudit)(safeShop, record)];
                case 4:
                    _a.sent();
                    return [2 /*return*/, server_1.NextResponse.json(record)];
            }
        });
    });
}
