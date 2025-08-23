import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button, Input } from "../atoms/shadcn";
import { ProductCard } from "../organisms/ProductCard";
export function LiveShoppingEventTemplate({ streamUrl, products = [], chatMessages = [], onSendMessage, onAddToCart, ctaLabel = "Add to cart", className, ...props }) {
    const [message, setMessage] = React.useState("");
    function handleSubmit(e) {
        e.preventDefault();
        const text = message.trim();
        if (!text)
            return;
        onSendMessage?.(text);
        setMessage("");
    }
    return (_jsxs("div", { className: cn("grid gap-6 lg:grid-cols-3", className), ...props, children: [_jsxs("div", { className: "space-y-4 lg:col-span-2", children: [_jsx("div", { className: "aspect-video w-full bg-fg", children: _jsx("video", { src: streamUrl, controls: true, className: "h-full w-full" }) }), _jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Chat" }), _jsxs("div", { className: "h-64 space-y-2 overflow-y-auto rounded-md border bg-bg p-4", children: [chatMessages.map((m) => (_jsxs("div", { className: "text-sm", children: [_jsxs("span", { className: "mr-1 font-medium", children: [m.user, ":"] }), _jsx("span", { children: m.message })] }, m.id))), chatMessages.length === 0 && (_jsx("p", { className: "text-muted-foreground text-sm", children: "No messages yet." }))] }), onSendMessage && (_jsxs("form", { onSubmit: handleSubmit, className: "flex gap-2", children: [_jsx(Input, { value: message, onChange: (e) => setMessage(e.target.value), placeholder: "Say something\u2026", className: "flex-1" }), _jsx(Button, { type: "submit", children: "Send" })] }))] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Products" }), _jsxs("div", { className: "grid gap-4", children: [products.map((p) => (_jsx(ProductCard, { product: p, onAddToCart: onAddToCart, ctaLabel: ctaLabel }, p.id))), products.length === 0 && (_jsx("p", { className: "text-muted-foreground text-sm", children: "No products currently highlighted." }))] })] })] }));
}
