"use strict";
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
exports.stepIndex = exports.steps = exports.getRequiredSteps = exports.getSteps = void 0;
exports.ConfiguratorProgress = ConfiguratorProgress;
var StepShopDetails_1 = require("./steps/StepShopDetails");
var StepTheme_1 = require("./steps/StepTheme");
var StepTokens_1 = require("./steps/StepTokens");
var StepOptions_1 = require("./steps/StepOptions");
var StepNavigation_1 = require("./steps/StepNavigation");
var StepLayout_1 = require("./steps/StepLayout");
var StepHomePage_1 = require("./steps/StepHomePage");
var StepCheckoutPage_1 = require("./steps/StepCheckoutPage");
var StepShopPage_1 = require("./steps/StepShopPage");
var StepProductPage_1 = require("./steps/StepProductPage");
var StepAdditionalPages_1 = require("./steps/StepAdditionalPages");
var StepEnvVars_1 = require("./steps/StepEnvVars");
var StepSummary_1 = require("./steps/StepSummary");
var StepImportData_1 = require("./steps/StepImportData");
var StepSeedData_1 = require("./steps/StepSeedData");
var StepHosting_1 = require("./steps/StepHosting");
var stepList = [
    { id: "shop-details", label: "Shop Details", component: StepShopDetails_1.default },
    { id: "theme", label: "Theme", component: StepTheme_1.default },
    { id: "tokens", label: "Tokens", component: StepTokens_1.default },
    { id: "options", label: "Options", component: StepOptions_1.default },
    { id: "navigation", label: "Navigation", component: StepNavigation_1.default },
    {
        id: "layout",
        label: "Layout",
        component: StepLayout_1.default,
        recommended: ["navigation"],
    },
    {
        id: "home-page",
        label: "Home Page",
        component: StepHomePage_1.default,
        recommended: ["layout"],
    },
    {
        id: "checkout-page",
        label: "Checkout Page",
        component: StepCheckoutPage_1.default,
        recommended: ["layout"],
    },
    {
        id: "shop-page",
        label: "Shop Page",
        component: StepShopPage_1.default,
        recommended: ["layout"],
    },
    {
        id: "product-page",
        label: "Product Page",
        component: StepProductPage_1.default,
        recommended: ["shop-page"],
    },
    {
        id: "additional-pages",
        label: "Additional Pages",
        component: StepAdditionalPages_1.default,
        recommended: ["layout"],
    },
    { id: "env-vars", label: "Environment Variables", component: StepEnvVars_1.default },
    { id: "summary", label: "Summary", component: StepSummary_1.default },
    {
        id: "import-data",
        label: "Import Data",
        component: StepImportData_1.default,
        optional: true,
    },
    {
        id: "seed-data",
        label: "Seed Data",
        component: StepSeedData_1.default,
        optional: true,
    },
    {
        id: "hosting",
        label: "Hosting",
        component: StepHosting_1.default,
        optional: true,
    },
];
var getSteps = function () { return __spreadArray([], stepList, true); };
exports.getSteps = getSteps;
var getRequiredSteps = function () {
    return (0, exports.getSteps)().filter(function (s) { return !s.optional; });
};
exports.getRequiredSteps = getRequiredSteps;
exports.steps = Object.fromEntries((0, exports.getSteps)().map(function (s) { return [s.id, s]; }));
/** Mapping of step id to its index in the overall flow */
exports.stepIndex = Object.fromEntries(stepList.map(function (s, i) { return [s.id, i]; }));
/** Horizontal progress indicator for the configurator wizard. */
function ConfiguratorProgress(_a) {
    var _b;
    var _c;
    var currentStepId = _a.currentStepId, completed = _a.completed;
    var list = (0, exports.getSteps)();
    var currentIdx = (_c = exports.stepIndex[currentStepId]) !== null && _c !== void 0 ? _c : 0;
    return className = "flex items-center gap-4 text-sm" >
        { list: list, : .map(function (s, idx) { return key = { s: s, : .id }; }, className = "flex flex-1 items-center gap-2" >
                className, { cn: function (, completed, _a) {
                    var s = _a[0];
                }, : .id } === "complete" &&
                "bg-primary border-primary text-primary-fg", idx === currentIdx && "border-primary", idx > currentIdx && "text-muted-foreground border-muted") }
        >
            (_b = { completed: completed }, _b[s.id] =  === "complete" ? className = "h-4 w-4" /  >
                :
            , _b)(idx + 1);
}
/span>
    < span;
className = { cn: function (idx) { } } === currentIdx && "font-medium";
 > {
    s: s,
    : .label
} < /span>;
{
    idx < list.length - 1 && className;
    "border-muted ml-2 flex-1 border-t" /  >
    ;
}
/li>;
/ol>;
;
