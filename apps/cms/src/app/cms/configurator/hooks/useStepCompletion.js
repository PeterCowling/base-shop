"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validators = void 0;
exports.useStepCompletion = useStepCompletion;
var ConfiguratorContext_1 = require("../ConfiguratorContext");
exports.validators = {
    "shop-details": function (s) { return Boolean(s.shopId && s.storeName); },
    theme: function (s) { return Boolean(s.theme); },
    tokens: function (s) { var _a; return Object.keys((_a = s.themeDefaults) !== null && _a !== void 0 ? _a : {}).length > 0; },
    options: function (s) {
        return s.analyticsProvider !== "ga" || Boolean(s.analyticsId);
    },
    navigation: function (s) { return s.navItems.length > 0; },
    layout: function (s) { return Boolean(s.headerPageId && s.footerPageId); },
    "home-page": function (s) { return Boolean(s.homePageId); },
    "checkout-page": function (s) { return Boolean(s.checkoutPageId); },
    "shop-page": function (s) { return Boolean(s.shopPageId); },
    "product-page": function (s) { return Boolean(s.productPageId); },
    "additional-pages": function (s) { return s.pages.every(function (p) { return Boolean(p.slug); }); },
    "env-vars": function (s) { return Object.values(s.env).some(Boolean); },
    summary: function (s) {
        return Object.values(s.pageTitle).some(Boolean) &&
            Object.values(s.pageDescription).some(Boolean);
    },
    "import-data": function (s) { return Boolean(s.categoriesText); },
    "seed-data": function (s) { return Boolean(s.categoriesText); },
    hosting: function (s) { return Boolean(s.domain); },
};
function useStepCompletion(stepId) {
    var _a;
    var _b = (0, ConfiguratorContext_1.useConfigurator)(), state = _b.state, markStepComplete = _b.markStepComplete, resetDirty = _b.resetDirty;
    var validate = (_a = exports.validators[stepId]) !== null && _a !== void 0 ? _a : (function () { return true; });
    var completed = state.completed[stepId] === "complete" && validate(state);
    var setCompleted = function (v) {
        if (v && !validate(state))
            return;
        markStepComplete(stepId, v ? "complete" : "pending");
        if (v)
            resetDirty();
    };
    return [completed, setCompleted];
}
exports.default = useStepCompletion;
