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
exports.useSeoForm = useSeoForm;
var shops_server_1 = require("@cms/actions/shops.server");
var react_1 = require("react");
function useSeoForm(_a) {
    var _this = this;
    var shop = _a.shop, languages = _a.languages, initialSeo = _a.initialSeo, baseLocale = _a.baseLocale;
    var base = baseLocale !== null && baseLocale !== void 0 ? baseLocale : languages[0];
    var _b = (0, react_1.useState)(languages[0]), locale = _b[0], setLocale = _b[1];
    var _c = (0, react_1.useState)(function () {
        var records = {};
        languages.forEach(function (l) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            records[l] = {
                title: (_b = (_a = initialSeo[l]) === null || _a === void 0 ? void 0 : _a.title) !== null && _b !== void 0 ? _b : "",
                description: (_d = (_c = initialSeo[l]) === null || _c === void 0 ? void 0 : _c.description) !== null && _d !== void 0 ? _d : "",
                image: (_f = (_e = initialSeo[l]) === null || _e === void 0 ? void 0 : _e.image) !== null && _f !== void 0 ? _f : "",
                brand: (_h = (_g = initialSeo[l]) === null || _g === void 0 ? void 0 : _g.brand) !== null && _h !== void 0 ? _h : "",
                offers: (_k = (_j = initialSeo[l]) === null || _j === void 0 ? void 0 : _j.offers) !== null && _k !== void 0 ? _k : "",
                aggregateRating: (_m = (_l = initialSeo[l]) === null || _l === void 0 ? void 0 : _l.aggregateRating) !== null && _m !== void 0 ? _m : "",
            };
        });
        return records;
    }), seo = _c[0], setSeo = _c[1];
    var _d = (0, react_1.useState)(false), saving = _d[0], setSaving = _d[1];
    var _e = (0, react_1.useState)({}), errors = _e[0], setErrors = _e[1];
    var _f = (0, react_1.useState)([]), warnings = _f[0], setWarnings = _f[1];
    var handleChange = (0, react_1.useCallback)(function (field, value) {
        setSeo(function (prev) {
            var _a, _b;
            return (__assign(__assign({}, prev), (_a = {}, _a[locale] = __assign(__assign({}, prev[locale]), (_b = {}, _b[field] = value, _b)), _a)));
        });
    }, [locale]);
    var handleSubmit = (0, react_1.useCallback)(function (e) { return __awaiter(_this, void 0, void 0, function () {
        var data, fd, result;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    e.preventDefault();
                    setSaving(true);
                    data = seo[locale];
                    fd = new FormData();
                    fd.append("locale", locale);
                    fd.append("title", data.title);
                    fd.append("description", data.description);
                    fd.append("image", data.image);
                    fd.append("brand", data.brand);
                    fd.append("offers", data.offers);
                    fd.append("aggregateRating", data.aggregateRating);
                    return [4 /*yield*/, (0, shops_server_1.updateSeo)(shop, fd)];
                case 1:
                    result = _b.sent();
                    if (result.errors) {
                        setErrors(result.errors);
                    }
                    else {
                        setErrors({});
                        setWarnings((_a = result.warnings) !== null && _a !== void 0 ? _a : []);
                    }
                    setSaving(false);
                    return [2 /*return*/];
            }
        });
    }); }, [seo, locale, shop]);
    return {
        locale: locale,
        setLocale: setLocale,
        seo: seo,
        baseLocale: base,
        handleChange: handleChange,
        handleSubmit: handleSubmit,
        saving: saving,
        errors: errors,
        warnings: warnings,
    };
}
exports.default = useSeoForm;
