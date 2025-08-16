// apps/cms/src/app/cms/wizard/services/submitShop.ts
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitShop = submitShop;
var createShop_1 = require("@platform-core/createShop");
var shops_1 = require("@platform-core/src/shops");
var tokenUtils_1 = require("../tokenUtils");
function serializeNavItems(items) {
    return items.map(function (_a) {
        var label = _a.label, url = _a.url, children = _a.children;
        return (__assign({ label: label, url: url }, (children && children.length
            ? { children: serializeNavItems(children) }
            : {})));
    });
}
function submitShop(shopId, state) {
    return __awaiter(this, void 0, void 0, function () {
        var storeName, logo, contactInfo, type, template, theme, themeVars, payment, shipping, pageTitle, pageDescription, socialImage, navItems, pages, checkoutComponents, analyticsProvider, analyticsId, env, defaults, themeOverrides, options, parsed, errs, _i, _a, issue, key, res, json, errors, envRes, envJson, valRes, valJson, _b, providerRes, providerJson, _c;
        var _d, _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
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
                    storeName = state.storeName, logo = state.logo, contactInfo = state.contactInfo, type = state.type, template = state.template, theme = state.theme, themeVars = state.themeVars, payment = state.payment, shipping = state.shipping, pageTitle = state.pageTitle, pageDescription = state.pageDescription, socialImage = state.socialImage, navItems = state.navItems, pages = state.pages, checkoutComponents = state.checkoutComponents, analyticsProvider = state.analyticsProvider, analyticsId = state.analyticsId, env = state.env;
                    return [4 /*yield*/, (0, tokenUtils_1.loadThemeTokens)(theme)];
                case 1:
                    defaults = _j.sent();
                    themeOverrides = Object.fromEntries(Object.entries(themeVars !== null && themeVars !== void 0 ? themeVars : {}).filter(function (_a) {
                        var k = _a[0], v = _a[1];
                        return defaults[k] !== v;
                    }));
                    options = {
                        name: storeName || undefined,
                        logo: logo || undefined,
                        contactInfo: contactInfo || undefined,
                        type: type,
                        template: template,
                        theme: theme,
                        themeOverrides: themeOverrides,
                        payment: payment,
                        shipping: shipping,
                        analytics: analyticsProvider
                            ? { provider: analyticsProvider, id: analyticsId || undefined }
                            : undefined,
                        pageTitle: pageTitle,
                        pageDescription: pageDescription,
                        socialImage: socialImage || undefined,
                        navItems: serializeNavItems(navItems),
                        pages: pages.map(function (p) { return ({
                            slug: p.slug,
                            title: p.title,
                            description: p.description,
                            image: p.image,
                            components: p.components,
                        }); }),
                        checkoutPage: checkoutComponents,
                    };
                    parsed = createShop_1.createShopOptionsSchema.safeParse(options);
                    if (!parsed.success) {
                        errs = {};
                        for (_i = 0, _a = parsed.error.issues; _i < _a.length; _i++) {
                            issue = _a[_i];
                            key = issue.path.join(".");
                            errs[key] = __spreadArray(__spreadArray([], ((_d = errs[key]) !== null && _d !== void 0 ? _d : []), true), [issue.message], false);
                        }
                        return [2 /*return*/, { ok: false, fieldErrors: errs }];
                    }
                    return [4 /*yield*/, fetch("/cms/api/configurator", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(__assign({ id: shopId }, parsed.data)),
                        })];
                case 2:
                    res = _j.sent();
                    return [4 /*yield*/, res.json().catch(function () { return ({}); })];
                case 3:
                    json = (_j.sent());
                    if (!res.ok) return [3 /*break*/, 18];
                    errors = [];
                    if (!(env && Object.keys(env).length > 0)) return [3 /*break*/, 12];
                    _j.label = 4;
                case 4:
                    _j.trys.push([4, 11, , 12]);
                    return [4 /*yield*/, fetch("/cms/api/env/".concat(shopId), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(env),
                        })];
                case 5:
                    envRes = _j.sent();
                    if (!!envRes.ok) return [3 /*break*/, 7];
                    return [4 /*yield*/, envRes.json().catch(function () { return ({}); })];
                case 6:
                    envJson = (_j.sent());
                    errors.push((_e = envJson.error) !== null && _e !== void 0 ? _e : "Failed to save environment variables");
                    return [3 /*break*/, 10];
                case 7: return [4 /*yield*/, fetch("/cms/api/configurator/validate-env/".concat(shopId))];
                case 8:
                    valRes = _j.sent();
                    if (!!valRes.ok) return [3 /*break*/, 10];
                    return [4 /*yield*/, valRes.json().catch(function () { return ({}); })];
                case 9:
                    valJson = (_j.sent());
                    errors.push((_f = valJson.error) !== null && _f !== void 0 ? _f : "Environment validation failed");
                    _j.label = 10;
                case 10: return [3 /*break*/, 12];
                case 11:
                    _b = _j.sent();
                    errors.push("Failed to save environment variables");
                    return [3 /*break*/, 12];
                case 12:
                    _j.trys.push([12, 16, , 17]);
                    return [4 /*yield*/, fetch("/cms/api/providers/shop/".concat(shopId), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ payment: payment, shipping: shipping }),
                        })];
                case 13:
                    providerRes = _j.sent();
                    if (!!providerRes.ok) return [3 /*break*/, 15];
                    return [4 /*yield*/, providerRes.json().catch(function () { return ({}); })];
                case 14:
                    providerJson = (_j.sent());
                    errors.push((_g = providerJson.error) !== null && _g !== void 0 ? _g : "Failed to save provider configuration");
                    _j.label = 15;
                case 15: return [3 /*break*/, 17];
                case 16:
                    _c = _j.sent();
                    errors.push("Failed to save provider configuration");
                    return [3 /*break*/, 17];
                case 17: return [2 /*return*/, __assign({ ok: errors.length === 0, deployment: json.deployment }, (errors.length ? { error: errors.join("; ") } : {}))];
                case 18: return [2 /*return*/, { ok: false, error: (_h = json.error) !== null && _h !== void 0 ? _h : "Failed to create shop" }];
            }
        });
    });
}
