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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartProvider = CartProvider;
exports.useCart = useCart;
var jsx_runtime_1 = require("react/jsx-runtime");
var cartCookie_1 = require("@/lib/cartCookie");
var react_1 = require("react");
/* ---------- reducer ---------- */
function reducer(state, action) {
    var _a, _b;
    var _c;
    switch (action.type) {
        case "add": {
            var line = state[action.sku.id];
            return __assign(__assign({}, state), (_a = {}, _a[action.sku.id] = { sku: action.sku, qty: ((_c = line === null || line === void 0 ? void 0 : line.qty) !== null && _c !== void 0 ? _c : 0) + 1 }, _a));
        }
        case "remove": {
            var _d = state, _e = action.id, _1 = _d[_e], rest = __rest(_d, [typeof _e === "symbol" ? _e : _e + ""]);
            return rest;
        }
        case "setQty":
            return __assign(__assign({}, state), (_b = {}, _b[action.id] = __assign(__assign({}, state[action.id]), { qty: Math.max(1, action.qty) }), _b));
        default:
            return state;
    }
}
/* ---------- persistence helpers ---------- */
var LS_KEY = cartCookie_1.CART_COOKIE;
function readInitial() {
    if (typeof window === "undefined")
        return {};
    try {
        return JSON.parse(decodeURIComponent(localStorage.getItem(LS_KEY) || "{}"));
    }
    catch (_a) {
        return {};
    }
}
function persist(state) {
    if (typeof window !== "undefined") {
        var encoded = (0, cartCookie_1.encodeCartCookie)(state);
        /* localStorage for client rehydration */
        localStorage.setItem(LS_KEY, encoded);
        /* cookie for server-side pages (e.g. /checkout) */
        document.cookie = (0, cartCookie_1.asSetCookieHeader)(encoded);
    }
}
/* ---------- context ---------- */
var CartContext = (0, react_1.createContext)(undefined);
function CartProvider(_a) {
    var children = _a.children;
    var _b = (0, react_1.useReducer)(reducer, {}, readInitial), state = _b[0], dispatch = _b[1];
    (0, react_1.useEffect)(function () { return persist(state); }, [state]);
    return ((0, jsx_runtime_1.jsx)(CartContext.Provider, { value: [state, dispatch], children: children }));
}
function useCart() {
    var ctx = (0, react_1.useContext)(CartContext);
    if (!ctx)
        throw new Error("useCart must be inside CartProvider");
    return ctx;
}
