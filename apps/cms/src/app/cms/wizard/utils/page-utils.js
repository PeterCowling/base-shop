"use strict";
// apps/cms/src/app/cms/wizard/utils/page.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPageInfo = toPageInfo;
var fillLocales_1 = require("@i18n/fillLocales");
function toPageInfo(draft) {
    var _a, _b;
    return {
        id: draft.id,
        slug: (_a = draft.slug) !== null && _a !== void 0 ? _a : "",
        title: (0, fillLocales_1.fillLocales)(draft.title, ""),
        description: (0, fillLocales_1.fillLocales)(draft.description, ""),
        image: (0, fillLocales_1.fillLocales)(draft.image, ""),
        components: (_b = draft.components) !== null && _b !== void 0 ? _b : [],
    };
}
