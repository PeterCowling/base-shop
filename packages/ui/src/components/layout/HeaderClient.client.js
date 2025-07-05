"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCart } from "@/contexts/CartContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "../../utils/cn";
export default function HeaderClient({ lang, initialQty, nav = [], height = "h-16", padding = "px-6", }) {
    const [cart] = useCart();
    const [qty, setQty] = useState(initialQty);
    // keep qty in sync after hydration
    useEffect(() => {
        setQty(Object.values(cart).reduce((s, line) => s + line.qty, 0));
    }, [cart]);
    return (_jsxs("header", { className: cn("flex items-center justify-between", height, padding), children: [_jsx(Link, { href: `/${lang}`, className: "text-xl font-bold", children: "Base-Shop" }), _jsxs("nav", { className: "flex items-center gap-6", children: [nav.map((item) => (_jsx(Link, { href: item.url.startsWith("/") ? `/${lang}${item.url}` : item.url, children: item.label }, item.url))), _jsxs(Link, { href: `/${lang}/checkout`, className: "relative hover:underline", children: ["Cart", qty > 0 && (_jsx("span", { className: "absolute -top-2 -right-3 rounded-full bg-red-600 px-1.5 text-xs text-white", children: qty }))] })] })] }));
}
