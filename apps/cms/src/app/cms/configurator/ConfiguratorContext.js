// apps/cms/src/app/cms/configurator/ConfiguratorContext.tsx
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
exports.ConfiguratorProvider = ConfiguratorProvider;
exports.useConfigurator = useConfigurator;
var react_1 = require("react");
var schema_1 = require("../wizard/schema");
var useConfiguratorPersistence_1 = require("./hooks/useConfiguratorPersistence");
var ConfiguratorStatusBar_1 = require("./ConfiguratorStatusBar");
var ConfiguratorContext = (0, react_1.createContext)(null);
function ConfiguratorProvider(_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)(schema_1.wizardStateSchema.parse({})), state = _b[0], setState = _b[1];
    var _c = (0, react_1.useState)(false), dirty = _c[0], setDirty = _c[1];
    var resetDirty = function () { return setDirty(false); };
    // Persist state to localStorage
    var _d = (0, useConfiguratorPersistence_1.useConfiguratorPersistence)(state, function (s) { return setState(function () { return s; }); }, undefined, resetDirty), markStepComplete = _d[0], saving = _d[1];
    var update = function (key, value) {
        setState(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = value, _a)));
        });
        setDirty(true);
    };
    var setThemeOverrides = function (v) {
        setState(function (prev) { return (__assign(__assign({}, prev), { themeOverrides: v })); });
        setDirty(true);
    };
    (0, react_1.useEffect)(function () {
        var handler = function (e) {
            if (!dirty)
                return;
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handler);
        return function () { return window.removeEventListener("beforeunload", handler); };
    }, [dirty]);
    return (<ConfiguratorContext.Provider value={{
            state: state,
            setState: setState,
            update: update,
            markStepComplete: markStepComplete,
            themeDefaults: state.themeDefaults,
            themeOverrides: state.themeOverrides,
            setThemeOverrides: setThemeOverrides,
            dirty: dirty,
            resetDirty: resetDirty,
            saving: saving,
        }}>
      {children}
      <ConfiguratorStatusBar_1.default />
    </ConfiguratorContext.Provider>);
}
function useConfigurator() {
    var ctx = (0, react_1.useContext)(ConfiguratorContext);
    if (!ctx)
        throw new Error("useConfigurator must be used within ConfiguratorProvider");
    return ctx;
}
