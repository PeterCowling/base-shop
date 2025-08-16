"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = generateStaticParams;
// apps/cms/src/app/[lang]/generateStaticParams.ts
var i18n_1 = require("@acme/i18n");
function generateStaticParams() {
    return i18n_1.LOCALES.map(function (lang) { return ({ lang: lang }); });
}
