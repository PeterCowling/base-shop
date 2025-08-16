// apps/cms/src/app/cms/configurator/hooks/useThemeLoader.ts
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
exports.useThemeLoader = useThemeLoader;
var react_1 = require("react");
var tokenUtils_1 = require("../../wizard/tokenUtils");
var ConfiguratorContext_1 = require("../ConfiguratorContext");
/**
 * Loads theme tokens whenever the selected theme changes and returns the
 * computed CSS style object for the current tokens.
 */
function useThemeLoader() {
    var _a = (0, ConfiguratorContext_1.useConfigurator)(), state = _a.state, setState = _a.setState;
    var theme = state.theme, themeDefaults = state.themeDefaults, themeOverrides = state.themeOverrides;
    /* On initial mount ensure base tokens exist */
    (0, react_1.useEffect)(function () {
        if (!themeDefaults || Object.keys(themeDefaults).length === 0) {
            setState(function (prev) { return (__assign(__assign({}, prev), { themeDefaults: tokenUtils_1.baseTokens })); });
        }
    }, []);
    /* Load tokens for selected theme */
    (0, react_1.useEffect)(function () {
        (0, tokenUtils_1.loadThemeTokens)(theme).then(function (tv) {
            setState(function (prev) { return (__assign(__assign({}, prev), { themeDefaults: tv })); });
        });
    }, [theme, setState]);
    return __assign(__assign({}, themeDefaults), themeOverrides);
}
