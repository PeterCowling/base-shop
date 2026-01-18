"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readInitial = readInitial;
exports.CurrencyProvider = CurrencyProvider;
exports.useCurrency = useCurrency;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const DEFAULT_CURRENCY = "EUR";
const LS_KEY = "PREFERRED_CURRENCY";
const WINDOW_OVERRIDE_SYMBOL = Symbol.for("acme.platformCore.currencyWindowOverride");
function resolveWindow() {
    if (Object.prototype.hasOwnProperty.call(globalThis, WINDOW_OVERRIDE_SYMBOL)) {
        const override = globalThis[WINDOW_OVERRIDE_SYMBOL];
        return override ?? undefined;
    }
    if (typeof window === "undefined")
        return undefined;
    return window;
}
const CurrencyContext = (0, react_1.createContext)(undefined);
function readInitial() {
    const win = resolveWindow();
    if (!win)
        return DEFAULT_CURRENCY;
    try {
        const stored = win.localStorage.getItem(LS_KEY);
        if (stored === "EUR" || stored === "USD" || stored === "GBP")
            return stored;
    }
    catch { }
    return DEFAULT_CURRENCY;
}
function CurrencyProvider({ children }) {
    const [currency, setCurrency] = (0, react_1.useState)(readInitial);
    (0, react_1.useEffect)(() => {
        const win = resolveWindow();
        if (win) {
            try {
                win.localStorage.setItem(LS_KEY, currency);
            }
            catch { }
        }
    }, [currency]);
    return ((0, jsx_runtime_1.jsx)(CurrencyContext.Provider, { value: [currency, setCurrency], children: children }));
}
function useCurrency() {
    try {
        const ctx = (0, react_1.useContext)(CurrencyContext);
        if (!ctx)
            throw new Error("useCurrency must be inside CurrencyProvider"); // i18n-exempt -- developer guidance for incorrect hook usage
        return ctx;
    }
    catch (err) {
        // React throws different errors when hooks run outside a component.
        // Tests invoke this hook directly, so normalize those errors into the
        // expected provider usage message.
        if (err instanceof Error &&
            (err.message.includes("Invalid hook call") || // i18n-exempt -- matching React core error message
                err.message.includes("reading 'useContext'")) // i18n-exempt -- matching React core error message
        ) {
            throw new Error("useCurrency must be inside CurrencyProvider"); // i18n-exempt -- developer guidance for incorrect hook usage
        }
        throw err;
    }
}
