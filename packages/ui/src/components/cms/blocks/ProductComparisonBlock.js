import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Display a simple comparison table for selected products.
 */
export default function ProductComparisonBlock({ skus = [], attributes }) {
    if (!skus.length || !attributes.length)
        return null;
    return (_jsxs("table", { className: "w-full border-collapse text-sm", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "border px-2 py-1 text-left", children: "Product" }), attributes.map((attr) => (_jsx("th", { className: "border px-2 py-1 text-left capitalize", children: attr }, attr)))] }) }), _jsx("tbody", { children: skus.map((sku) => (_jsxs("tr", { children: [_jsx("td", { className: "border px-2 py-1", children: sku.title }), attributes.map((attr) => (_jsx("td", { className: "border px-2 py-1", children: String(sku[attr] ?? "") }, attr)))] }, sku.id))) })] }));
}
