"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../../atoms/shadcn";
import { ProductPublication } from "@acme/platform-core/products";
import Link from "next/link";
export default function ProductRowActions({ shop, product, onDuplicate, onDelete, }) {
    return (_jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Link, { href: `/cms/shop/${shop}/products/${product.id}/edit`, className: "bg-primary hover:bg-primary/90 rounded px-2 py-1 text-xs text-primary-fg", children: "Edit" }), _jsx(Link, { href: `/en/product/${product.id}`, className: "rounded border px-2 py-1 text-xs hover:bg-muted", children: "View" }), _jsx(Button, { onClick: () => onDuplicate(product.id), variant: "outline", className: "px-2 py-1 text-xs", children: "Duplicate" }), _jsx(Button, { onClick: () => onDelete(product.id), variant: "outline", className: "px-2 py-1 text-xs hover:bg-danger hover:text-danger-foreground", "data-token": "--color-danger", children: "Delete" })] }));
}
