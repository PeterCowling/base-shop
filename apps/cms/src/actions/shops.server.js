// apps/cms/src/actions/shops.server.ts
"use server";
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
exports.updateShop = updateShop;
exports.getSettings = getSettings;
exports.updateSeo = updateSeo;
exports.generateSeo = generateSeo;
exports.revertSeo = revertSeo;
exports.setFreezeTranslations = setFreezeTranslations;
exports.updateCurrencyAndTax = updateCurrencyAndTax;
exports.updateDepositService = updateDepositService;
exports.updateUpsReturns = updateUpsReturns;
exports.updatePremierDelivery = updatePremierDelivery;
exports.updateAiCatalog = updateAiCatalog;
exports.resetThemeOverride = resetThemeOverride;
var cache_1 = require("next/cache");
var authorization_1 = require("../services/shops/authorization");
var validation_1 = require("../services/shops/validation");
var theme_1 = require("../services/shops/theme");
var persistence_1 = require("../services/shops/persistence");
function updateShop(shop, formData) {
    return __awaiter(this, void 0, void 0, function () {
        var current, _a, data, errors, theme, patch, saved, settings, updatedSettings;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, authorization_1.authorize)()];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, (0, persistence_1.fetchShop)(shop)];
                case 2:
                    current = _b.sent();
                    _a = (0, validation_1.parseShopForm)(formData), data = _a.data, errors = _a.errors;
                    if (!data) {
                        console.error("[updateShop] validation failed for shop ".concat(shop), errors);
                        return [2 /*return*/, { errors: errors }];
                    }
                    if (current.id !== data.id)
                        throw new Error("Shop ".concat(data.id, " not found in ").concat(shop));
                    return [4 /*yield*/, (0, theme_1.buildThemeData)(shop, data, current)];
                case 3:
                    theme = _b.sent();
                    patch = {
                        id: current.id,
                        name: data.name,
                        themeId: data.themeId,
                        catalogFilters: data.catalogFilters,
                        enableEditorial: data.enableEditorial,
                        themeDefaults: theme.themeDefaults,
                        themeOverrides: theme.overrides,
                        themeTokens: theme.themeTokens,
                        filterMappings: data.filterMappings,
                        priceOverrides: data.priceOverrides,
                        localeOverrides: data.localeOverrides,
                        luxuryFeatures: data.luxuryFeatures,
                    };
                    return [4 /*yield*/, (0, persistence_1.persistShop)(shop, patch)];
                case 4:
                    saved = _b.sent();
                    return [4 /*yield*/, (0, persistence_1.fetchSettings)(shop)];
                case 5:
                    settings = _b.sent();
                    updatedSettings = __assign(__assign({}, settings), { trackingProviders: data.trackingProviders, luxuryFeatures: data.luxuryFeatures });
                    return [4 /*yield*/, (0, persistence_1.persistSettings)(shop, updatedSettings)];
                case 6:
                    _b.sent();
                    return [2 /*return*/, { shop: saved }];
            }
        });
    });
}
function getSettings(shop) {
    return (0, persistence_1.fetchSettings)(shop);
}
function updateSeo(shop, formData) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, errors, locale, title, description, image, alt, canonicalBase, ogUrl, twitterCard, warnings, current, seo, updated;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, authorization_1.authorize)()];
                case 1:
                    _c.sent();
                    _a = (0, validation_1.parseSeoForm)(formData), data = _a.data, errors = _a.errors;
                    if (!data) {
                        console.error("[updateSeo] validation failed for shop ".concat(shop), errors);
                        return [2 /*return*/, { errors: errors }];
                    }
                    locale = data.locale, title = data.title, description = data.description, image = data.image, alt = data.alt, canonicalBase = data.canonicalBase, ogUrl = data.ogUrl, twitterCard = data.twitterCard;
                    warnings = [];
                    if (title.length > 70)
                        warnings.push("Title exceeds 70 characters");
                    if (description.length > 160)
                        warnings.push("Description exceeds 160 characters");
                    return [4 /*yield*/, (0, persistence_1.fetchSettings)(shop)];
                case 2:
                    current = _c.sent();
                    seo = __assign({}, ((_b = current.seo) !== null && _b !== void 0 ? _b : {}));
                    seo[locale] = {
                        title: title,
                        description: description,
                        image: image,
                        alt: alt,
                        canonicalBase: canonicalBase,
                        openGraph: ogUrl ? { url: ogUrl } : undefined,
                        twitter: twitterCard ? { card: twitterCard } : undefined,
                    };
                    updated = __assign(__assign({}, current), { seo: seo });
                    return [4 /*yield*/, (0, persistence_1.persistSettings)(shop, updated)];
                case 3:
                    _c.sent();
                    return [2 /*return*/, { settings: updated, warnings: warnings }];
            }
        });
    });
}
function generateSeo(shop, formData) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, errors, id, locale, title, description, generateMeta, result, current, seo, updated;
        var _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, (0, authorization_1.authorize)()];
                case 1:
                    _f.sent();
                    _a = (0, validation_1.parseGenerateSeoForm)(formData), data = _a.data, errors = _a.errors;
                    if (!data) {
                        return [2 /*return*/, { errors: errors }];
                    }
                    id = data.id, locale = data.locale, title = data.title, description = data.description;
                    return [4 /*yield*/, Promise.resolve().then(function () { return require(
                        /* @vite-ignore */ "../../../../scripts/generate-meta.ts"); })];
                case 2:
                    generateMeta = (_f.sent()).generateMeta;
                    return [4 /*yield*/, generateMeta({ id: id, title: title, description: description })];
                case 3:
                    result = _f.sent();
                    return [4 /*yield*/, (0, persistence_1.fetchSettings)(shop)];
                case 4:
                    current = _f.sent();
                    seo = __assign({}, ((_b = current.seo) !== null && _b !== void 0 ? _b : {}));
                    seo[locale] = __assign(__assign({}, ((_c = seo[locale]) !== null && _c !== void 0 ? _c : {})), { title: result.title, description: result.description, image: result.image, openGraph: __assign(__assign({}, ((_e = (_d = seo[locale]) === null || _d === void 0 ? void 0 : _d.openGraph) !== null && _e !== void 0 ? _e : {})), { image: result.image }) });
                    updated = __assign(__assign({}, current), { seo: seo });
                    return [4 /*yield*/, (0, persistence_1.persistSettings)(shop, updated)];
                case 5:
                    _f.sent();
                    return [2 /*return*/, { generated: result }];
            }
        });
    });
}
function revertSeo(shop, timestamp) {
    return __awaiter(this, void 0, void 0, function () {
        var history, sorted, idx, state, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, authorization_1.authorize)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, persistence_1.fetchDiffHistory)(shop)];
                case 2:
                    history = _a.sent();
                    sorted = history.sort(function (a, b) {
                        return a.timestamp.localeCompare(b.timestamp);
                    });
                    idx = sorted.findIndex(function (e) { return e.timestamp === timestamp; });
                    if (idx === -1)
                        throw new Error("Version not found");
                    state = {
                        languages: [],
                        seo: {},
                        freezeTranslations: false,
                        updatedAt: "",
                        updatedBy: "",
                    };
                    for (i = 0; i < idx; i++) {
                        state = __assign(__assign({}, state), sorted[i].diff);
                    }
                    return [4 /*yield*/, (0, persistence_1.persistSettings)(shop, state)];
                case 3:
                    _a.sent();
                    return [2 /*return*/, state];
            }
        });
    });
}
function setFreezeTranslations(shop, freeze) {
    return __awaiter(this, void 0, void 0, function () {
        var current, updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, authorization_1.authorize)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, persistence_1.fetchSettings)(shop)];
                case 2:
                    current = _a.sent();
                    updated = __assign(__assign({}, current), { freezeTranslations: freeze });
                    return [4 /*yield*/, (0, persistence_1.persistSettings)(shop, updated)];
                case 3:
                    _a.sent();
                    return [2 /*return*/, updated];
            }
        });
    });
}
function updateCurrencyAndTax(shop, formData) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, errors, current, updated;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, authorization_1.authorize)()];
                case 1:
                    _b.sent();
                    _a = (0, validation_1.parseCurrencyTaxForm)(formData), data = _a.data, errors = _a.errors;
                    if (!data) {
                        return [2 /*return*/, { errors: errors }];
                    }
                    return [4 /*yield*/, (0, persistence_1.fetchSettings)(shop)];
                case 2:
                    current = _b.sent();
                    updated = __assign(__assign({}, current), { currency: data.currency, taxRegion: data.taxRegion });
                    return [4 /*yield*/, (0, persistence_1.persistSettings)(shop, updated)];
                case 3:
                    _b.sent();
                    return [2 /*return*/, { settings: updated }];
            }
        });
    });
}
function updateDepositService(shop, formData) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, errors, current, updated;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, authorization_1.authorize)()];
                case 1:
                    _b.sent();
                    _a = (0, validation_1.parseDepositForm)(formData), data = _a.data, errors = _a.errors;
                    if (!data) {
                        return [2 /*return*/, { errors: errors }];
                    }
                    return [4 /*yield*/, (0, persistence_1.fetchSettings)(shop)];
                case 2:
                    current = _b.sent();
                    updated = __assign(__assign({}, current), { depositService: {
                            enabled: data.enabled,
                            intervalMinutes: data.intervalMinutes,
                        } });
                    return [4 /*yield*/, (0, persistence_1.persistSettings)(shop, updated)];
                case 3:
                    _b.sent();
                    return [2 /*return*/, { settings: updated }];
            }
        });
    });
}
function updateUpsReturns(shop, formData) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, errors, current, updated;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, authorization_1.authorize)()];
                case 1:
                    _b.sent();
                    _a = (0, validation_1.parseUpsReturnsForm)(formData), data = _a.data, errors = _a.errors;
                    if (!data) {
                        return [2 /*return*/, { errors: errors }];
                    }
                    return [4 /*yield*/, (0, persistence_1.fetchSettings)(shop)];
                case 2:
                    current = _b.sent();
                    updated = __assign(__assign({}, current), { returnService: { upsEnabled: data.enabled } });
                    return [4 /*yield*/, (0, persistence_1.persistSettings)(shop, updated)];
                case 3:
                    _b.sent();
                    return [2 /*return*/, { settings: updated }];
            }
        });
    });
}
function updatePremierDelivery(shop, formData) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, errors, current, updated;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, authorization_1.authorize)()];
                case 1:
                    _b.sent();
                    _a = (0, validation_1.parsePremierDeliveryForm)(formData), data = _a.data, errors = _a.errors;
                    if (!data) {
                        return [2 /*return*/, { errors: errors }];
                    }
                    return [4 /*yield*/, (0, persistence_1.fetchSettings)(shop)];
                case 2:
                    current = _b.sent();
                    updated = __assign(__assign({}, current), { premierDelivery: data });
                    return [4 /*yield*/, (0, persistence_1.persistSettings)(shop, updated)];
                case 3:
                    _b.sent();
                    return [2 /*return*/, { settings: updated }];
            }
        });
    });
}
function updateAiCatalog(shop, formData) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, errors, current, seo, updated;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, authorization_1.authorize)()];
                case 1:
                    _c.sent();
                    _a = (0, validation_1.parseAiCatalogForm)(formData), data = _a.data, errors = _a.errors;
                    if (!data) {
                        return [2 /*return*/, { errors: errors }];
                    }
                    return [4 /*yield*/, (0, persistence_1.fetchSettings)(shop)];
                case 2:
                    current = _c.sent();
                    seo = __assign({}, ((_b = current.seo) !== null && _b !== void 0 ? _b : {}));
                    seo.aiCatalog = {
                        enabled: data.enabled,
                        fields: data.fields,
                        pageSize: data.pageSize,
                    };
                    updated = __assign(__assign({}, current), { seo: seo });
                    return [4 /*yield*/, (0, persistence_1.persistSettings)(shop, updated)];
                case 3:
                    _c.sent();
                    return [2 /*return*/, { settings: updated }];
            }
        });
    });
}
function resetThemeOverride(shop, token) {
    return __awaiter(this, void 0, void 0, function () {
        var current, _a, overrides, themeTokens;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, authorization_1.authorize)()];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, (0, persistence_1.fetchShop)(shop)];
                case 2:
                    current = _b.sent();
                    _a = (0, theme_1.removeThemeToken)(current, token), overrides = _a.overrides, themeTokens = _a.themeTokens;
                    return [4 /*yield*/, (0, persistence_1.persistShop)(shop, {
                            id: current.id,
                            themeOverrides: overrides,
                            themeTokens: themeTokens,
                        })];
                case 3:
                    _b.sent();
                    (0, cache_1.revalidatePath)("/cms/shop/".concat(shop, "/settings"));
                    return [2 /*return*/];
            }
        });
    });
}
