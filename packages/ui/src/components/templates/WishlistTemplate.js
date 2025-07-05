import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Image from "next/image";
import { cn } from "../../utils/cn";
import { Button } from "../atoms-shadcn";
import { Price } from "../atoms/Price";
export function WishlistTemplate({ items, onAddToCart, onRemove, ctaAddToCartLabel = "Add to cart", ctaRemoveLabel = "Remove", className, ...props }) {
    return (_jsxs("div", { className: cn("space-y-6", className), ...props, children: [_jsx("h2", { className: "text-xl font-semibold", children: "Wishlist" }), _jsx("div", { className: "space-y-4", children: items.map((item) => (_jsxs("div", { className: "flex items-center gap-4 border-b pb-4 last:border-b-0", children: [_jsx("div", { className: "relative h-16 w-16 shrink-0", children: _jsx(Image, { src: item.image, alt: item.title, fill: true, sizes: "64px", className: "rounded object-cover" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-medium", children: item.title }), _jsxs("div", { className: "text-muted-foreground flex items-center gap-2 text-sm", children: [_jsx(Price, { amount: item.price }), item.quantity !== undefined && _jsxs("span", { children: ["x", item.quantity] })] })] }), _jsxs("div", { className: "flex gap-2", children: [onAddToCart && (_jsx(Button, { onClick: () => onAddToCart(item), children: ctaAddToCartLabel })), onRemove && (_jsx(Button, { variant: "destructive", onClick: () => onRemove(item), children: ctaRemoveLabel }))] })] }, item.id))) })] }));
}
