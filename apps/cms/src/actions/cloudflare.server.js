// apps/cms/src/actions/cloudflare.server.ts
"use server";
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
exports.provisionDomain = provisionDomain;
var config_1 = require("@acme/config");
var auth_1 = require("./common/auth");
function provisionDomain(shopId, domain) {
    return __awaiter(this, void 0, void 0, function () {
        var account, token, headers, addRes, addJson, cnameTarget, root, zoneRes, zoneJson, zoneId, verifyRes, verifyJson;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    _o.sent();
                    account = config_1.env.CLOUDFLARE_ACCOUNT_ID;
                    token = config_1.env.CLOUDFLARE_API_TOKEN;
                    if (!account || !token)
                        throw new Error("Cloudflare credentials not configured");
                    headers = {
                        "Content-Type": "application/json",
                        Authorization: "Bearer ".concat(token),
                    };
                    return [4 /*yield*/, fetch("https://api.cloudflare.com/client/v4/accounts/".concat(account, "/pages/projects/").concat(shopId, "/domains"), {
                            method: "POST",
                            headers: headers,
                            body: JSON.stringify({ name: domain }),
                        })];
                case 2:
                    addRes = _o.sent();
                    return [4 /*yield*/, addRes.json()];
                case 3:
                    addJson = (_o.sent());
                    if (!addRes.ok) {
                        throw new Error((_c = (_b = (_a = addJson.errors) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) !== null && _c !== void 0 ? _c : "Failed to provision domain");
                    }
                    cnameTarget = ((_e = (_d = addJson.result) === null || _d === void 0 ? void 0 : _d.verification_data) === null || _e === void 0 ? void 0 : _e.cname_target) || "".concat(shopId, ".pages.dev");
                    root = domain.split(".").slice(-2).join(".");
                    return [4 /*yield*/, fetch("https://api.cloudflare.com/client/v4/zones?name=".concat(root), {
                            headers: headers,
                        })];
                case 4:
                    zoneRes = _o.sent();
                    return [4 /*yield*/, zoneRes.json()];
                case 5:
                    zoneJson = (_o.sent());
                    zoneId = (_g = (_f = zoneJson.result) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.id;
                    if (!zoneId) return [3 /*break*/, 7];
                    return [4 /*yield*/, fetch("https://api.cloudflare.com/client/v4/zones/".concat(zoneId, "/dns_records"), {
                            method: "POST",
                            headers: headers,
                            body: JSON.stringify({
                                type: "CNAME",
                                name: domain,
                                content: cnameTarget,
                                ttl: 1,
                            }),
                        }).catch(function () { })];
                case 6:
                    _o.sent();
                    _o.label = 7;
                case 7: return [4 /*yield*/, fetch("https://api.cloudflare.com/client/v4/accounts/".concat(account, "/pages/projects/").concat(shopId, "/domains/").concat(domain, "/verify"), { method: "POST", headers: headers })];
                case 8:
                    verifyRes = _o.sent();
                    return [4 /*yield*/, verifyRes.json()];
                case 9:
                    verifyJson = (_o.sent());
                    if (!verifyRes.ok) {
                        throw new Error((_k = (_j = (_h = verifyJson.errors) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.message) !== null && _k !== void 0 ? _k : "Failed to issue certificate");
                    }
                    return [2 /*return*/, {
                            status: (_l = verifyJson.result) === null || _l === void 0 ? void 0 : _l.status,
                            certificateStatus: (_m = verifyJson.result) === null || _m === void 0 ? void 0 : _m.certificate_status,
                        }];
            }
        });
    });
}
