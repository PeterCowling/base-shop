"use strict";
// apps/cms/src/actions/pages.server.ts
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
exports.createPage = createPage;
exports.savePageDraft = savePageDraft;
exports.updatePage = updatePage;
exports.deletePage = deletePage;
var i18n_1 = require("@acme/i18n");
var Sentry = require("@sentry/node");
var types_1 = require("@acme/types");
var ulid_1 = require("ulid");
var date_utils_1 = require("@acme/date-utils");
var config_1 = require("@acme/config");
var auth_1 = require("./common/auth");
var validation_1 = require("./pages/validation");
var service_1 = require("./pages/service");
/* -------------------------------------------------------------------------- */
/*  Create Page                                                               */
/* -------------------------------------------------------------------------- */
function createPage(shop, formData) {
    return __awaiter(this, void 0, void 0, function () {
        var session, idField, id, parsed, context, fieldErrors, data, history, historyStr, title, description, image, now, page, saved, err_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    session = _b.sent();
                    idField = formData.get("id");
                    id = typeof idField === "string" && idField.trim().length
                        ? idField.trim()
                        : (0, ulid_1.ulid)();
                    parsed = validation_1.createSchema.safeParse(Object.fromEntries(formData));
                    if (!parsed.success) {
                        context = { shop: shop, id: id };
                        if (config_1.env.NODE_ENV === "development") {
                            console.warn("[createPage] validation failed", __assign(__assign({}, context), { error: parsed.error }));
                        }
                        try {
                            Sentry.captureException(parsed.error, { extra: context });
                        }
                        catch (_c) {
                            /* ignore sentry failure */
                        }
                        fieldErrors = parsed.error.flatten().fieldErrors;
                        return [2 /*return*/, { errors: fieldErrors }];
                    }
                    data = parsed.data;
                    historyStr = formData.get("history");
                    if (typeof historyStr === "string") {
                        try {
                            history = types_1.historyStateSchema.parse(JSON.parse(historyStr));
                        }
                        catch (_d) {
                            /* ignore invalid history */
                        }
                    }
                    title = {};
                    description = {};
                    image = {};
                    i18n_1.LOCALES.forEach(function (l) {
                        var _a;
                        title[l] = data["title_".concat(l)];
                        description[l] = data["desc_".concat(l)];
                        image[l] = (_a = data.image) !== null && _a !== void 0 ? _a : "";
                    });
                    now = (0, date_utils_1.nowIso)();
                    page = {
                        id: id,
                        slug: data.slug,
                        status: data.status,
                        components: data.components,
                        seo: { title: title, description: description, image: image },
                        createdAt: now,
                        updatedAt: now,
                        createdBy: (_a = session.user.email) !== null && _a !== void 0 ? _a : "unknown",
                    };
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, (0, service_1.savePage)(shop, page)];
                case 3:
                    saved = _b.sent();
                    return [2 /*return*/, { page: saved }];
                case 4:
                    err_1 = _b.sent();
                    Sentry.captureException(err_1);
                    throw err_1;
                case 5: return [2 /*return*/];
            }
        });
    });
}
/* -------------------------------------------------------------------------- */
/*  Save Draft                                                                */
/* -------------------------------------------------------------------------- */
function savePageDraft(shop, formData) {
    return __awaiter(this, void 0, void 0, function () {
        var session, id, compStr, components, history, historyStr, pages, now, existing, page, saved, err_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    session = _b.sent();
                    id = formData.get("id") || (0, ulid_1.ulid)();
                    compStr = formData.get("components");
                    try {
                        components = validation_1.componentsField.parse(typeof compStr === "string" ? compStr : undefined);
                    }
                    catch (_c) {
                        return [2 /*return*/, { errors: { components: ["Invalid components"] } }];
                    }
                    history = undefined;
                    historyStr = formData.get("history");
                    if (typeof historyStr === "string") {
                        try {
                            history = types_1.historyStateSchema.parse(JSON.parse(historyStr));
                        }
                        catch (_d) {
                            /* ignore invalid history */
                        }
                    }
                    return [4 /*yield*/, (0, service_1.getPages)(shop)];
                case 2:
                    pages = _b.sent();
                    now = (0, date_utils_1.nowIso)();
                    existing = pages.find(function (p) { return p.id === id; });
                    page = existing
                        ? __assign(__assign(__assign(__assign({}, existing), { components: components }), (history ? { history: history } : {})), { updatedAt: now }) : {
                        id: id,
                        slug: "",
                        status: "draft",
                        components: components,
                        history: history !== null && history !== void 0 ? history : types_1.historyStateSchema.parse({}),
                        seo: {
                            title: (0, validation_1.emptyTranslated)(),
                            description: (0, validation_1.emptyTranslated)(),
                            image: (0, validation_1.emptyTranslated)(),
                        },
                        createdAt: now,
                        updatedAt: now,
                        createdBy: (_a = session.user.email) !== null && _a !== void 0 ? _a : "unknown",
                    };
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, (0, service_1.savePage)(shop, page)];
                case 4:
                    saved = _b.sent();
                    return [2 /*return*/, { page: saved }];
                case 5:
                    err_2 = _b.sent();
                    Sentry.captureException(err_2);
                    throw err_2;
                case 6: return [2 /*return*/];
            }
        });
    });
}
/* -------------------------------------------------------------------------- */
/*  Update Page                                                               */
/* -------------------------------------------------------------------------- */
function updatePage(shop, formData) {
    return __awaiter(this, void 0, void 0, function () {
        var parsed, context, fieldErrors, data, history, historyStr, title, description, image, patch, saved, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    _a.sent();
                    parsed = validation_1.updateSchema.safeParse(Object.fromEntries(formData));
                    if (!parsed.success) {
                        context = { shop: shop, id: formData.get("id") || undefined };
                        if (config_1.env.NODE_ENV === "development") {
                            console.warn("[updatePage] validation failed", __assign(__assign({}, context), { error: parsed.error }));
                        }
                        try {
                            Sentry.captureException(parsed.error, { extra: context });
                        }
                        catch (_b) {
                            /* ignore sentry failure */
                        }
                        fieldErrors = parsed.error.flatten().fieldErrors;
                        return [2 /*return*/, { errors: fieldErrors }];
                    }
                    data = parsed.data;
                    historyStr = formData.get("history");
                    if (typeof historyStr === "string") {
                        try {
                            history = types_1.historyStateSchema.parse(JSON.parse(historyStr));
                        }
                        catch (_c) {
                            /* ignore invalid history */
                        }
                    }
                    title = {};
                    description = {};
                    image = {};
                    i18n_1.LOCALES.forEach(function (l) {
                        var _a;
                        title[l] = data["title_".concat(l)];
                        description[l] = data["desc_".concat(l)];
                        image[l] = (_a = data.image) !== null && _a !== void 0 ? _a : "";
                    });
                    patch = __assign({ id: data.id, updatedAt: data.updatedAt, slug: data.slug, status: data.status, components: data.components, seo: { title: title, description: description, image: image } }, (history ? { history: history } : {}));
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, (0, service_1.updatePage)(shop, patch)];
                case 3:
                    saved = _a.sent();
                    return [2 /*return*/, { page: saved }];
                case 4:
                    err_3 = _a.sent();
                    Sentry.captureException(err_3);
                    throw err_3;
                case 5: return [2 /*return*/];
            }
        });
    });
}
/* -------------------------------------------------------------------------- */
/*  Delete Page                                                               */
/* -------------------------------------------------------------------------- */
function deletePage(shop, id) {
    return __awaiter(this, void 0, void 0, function () {
        var err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, (0, service_1.deletePage)(shop, id)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    err_4 = _a.sent();
                    Sentry.captureException(err_4);
                    throw err_4;
                case 5: return [2 /*return*/];
            }
        });
    });
}
