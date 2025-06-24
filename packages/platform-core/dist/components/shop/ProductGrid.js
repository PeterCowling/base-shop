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
exports.ProductGrid = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var ProductCard_1 = require("./ProductCard");
function ProductGridInner(_a) {
    var skus = _a.skus;
    // simple alphabetic sort for deterministic order (SSR/CSR match)
    var sorted = (0, react_1.useMemo)(function () { return __spreadArray([], skus, true).sort(function (a, b) { return a.title.localeCompare(b.title); }); }, [skus]);
    return ((0, jsx_runtime_1.jsx)("section", { className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: sorted.map(function (sku) { return ((0, jsx_runtime_1.jsx)(ProductCard_1.ProductCard, { sku: sku }, sku.id)); }) }));
}
exports.ProductGrid = (0, react_1.memo)(ProductGridInner);
