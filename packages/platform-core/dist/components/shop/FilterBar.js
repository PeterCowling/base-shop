// src/components/shop/FilterBar.tsx
"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FilterBar;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
function FilterBar(_a) {
    var onChange = _a.onChange;
    var _b = (0, react_1.useState)(""), size = _b[0], setSize = _b[1];
    var deferredSize = (0, react_1.useDeferredValue)(size);
    // propagate filters when typing settles
    (0, react_1.useEffect)(function () {
        onChange({ size: deferredSize !== null && deferredSize !== void 0 ? deferredSize : undefined });
    }, [deferredSize, onChange]);
    return ((0, jsx_runtime_1.jsx)("form", { "aria-label": "Filters", className: "mb-6 flex gap-4 items-center justify-between flex-wrap", onSubmit: function (e) { return e.preventDefault(); }, children: (0, jsx_runtime_1.jsxs)("label", { className: "flex items-center gap-2 text-sm", children: ["Size:", (0, jsx_runtime_1.jsxs)("select", { value: size, onChange: function (e) { return setSize(e.target.value); }, className: "border rounded px-2 py-1 text-sm", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "All" }), ["36", "37", "38", "39", "40", "41", "42", "43", "44"].map(function (s) { return ((0, jsx_runtime_1.jsx)("option", { children: s }, s)); })] })] }) }));
}
