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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StepTokens;
var shadcn_1 = require("@/components/atoms/shadcn");
var StyleEditor_1 = require("@/components/cms/StyleEditor");
var WizardPreview_1 = require("../../wizard/WizardPreview");
var useStepCompletion_1 = require("../hooks/useStepCompletion");
var navigation_1 = require("next/navigation");
var react_1 = require("react");
var ConfiguratorContext_1 = require("../ConfiguratorContext");
var useThemeLoader_1 = require("../hooks/useThemeLoader");
function StepTokens() {
    var themeStyle = (0, useThemeLoader_1.useThemeLoader)();
    var _a = (0, useStepCompletion_1.default)("tokens"), markComplete = _a[1];
    var router = (0, navigation_1.useRouter)();
    var _b = (0, ConfiguratorContext_1.useConfigurator)(), themeDefaults = _b.themeDefaults, themeOverrides = _b.themeOverrides, setThemeOverrides = _b.setThemeOverrides;
    var tokens = __assign(__assign({}, themeDefaults), themeOverrides);
    var _c = (0, react_1.useState)(null), selected = _c[0], setSelected = _c[1];
    var handleChange = function (next) {
        var overrides = __assign({}, next);
        for (var _i = 0, _a = Object.keys(overrides); _i < _a.length; _i++) {
            var key = _a[_i];
            if (overrides[key] === themeDefaults[key]) {
                delete overrides[key];
            }
        }
        setThemeOverrides(overrides);
    };
    var previewStyle = __assign(__assign({}, themeStyle), tokens);
    return (<div className="space-y-4">
      <h2 className="text-xl font-semibold">Customize Tokens</h2>
      <WizardPreview_1.default style={previewStyle} inspectMode onTokenSelect={function (t) { return setSelected(t); }}/>
      {selected && (<StyleEditor_1.default tokens={themeOverrides} baseTokens={themeDefaults} onChange={handleChange} focusToken={selected}/>)}
      <div className="flex justify-end">
        <shadcn_1.Button onClick={function () {
            markComplete(true);
            router.push("/cms/configurator");
        }}>
          Save & return
        </shadcn_1.Button>
      </div>
    </div>);
}
