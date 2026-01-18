"use strict";
// src/components/pdp/SizeSelector.tsx
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SizeSelector;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
function SizeSelector({ sizes, onSelect, }) {
    const [selected, setSelected] = (0, react_1.useState)(null);
    function handleClick(size) {
        setSelected(size);
        onSelect(size);
    }
    // Tailwind utility class tokens
    const selectedClasses = "bg-gray-900 text-white"; // i18n-exempt -- ABC-123 CSS utility tokens
    const unselectedClasses = "bg-white hover:bg-gray-100"; // i18n-exempt -- ABC-123 CSS utility tokens
    return (
    // eslint-disable-next-line ds/enforce-layout-primitives -- ABC-123 horizontal chip list
    (0, jsx_runtime_1.jsx)("div", { className: "inline-flex flex-wrap gap-2", children: sizes.map((s) => ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => handleClick(s), className: `px-3 py-1 border rounded-full text-sm min-h-10 min-w-10 ${selected === s ? selectedClasses : unselectedClasses}`, children: s }, s))) }));
}
