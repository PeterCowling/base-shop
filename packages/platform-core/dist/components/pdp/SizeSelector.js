// src/components/pdp/SizeSelector.tsx
"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SizeSelector;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
function SizeSelector(_a) {
    var sizes = _a.sizes, onSelect = _a.onSelect;
    var _b = (0, react_1.useState)(null), selected = _b[0], setSelected = _b[1];
    function handleClick(size) {
        setSelected(size);
        onSelect(size);
    }
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-2", children: sizes.map(function (s) { return ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: function () { return handleClick(s); }, className: "px-3 py-1 border rounded-full text-sm ".concat(selected === s
                ? "bg-gray-900 text-white"
                : "bg-white hover:bg-gray-100"), children: s }, s)); }) }));
}
