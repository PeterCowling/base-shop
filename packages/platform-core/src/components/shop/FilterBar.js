"use strict";
// src/components/shop/FilterBar.tsx
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FilterBar;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
function FilterBar({ definitions, values: externalValues, onChange, }) {
    const [values, setValues] = (0, react_1.useState)(externalValues ?? {});
    const deferred = (0, react_1.useDeferredValue)(values);
    // Keep internal state in sync when parent updates its values (e.g. after a
    // reload where values are read from the URL).
    (0, react_1.useEffect)(() => {
        setValues(externalValues ?? {});
    }, [externalValues]);
    (0, react_1.useEffect)(() => {
        onChange(deferred);
    }, [deferred, onChange]);
    function handleChange(def, value) {
        setValues((prev) => ({
            ...prev,
            [def.name]: value === ""
                ? undefined
                : def.type === "number"
                    ? Number(value)
                    : value,
        }));
    }
    function handleClear() {
        setValues({});
    }
    return ((0, jsx_runtime_1.jsxs)("form", { "aria-label": "Filters", className: "mb-6 flex gap-4 items-center justify-between flex-wrap", onSubmit: (e) => e.preventDefault(), children: [definitions.map((def) => def.type === "select" ? ((0, jsx_runtime_1.jsxs)("label", { className: "flex items-center gap-2 text-sm", children: [def.label, ":", (0, jsx_runtime_1.jsxs)("select", { value: values[def.name] ?? "", onChange: (e) => handleChange(def, e.target.value), className: "border rounded px-2 py-1 text-sm", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "All" }), " ", def.options.map((opt) => ((0, jsx_runtime_1.jsx)("option", { children: opt }, opt)))] })] }, def.name)) : ((0, jsx_runtime_1.jsxs)("label", { className: "flex items-center gap-2 text-sm", children: [def.label, ":", (0, jsx_runtime_1.jsx)("input", { type: "number", value: values[def.name] === undefined
                            ? ""
                            : values[def.name], onChange: (e) => handleChange(def, e.target.value), className: "border rounded px-2 py-1 text-sm" })] }, def.name))), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: handleClear, className: "text-sm underline min-h-11 min-w-11", children: "Clear Filters" })] }));
}
