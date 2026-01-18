"use strict";
// packages/platform-core/components/shop/AddToCartButton.tsx
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AddToCartButton;
const jsx_runtime_1 = require("react/jsx-runtime");
const CartContext_1 = require("../../contexts/CartContext");
const react_1 = require("react");
const react_dom_1 = require("react-dom");
function AddToCartButton({ sku, size, disabled = false, quantity = 1, meta, onAdded, }) {
    const [, dispatch] = (0, CartContext_1.useCart)();
    const btnRef = (0, react_1.useRef)(null);
    const [adding, setAdding] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [forceDisabled, setForceDisabled] = (0, react_1.useState)(false);
    // Keep the actual DOM disabled state in sync to satisfy testing-library's
    // toBeDisabled matcher under JSDOM consistently when timers are mocked.
    (0, react_1.useEffect)(() => {
        const el = btnRef.current;
        if (!el)
            return;
        const off = !!disabled;
        const isDisabled = forceDisabled || adding || off;
        el.disabled = isDisabled;
        try {
            if (isDisabled)
                el.setAttribute("disabled", "");
            else
                el.removeAttribute("disabled");
        }
        catch {
            // ignore
        }
    }, [adding, forceDisabled, disabled]);
    async function handleClick(_e) {
        if (disabled)
            return;
        if (quantity < 1) {
            setError("Quantity must be at least 1"); // i18n-exempt -- ABC-123 validation message
            return;
        }
        // Snapshot the target to survive React event pooling
        // Synchronously mark disabled before any async work to avoid flake
        (0, react_dom_1.flushSync)(() => {
            setForceDisabled(true);
        });
        (0, react_dom_1.flushSync)(() => {
            setAdding(true);
            setError(null);
        });
        try {
            await dispatch({ type: "add", sku, size, qty: quantity, meta });
            onAdded?.({ sku, size, quantity, meta });
        }
        catch (err) {
            setError(err.message ?? "Unable to add to cart"); // i18n-exempt -- ABC-123 fallback error message
        }
        finally {
            (0, react_dom_1.flushSync)(() => {
                setAdding(false);
            });
            (0, react_dom_1.flushSync)(() => {
                setAdding(false);
                setForceDisabled(false);
            });
        }
    }
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("fieldset", { disabled: forceDisabled || adding || disabled, className: "border-0 m-0 p-0", children: (0, jsx_runtime_1.jsx)("button", { ref: btnRef, onClick: handleClick, disabled: forceDisabled || adding || disabled, "aria-disabled": forceDisabled || adding || disabled ? true : undefined, "aria-label": "Add to cart", className: "mt-auto rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50 min-h-11 min-w-11", children: adding ? ((0, jsx_runtime_1.jsxs)("span", { className: "inline-flex items-center gap-2", "aria-live": "polite", children: [(0, jsx_runtime_1.jsxs)("svg", { className: "h-4 w-4 animate-spin", viewBox: "0 0 24 24", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" })] }), "Adding...", " "] })) : (
                    // i18n-exempt -- ABC-123 button copy pending translation integration
                    "Add to cart") }) }), error && ((0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-red-600", role: "alert", children: error }))] }));
}
