import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ProductBadge } from "../atoms/ProductBadge";
import { ProductCard } from "./ProductCard";
const product = {
    id: "1",
    title: "Sample Product",
    image: "https://placehold.co/300x300",
    price: 29,
};
const meta = {
    component: ProductCard,
    args: { product },
};
export default meta;
export const Default = {};
export const WithBadge = {
    render: (args) => (_jsxs("div", { className: "relative", children: [_jsx(ProductCard, { ...args }), _jsx(ProductBadge, { label: "Sale", variant: "sale", className: "absolute top-2 left-2" })] })),
};
export const OutOfStock = {
    render: (args) => (_jsxs("div", { className: "relative", children: [_jsx(ProductCard, { ...args }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/60 font-semibold text-white", children: "Out of stock" })] })),
};
