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
exports.getSeo = getSeo;
exports.getStructuredData = getStructuredData;
exports.serializeJsonLd = serializeJsonLd;
var locales_1 = require("@i18n/locales");
var core_1 = require("@acme/config/env/core");
var fallback = {
    title: "",
    description: "",
    canonical: "",
    openGraph: {},
    twitter: {},
};
function getSeo(locale_1) {
    return __awaiter(this, arguments, void 0, function (locale, pageSeo) {
        var shop, getShopSettings, settings, shopSeo, base, canonicalBase, canonicalOverride, canonicalPath, perLocaleCanonical, _i, LOCALES_1, l, cBase, alternates, imagePath, resolvedImage, canonical;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4;
        if (pageSeo === void 0) { pageSeo = {}; }
        return __generator(this, function (_5) {
            switch (_5.label) {
                case 0:
                    shop = core_1.coreEnv.NEXT_PUBLIC_SHOP_ID || "default";
                    return [4 /*yield*/, Promise.resolve().then(function () { return require("@platform-core/repositories/shops.server"); })];
                case 1:
                    getShopSettings = (_5.sent()).getShopSettings;
                    return [4 /*yield*/, getShopSettings(shop)];
                case 2:
                    settings = _5.sent();
                    shopSeo = ((_a = settings.seo) !== null && _a !== void 0 ? _a : {});
                    base = (_b = shopSeo[locale]) !== null && _b !== void 0 ? _b : {};
                    canonicalBase = (_c = base.canonicalBase) !== null && _c !== void 0 ? _c : "";
                    canonicalOverride = (_d = pageSeo.canonical) !== null && _d !== void 0 ? _d : base.canonical;
                    canonicalPath = "";
                    if (canonicalOverride) {
                        try {
                            canonicalPath = new URL(canonicalOverride).pathname.replace(new RegExp("^/".concat(locale)), "");
                        }
                        catch (_6) {
                            canonicalPath = "";
                        }
                    }
                    perLocaleCanonical = {};
                    for (_i = 0, LOCALES_1 = locales_1.LOCALES; _i < LOCALES_1.length; _i++) {
                        l = LOCALES_1[_i];
                        cBase = (_e = shopSeo[l]) === null || _e === void 0 ? void 0 : _e.canonicalBase;
                        if (cBase) {
                            perLocaleCanonical[l] = "".concat(cBase, "/").concat(l).concat(canonicalPath);
                        }
                    }
                    alternates = Object.entries(perLocaleCanonical).map(function (_a) {
                        var l = _a[0], href = _a[1];
                        return ({
                            rel: "alternate",
                            hrefLang: l,
                            href: href,
                        });
                    });
                    imagePath = ((_h = (_g = (_f = pageSeo.openGraph) === null || _f === void 0 ? void 0 : _f.images) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.url) ||
                        ((_j = pageSeo.openGraph) === null || _j === void 0 ? void 0 : _j.image) ||
                        pageSeo.image ||
                        ((_m = (_l = (_k = base.openGraph) === null || _k === void 0 ? void 0 : _k.images) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.url) ||
                        ((_o = base.openGraph) === null || _o === void 0 ? void 0 : _o.image) ||
                        base.image;
                    resolvedImage = imagePath && !/^https?:/i.test(imagePath)
                        ? "".concat(canonicalBase).concat(imagePath)
                        : imagePath;
                    canonical = (_p = canonicalOverride !== null && canonicalOverride !== void 0 ? canonicalOverride : perLocaleCanonical[locale]) !== null && _p !== void 0 ? _p : (canonicalBase ? "".concat(canonicalBase, "/").concat(locale) : fallback.canonical);
                    return [2 /*return*/, {
                            title: (_r = (_q = pageSeo.title) !== null && _q !== void 0 ? _q : base.title) !== null && _r !== void 0 ? _r : fallback.title,
                            description: (_t = (_s = pageSeo.description) !== null && _s !== void 0 ? _s : base.description) !== null && _t !== void 0 ? _t : fallback.description,
                            canonical: canonical,
                            openGraph: __assign(__assign(__assign(__assign({}, ((_u = fallback.openGraph) !== null && _u !== void 0 ? _u : {})), ((_v = base.openGraph) !== null && _v !== void 0 ? _v : {})), ((_w = pageSeo.openGraph) !== null && _w !== void 0 ? _w : {})), { url: (_1 = (_0 = (_y = (_x = pageSeo.openGraph) === null || _x === void 0 ? void 0 : _x.url) !== null && _y !== void 0 ? _y : (_z = base.openGraph) === null || _z === void 0 ? void 0 : _z.url) !== null && _0 !== void 0 ? _0 : perLocaleCanonical[locale]) !== null && _1 !== void 0 ? _1 : (canonicalBase ? "".concat(canonicalBase, "/").concat(locale) : undefined), images: resolvedImage ? [{ url: resolvedImage }] : undefined }),
                            twitter: __assign(__assign(__assign({}, ((_2 = fallback.twitter) !== null && _2 !== void 0 ? _2 : {})), ((_3 = base.twitter) !== null && _3 !== void 0 ? _3 : {})), ((_4 = pageSeo.twitter) !== null && _4 !== void 0 ? _4 : {})),
                            additionalLinkTags: alternates,
                        }];
            }
        });
    });
}
/**
 * Build a JSON-LD object for the given input. Consumers can stringify the
 * result and embed it in a `<script type="application/ld+json">` tag.
 */
function getStructuredData(input) {
    if (input.type === "Product") {
        var name_1 = input.name, description_1 = input.description, url_1 = input.url, image = input.image, brand = input.brand, offers = input.offers, aggregateRating = input.aggregateRating;
        return __assign(__assign(__assign(__assign(__assign(__assign({ "@context": "https://schema.org", "@type": "Product", name: name_1 }, (description_1 ? { description: description_1 } : {})), (url_1 ? { url: url_1 } : {})), (image ? { image: Array.isArray(image) ? image : [image] } : {})), (brand ? { brand: { "@type": "Brand", name: brand } } : {})), (offers
            ? {
                offers: __assign(__assign({ "@type": "Offer", price: offers.price, priceCurrency: offers.priceCurrency }, (offers.availability
                    ? { availability: offers.availability }
                    : {})), (offers.url ? { url: offers.url } : {})),
            }
            : {})), (aggregateRating
            ? {
                aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: aggregateRating.ratingValue,
                    reviewCount: aggregateRating.reviewCount,
                },
            }
            : {}));
    }
    var name = input.name, description = input.description, url = input.url;
    return __assign(__assign({ "@context": "https://schema.org", "@type": "WebPage", name: name }, (description ? { description: description } : {})), (url ? { url: url } : {}));
}
function serializeJsonLd(data) {
    return JSON.stringify(data).replace(/</g, "\\u003c");
}
