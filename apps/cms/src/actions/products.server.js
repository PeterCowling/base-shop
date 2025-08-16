// apps/cms/src/actions/products.ts
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
exports.createDraftRecord = createDraftRecord;
exports.createDraft = createDraft;
exports.updateProduct = updateProduct;
exports.duplicateProduct = duplicateProduct;
exports.deleteProduct = deleteProduct;
var schemas_1 = require("@cms/actions/schemas");
var json_server_1 = require("@platform-core/repositories/json.server");
var fillLocales_1 = require("@i18n/fillLocales");
var Sentry = require("@sentry/node");
var auth_1 = require("./common/auth");
var navigation_1 = require("next/navigation");
var ulid_1 = require("ulid");
var date_utils_1 = require("@acme/date-utils");
/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */
function getLocales(shop) {
    return __awaiter(this, void 0, void 0, function () {
        var settings;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, json_server_1.readSettings)(shop)];
                case 1:
                    settings = _a.sent();
                    return [2 /*return*/, settings.languages];
            }
        });
    });
}
/* -------------------------------------------------------------------------- */
/*  Create draft                                                               */
/* -------------------------------------------------------------------------- */
function createDraftRecord(shop) {
    return __awaiter(this, void 0, void 0, function () {
        var now, locales, first, title, description, draft, repo;
        var _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    _c.sent();
                    now = (0, date_utils_1.nowIso)();
                    return [4 /*yield*/, getLocales(shop)];
                case 2:
                    locales = _c.sent();
                    first = (_b = locales[0]) !== null && _b !== void 0 ? _b : "en";
                    title = (0, fillLocales_1.fillLocales)((_a = {}, _a[first] = "Untitled", _a), "");
                    description = (0, fillLocales_1.fillLocales)(undefined, "");
                    draft = {
                        id: (0, ulid_1.ulid)(),
                        sku: "DRAFT-".concat(Date.now()),
                        title: title,
                        description: description,
                        price: 0,
                        currency: "EUR",
                        media: [],
                        status: "draft",
                        shop: shop,
                        row_version: 1,
                        created_at: now,
                        updated_at: now,
                    };
                    return [4 /*yield*/, (0, json_server_1.readRepo)(shop)];
                case 3:
                    repo = _c.sent();
                    return [4 /*yield*/, (0, json_server_1.writeRepo)(shop, __spreadArray([draft], repo, true))];
                case 4:
                    _c.sent();
                    return [2 /*return*/, draft];
            }
        });
    });
}
/* Server-action: called by “New product” button */
function createDraft(shop) {
    return __awaiter(this, void 0, void 0, function () {
        "use server";
        var draft;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, createDraftRecord(shop)];
                case 2:
                    draft = _a.sent();
                    (0, navigation_1.redirect)("/cms/shop/".concat(shop, "/products/").concat(draft.id, "/edit"));
                    return [2 /*return*/];
            }
        });
    });
}
/* -------------------------------------------------------------------------- */
/*  Update product                                                             */
/* -------------------------------------------------------------------------- */
function updateProduct(shop, formData) {
    return __awaiter(this, void 0, void 0, function () {
        "use server";
        var formEntries, locales, title, description, media, parsed, fieldErrors, productId, data, id, price, nextMedia, current, updated, saved;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    _b.sent();
                    formEntries = Object.fromEntries(formData.entries());
                    return [4 /*yield*/, getLocales(shop)];
                case 2:
                    locales = _b.sent();
                    title = {};
                    description = {};
                    locales.forEach(function (l) {
                        var _a, _b;
                        title[l] = String((_a = formEntries["title_".concat(l)]) !== null && _a !== void 0 ? _a : "");
                        description[l] = String((_b = formEntries["desc_".concat(l)]) !== null && _b !== void 0 ? _b : "");
                    });
                    media = (function () {
                        var _a;
                        try {
                            return JSON.parse(String((_a = formEntries.media) !== null && _a !== void 0 ? _a : "[]"));
                        }
                        catch (_b) {
                            return [];
                        }
                    })();
                    parsed = schemas_1.productSchema.safeParse({
                        id: formEntries.id,
                        price: formEntries.price,
                        title: title,
                        description: description,
                        media: media,
                    });
                    if (!parsed.success) {
                        fieldErrors = parsed.error.flatten().fieldErrors;
                        productId = String((_a = formData.get("id")) !== null && _a !== void 0 ? _a : "");
                        Sentry.captureException(parsed.error, { extra: { productId: productId } });
                        return [2 /*return*/, { errors: fieldErrors }];
                    }
                    data = parsed.data;
                    id = data.id, price = data.price, nextMedia = data.media;
                    return [4 /*yield*/, (0, json_server_1.getProductById)(shop, id)];
                case 3:
                    current = _b.sent();
                    if (!current)
                        throw new Error("Product ".concat(id, " not found in ").concat(shop));
                    updated = __assign(__assign({}, current), { title: __assign(__assign({}, current.title), data.title), description: __assign(__assign({}, current.description), data.description), price: price, media: nextMedia, row_version: current.row_version + 1, updated_at: (0, date_utils_1.nowIso)() });
                    return [4 /*yield*/, (0, json_server_1.updateProductInRepo)(shop, updated)];
                case 4:
                    saved = _b.sent();
                    return [2 /*return*/, { product: saved }];
            }
        });
    });
}
/* -------------------------------------------------------------------------- */
/*  Duplicate product                                                          */
/* -------------------------------------------------------------------------- */
function duplicateProduct(shop, id) {
    return __awaiter(this, void 0, void 0, function () {
        "use server";
        var copy;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, json_server_1.duplicateProductInRepo)(shop, id)];
                case 2:
                    copy = _a.sent();
                    (0, navigation_1.redirect)("/cms/shop/".concat(shop, "/products/").concat(copy.id, "/edit"));
                    return [2 /*return*/];
            }
        });
    });
}
/* -------------------------------------------------------------------------- */
/*  Delete product                                                             */
/* -------------------------------------------------------------------------- */
function deleteProduct(shop, id) {
    return __awaiter(this, void 0, void 0, function () {
        "use server";
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, json_server_1.deleteProductFromRepo)(shop, id)];
                case 2:
                    _a.sent();
                    (0, navigation_1.redirect)("/cms/shop/".concat(shop, "/products"));
                    return [2 /*return*/];
            }
        });
    });
}
