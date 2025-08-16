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
exports.InvalidProductContext = void 0;
exports.InvalidProductProvider = InvalidProductProvider;
exports.useInvalidProductContext = useInvalidProductContext;
var react_1 = require("react");
exports.InvalidProductContext = (0, react_1.createContext)(null);
function InvalidProductProvider(_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)({}), invalidProducts = _b[0], setInvalidProducts = _b[1];
    var markValidity = (0, react_1.useCallback)(function (key, valid, slug) {
        setInvalidProducts(function (prev) {
            var next = __assign({}, prev);
            if (valid) {
                delete next[key];
            }
            else {
                next[key] = slug;
            }
            return next;
        });
    }, []);
    return (<exports.InvalidProductContext.Provider value={{ invalidProducts: invalidProducts, markValidity: markValidity }}>
      {children}
    </exports.InvalidProductContext.Provider>);
}
function useInvalidProductContext() {
    var ctx = (0, react_1.useContext)(exports.InvalidProductContext);
    if (!ctx)
        throw new Error("useInvalidProductContext must be used within InvalidProductProvider");
    return ctx;
}
