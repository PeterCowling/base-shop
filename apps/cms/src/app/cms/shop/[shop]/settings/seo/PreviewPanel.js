"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Image from "next/image";
/**
 * Renders live previews for search engine result pages and social cards.
 */
const PreviewPanel = ({ title, description = "", image, url = "example.com", }) => {
    const placeholder = {
        title: title || "Title goes here",
        description: description || "Description goes here",
        url,
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-muted-foreground text-sm", children: "Google result" }), _jsxs("div", { className: "rounded-md border p-4 text-sm", children: [_jsx("p", { className: "text-blue-600", children: placeholder.title }), _jsx("p", { className: "text-green-700", children: placeholder.url }), _jsx("p", { className: "text-muted-foreground", children: placeholder.description })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-muted-foreground text-sm", children: "Open Graph" }), _jsxs("div", { className: "flex gap-4 rounded-md border p-4", children: [image && (_jsx(Image, { src: image, alt: "preview image", width: 120, height: 120, className: "size-20 rounded object-cover" })), _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "font-medium", children: placeholder.title }), _jsx("p", { className: "text-muted-foreground", children: placeholder.description }), _jsx("p", { className: "text-muted-foreground", children: placeholder.url })] })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-muted-foreground text-sm", children: "Twitter card" }), _jsxs("div", { className: "flex gap-4 rounded-md border p-4", children: [image && (_jsx(Image, { src: image, alt: "preview image", width: 120, height: 120, className: "size-20 rounded object-cover" })), _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "font-medium", children: placeholder.title }), _jsx("p", { className: "text-muted-foreground", children: placeholder.description })] })] })] })] }));
};
export default PreviewPanel;
