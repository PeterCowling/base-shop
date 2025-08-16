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
exports.createShop = createShop;
var createShop_1 = require("@platform-core/createShop");
var shops_1 = require("@platform-core/src/shops");
function serializeNavItems(items) {
    return items.map(function (_a) {
        var label = _a.label, url = _a.url, children = _a.children;
        return (__assign({ label: label, url: url }, (children && children.length
            ? { children: serializeNavItems(children) }
            : {})));
    });
}
function createShop(shopId, state) {
    return __awaiter(this, void 0, void 0, function () {
        var storeName, logo, contactInfo, type, template, theme, payment, shipping, pageTitle, pageDescription, socialImage, navItems, pages, checkoutComponents, analyticsProvider, analyticsId, options, parsed, errs, _i, _a, issue, key, res, json;
        var _b, _c;
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
                    storeName = state.storeName, logo = state.logo, contactInfo = state.contactInfo, type = state.type, template = state.template, theme = state.theme, payment = state.payment, shipping = state.shipping, pageTitle = state.pageTitle, pageDescription = state.pageDescription, socialImage = state.socialImage, navItems = state.navItems, pages = state.pages, checkoutComponents = state.checkoutComponents, analyticsProvider = state.analyticsProvider, analyticsId = state.analyticsId;
                    options = {
                        name: storeName || undefined,
                        logo: logo || undefined,
                        contactInfo: contactInfo || undefined,
                        type: type,
                        template: template,
                        theme: theme,
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
                            errs[key] = __spreadArray(__spreadArray([], ((_b = errs[key]) !== null && _b !== void 0 ? _b : []), true), [issue.message], false);
                        }
                        return [2 /*return*/, { ok: false, fieldErrors: errs }];
                    }
                    return [4 /*yield*/, fetch("/cms/api/configurator", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(__assign({ id: shopId }, parsed.data)),
                        })];
                case 1:
                    res = _d.sent();
                    return [4 /*yield*/, res.json().catch(function () { return ({}); })];
                case 2:
                    json = (_d.sent());
                    if (res.ok) {
                        return [2 /*return*/, { ok: true, deployment: json.deployment }];
                    }
                    return [2 /*return*/, { ok: false, error: (_c = json.error) !== null && _c !== void 0 ? _c : "Failed to create shop" }];
            }
        });
    });
}
