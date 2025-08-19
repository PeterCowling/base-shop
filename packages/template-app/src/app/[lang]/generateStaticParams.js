"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = generateStaticParams;
// packages/template-app/src/app/[lang]/generateStaticParams.ts
var i18n_1 = require("@acme/i18n");
function generateStaticParams() {
    /* prerender /en, /de, /it — Next will also serve `/` via default locale */
    return i18n_1.LOCALES.map(function (lang) { return ({ lang: lang }); });
}
