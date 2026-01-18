"use strict";
// packages/i18n/src/index.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMultilingualInput = exports.fillLocales = exports.useTranslations = exports.TranslationsProvider = exports.LOCALES = exports.assertLocales = void 0;
__exportStar(require("./locales"), exports);
var locales_1 = require("./locales");
Object.defineProperty(exports, "assertLocales", { enumerable: true, get: function () { return locales_1.assertLocales; } });
Object.defineProperty(exports, "LOCALES", { enumerable: true, get: function () { return locales_1.LOCALES; } });
var Translations_1 = require("./Translations");
Object.defineProperty(exports, "TranslationsProvider", { enumerable: true, get: function () { return __importDefault(Translations_1).default; } });
Object.defineProperty(exports, "useTranslations", { enumerable: true, get: function () { return Translations_1.useTranslations; } });
var fillLocales_1 = require("./fillLocales");
Object.defineProperty(exports, "fillLocales", { enumerable: true, get: function () { return fillLocales_1.fillLocales; } });
var parseMultilingualInput_1 = require("./parseMultilingualInput");
Object.defineProperty(exports, "parseMultilingualInput", { enumerable: true, get: function () { return parseMultilingualInput_1.parseMultilingualInput; } });
