import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Image from "next/image";
import { cn } from "../../utils/cn";
import { Price } from "../atoms/Price";
import { QuantityInput } from "../molecules/QuantityInput";
export function CartTemplate({ cart, onQtyChange, onRemove, className, ...props }) {
    const lines = Object.values(cart);
    const subtotal = lines.reduce((s, l) => s + l.sku.price * l.qty, 0);
    const deposit = lines.reduce((s, l) => s + (l.sku.deposit ?? 0) * l.qty, 0);
    if (!lines.length) {
        return (_jsx("p", { className: cn("p-8 text-center", className), children: "Your cart is empty." }));
    }
    return (_jsxs("div", { className: cn("space-y-6", className), ...props, children: [_jsx("h2", { className: "text-xl font-semibold", children: "Your Bag" }), _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b text-left", children: [_jsx("th", { className: "py-2", children: "Item" }), _jsx("th", { children: "Qty" }), _jsx("th", { className: "text-right", children: "Price" }), onRemove && _jsx("th", { className: "sr-only", children: "Remove" })] }) }), _jsx("tbody", { children: lines.map((line) => (_jsxs("tr", { className: "border-b last:border-0", children: [_jsx("td", { className: "py-2", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "relative hidden h-12 w-12 sm:block", children: _jsx(Image, { src: line.sku.image, alt: line.sku.title, fill: true, sizes: "3rem", className: "rounded-md object-cover" }) }), line.sku.title] }) }), _jsx("td", { children: _jsx(QuantityInput, { value: line.qty, onChange: (v) => onQtyChange?.(line.sku.id, v), className: "justify-center" }) }), _jsx("td", { className: "text-right", children: _jsx(Price, { amount: line.sku.price * line.qty }) }), onRemove && (_jsx("td", { className: "text-right", children: _jsx("button", { type: "button", onClick: () => onRemove(line.sku.id), className: "text-red-600 hover:underline", children: "Remove" }) }))] }, line.sku.id))) }), _jsxs("tfoot", { children: [_jsxs("tr", { children: [_jsx("td", {}), _jsx("td", { className: "py-2", children: "Deposit" }), _jsx("td", { className: "text-right", children: _jsx(Price, { amount: deposit }) }), onRemove && _jsx("td", {})] }), _jsxs("tr", { children: [_jsx("td", {}), _jsx("td", { className: "py-2 font-semibold", children: "Total" }), _jsx("td", { className: "text-right font-semibold", children: _jsx(Price, { amount: subtotal + deposit }) }), onRemove && _jsx("td", {})] })] })] })] }));
}
