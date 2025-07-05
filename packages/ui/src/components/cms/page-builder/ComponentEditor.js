"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { getShopFromPath } from "@platform-core/utils/getShopFromPath";
import useMediaUpload from "@ui/hooks/useMediaUpload";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../../atoms-shadcn";
export default function ComponentEditor({ component, onChange }) {
    if (!component)
        return null;
    const pathname = usePathname() ?? "";
    const shop = getShopFromPath(pathname);
    const [media, setMedia] = useState([]);
    /* ─────────── media list helpers ─────────── */
    async function loadMedia() {
        if (!shop)
            return;
        try {
            const res = await fetch(`/cms/api/media?shop=${shop}`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data))
                    setMedia(data);
            }
        }
        catch {
            /* silent */
        }
    }
    useEffect(() => {
        void loadMedia();
    }, [shop]);
    /* ─────────── reusable image-picker ─────────── */
    function ImagePicker({ onSelect, children, }) {
        const [open, setOpen] = useState(false);
        const { pendingFile, altText, setAltText, isValid, actual, inputRef, onFileChange, handleUpload, error, } = useMediaUpload({
            shop: shop ?? "",
            requiredOrientation: "landscape",
            onUploaded: (item) => {
                setMedia((m) => [item, ...m]);
            },
        });
        useEffect(() => {
            if (open)
                void loadMedia();
        }, [open]);
        return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: children }), _jsxs(DialogContent, { className: "max-w-xl space-y-4", children: [_jsx(DialogTitle, { children: "Select image" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { ref: inputRef, type: "file", accept: "image/*", onChange: onFileChange, className: "flex-1" }), pendingFile && isValid && (_jsx(Button, { type: "button", onClick: handleUpload, children: "Upload" }))] }), pendingFile && isValid && (_jsx(Input, { value: altText, onChange: (e) => setAltText(e.target.value), placeholder: "Alt text" })), pendingFile && isValid !== null && (_jsx("p", { className: "text-sm", children: isValid
                                ? `Image orientation is ${actual}`
                                : `Selected image is ${actual}; please upload a landscape image.` })), error && _jsx("p", { className: "text-sm text-red-600", children: error }), _jsxs("div", { className: "grid max-h-64 grid-cols-3 gap-2 overflow-auto", children: [media.map((m) => (_jsx("button", { type: "button", onClick: () => {
                                        onSelect(m.url);
                                        setOpen(false);
                                    }, className: "relative aspect-square", children: _jsx(Image, { src: m.url, alt: m.altText || "media", fill: true, className: "object-cover" }) }, m.url))), media.length === 0 && (_jsx("p", { className: "text-muted-foreground col-span-3 text-sm", children: "No media found." }))] })] })] }));
    }
    /* ─────────── generic helpers ─────────── */
    const handleInput = (field, value) => {
        onChange({ [field]: value });
    };
    /**
     * Tiny utility for editing array-of-objects props
     * (e.g. `slides`, `testimonials`, …).
     */
    const arrayEditor = (prop, items, fields) => {
        const list = (items ?? []);
        return (_jsxs("div", { className: "space-y-2", children: [list.map((item, idx) => (_jsxs("div", { className: "space-y-1 rounded border p-2", children: [fields.map((f) => (_jsxs("div", { className: "flex items-start gap-2", children: [_jsx(Input, { value: item[f] ?? "", onChange: (e) => {
                                        const next = [...list];
                                        next[idx] = { ...next[idx], [f]: e.target.value };
                                        onChange({ [prop]: next });
                                    }, placeholder: f, className: "flex-1" }), f === "src" && (_jsx(ImagePicker, { onSelect: (url) => {
                                        const next = [...list];
                                        next[idx] = { ...next[idx], src: url };
                                        onChange({ [prop]: next });
                                    }, children: _jsx(Button, { type: "button", variant: "outline", children: "Pick" }) }))] }, f))), _jsx(Button, { variant: "destructive", onClick: () => {
                                const next = list.filter((_, i) => i !== idx);
                                onChange({ [prop]: next });
                            }, children: "Remove" })] }, idx))), _jsx(Button, { onClick: () => {
                        const blank = Object.fromEntries(fields.map((f) => [f, ""]));
                        onChange({ [prop]: [...list, blank] });
                    }, children: "Add" })] }));
    };
    /* ─────────── per-component editors ─────────── */
    let specific = null;
    switch (component.type) {
        case "ContactForm":
            specific = (_jsxs("div", { className: "space-y-2", children: [_jsx(Input, { label: "Action", value: component.action ?? "", onChange: (e) => handleInput("action", e.target.value) }), _jsx(Input, { label: "Method", value: component.method ?? "", onChange: (e) => handleInput("method", e.target.value) })] }));
            break;
        case "Gallery":
            specific = arrayEditor("images", component.images, [
                "src",
                "alt",
            ]);
            break;
        case "Image":
            specific = (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-start gap-2", children: [_jsx(Input, { value: component.src ?? "", onChange: (e) => handleInput("src", e.target.value), placeholder: "src", className: "flex-1" }), _jsx(ImagePicker, { onSelect: (url) => handleInput("src", url), children: _jsx(Button, { type: "button", variant: "outline", children: "Pick" }) })] }), _jsx(Input, { value: component.alt ?? "", onChange: (e) => handleInput("alt", e.target.value), placeholder: "alt" })] }));
            break;
        case "Testimonials":
            specific = arrayEditor("testimonials", component.testimonials, [
                "quote",
                "name",
            ]);
            break;
        case "HeroBanner":
            specific = arrayEditor("slides", component.slides, [
                "src",
                "alt",
                "headlineKey",
                "ctaKey",
            ]);
            break;
        case "ValueProps":
            specific = arrayEditor("items", component.items, [
                "icon",
                "title",
                "desc",
            ]);
            break;
        case "ReviewsCarousel":
            specific = arrayEditor("reviews", component.reviews, [
                "nameKey",
                "quoteKey",
            ]);
            break;
        default:
            specific = _jsx("p", { className: "text-sm text-gray-500", children: "No editable props" });
    }
    /* ─────────── generic property editors ─────────── */
    return (_jsxs("div", { className: "space-y-2", children: [_jsx(Input, { label: "Width", value: component.width ?? "", onChange: (e) => handleInput("width", e.target.value) }), _jsx(Input, { label: "Height", value: component.height ?? "", onChange: (e) => handleInput("height", e.target.value) }), _jsx(Input, { label: "Margin", value: component.margin ?? "", onChange: (e) => handleInput("margin", e.target.value) }), _jsx(Input, { label: "Padding", value: component.padding ?? "", onChange: (e) => handleInput("padding", e.target.value) }), _jsxs(Select, { value: component.position ?? "", onValueChange: (v) => handleInput("position", v || undefined), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Position" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "relative", children: "relative" }), _jsx(SelectItem, { value: "absolute", children: "absolute" })] })] }), component.position === "absolute" && (_jsxs(_Fragment, { children: [_jsx(Input, { label: "Top", value: component.top ?? "", onChange: (e) => handleInput("top", e.target.value) }), _jsx(Input, { label: "Left", value: component.left ?? "", onChange: (e) => handleInput("left", e.target.value) })] })), specific] }));
}
