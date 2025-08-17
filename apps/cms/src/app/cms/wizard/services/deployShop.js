// apps/cms/src/app/cms/wizard/services/deployShop.ts
"use client";
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
exports.deployShop = deployShop;
exports.getDeployStatus = getDeployStatus;
var shops_1 = require("@platform-core/shops");
function deployShop(shopId, domain) {
    return __awaiter(this, void 0, void 0, function () {
        var res, json, info, cfRes, cfJson, err_1;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    try {
                        (0, shops_1.validateShopName)(shopId);
                    }
                    catch (err) {
                        return [2 /*return*/, {
                                ok: false,
                                error: err instanceof Error ? err.message : String(err),
                            }];
                    }
                    return [4 /*yield*/, fetch("/cms/api/configurator/deploy-shop", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: shopId, domain: domain }),
                        })];
                case 1:
                    res = _d.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    json = (_d.sent());
                    if (!res.ok) {
                        return [2 /*return*/, { ok: false, error: (_a = json.error) !== null && _a !== void 0 ? _a : "Deployment failed" }];
                    }
                    info = json;
                    if (!domain) return [3 /*break*/, 8];
                    _d.label = 3;
                case 3:
                    _d.trys.push([3, 7, , 8]);
                    return [4 /*yield*/, fetch("/cms/api/cloudflare", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: shopId, domain: domain }),
                        })];
                case 4:
                    cfRes = _d.sent();
                    return [4 /*yield*/, cfRes.json()];
                case 5:
                    cfJson = (_d.sent());
                    if (!cfRes.ok) {
                        throw new Error((_b = cfJson.error) !== null && _b !== void 0 ? _b : "Failed to provision domain");
                    }
                    info = __assign(__assign({}, json), { domainStatus: (_c = cfJson.status) !== null && _c !== void 0 ? _c : json.domainStatus, certificateStatus: cfJson.certificateStatus });
                    return [4 /*yield*/, fetch("/cms/api/configurator/deploy-shop", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                id: shopId,
                                domain: domain,
                                domainStatus: cfJson.status,
                                certificateStatus: cfJson.certificateStatus,
                            }),
                        })];
                case 6:
                    _d.sent();
                    return [3 /*break*/, 8];
                case 7:
                    err_1 = _d.sent();
                    return [2 /*return*/, {
                            ok: false,
                            error: err_1 instanceof Error ? err_1.message : String(err_1),
                        }];
                case 8: return [2 /*return*/, { ok: true, info: info }];
            }
        });
    });
}
function getDeployStatus(shopId) {
    return __awaiter(this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("/cms/api/configurator/deploy-shop?id=".concat(shopId))];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2: return [2 /*return*/, (_a.sent())];
            }
        });
    });
}
