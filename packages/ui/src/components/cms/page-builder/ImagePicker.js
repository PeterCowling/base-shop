// packages/ui/src/components/cms/page-builder/ImagePicker.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import useFileUpload from "../../../hooks/useFileUpload";
import Image from "next/image";
import { memo, useEffect, useState } from "react";
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger, Input, } from "../../atoms/shadcn";
import { Loader } from "../../atoms";
import useMediaLibrary from "./useMediaLibrary";
function ImagePicker({ onSelect, children }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [previewUrl, setPreviewUrl] = useState(null);
    const { media, setMedia, loadMedia, shop, loading, error: mediaError } = useMediaLibrary();
    const { pendingFile, altText, setAltText, isValid, actual, inputRef, onFileChange, handleUpload, error: uploadError, progress, } = useFileUpload({
        shop: shop ?? "",
        requiredOrientation: "landscape",
        onUploaded: (item) => {
            setMedia((m) => [item, ...m]);
        },
    });
    useEffect(() => {
        if (pendingFile) {
            const url = URL.createObjectURL(pendingFile);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreviewUrl(null);
    }, [pendingFile]);
    useEffect(() => {
        if (open) {
            setSearch("");
            void loadMedia();
        }
    }, [open, loadMedia]);
    const handleSearch = (e) => {
        const q = e.target.value;
        setSearch(q);
        void loadMedia(q);
    };
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: children }), _jsxs(DialogContent, { className: "max-w-xl space-y-4", children: [_jsx(DialogTitle, { children: "Select image" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { ref: inputRef, type: "file", accept: "image/*", onChange: onFileChange, className: "flex-1" }), pendingFile && isValid && (_jsx(Button, { type: "button", onClick: handleUpload, children: "Upload" }))] }), previewUrl && (_jsxs("div", { className: "relative h-32 w-full overflow-hidden rounded", children: [_jsx("img", { src: previewUrl, alt: "preview", className: "h-full w-full object-cover" }), progress && (_jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white", children: [_jsx(Loader, { className: "mb-2" }), _jsxs("span", { className: "text-xs", children: ["Uploading\u2026 ", progress.done, "/", progress.total] })] }))] })), pendingFile && isValid && (_jsx(Input, { value: altText, onChange: (e) => setAltText(e.target.value), placeholder: "Alt text" })), pendingFile && isValid !== null && (_jsx("p", { className: "text-sm", children: isValid
                            ? `Image orientation is ${actual}`
                            : `Selected image is ${actual}; please upload a landscape image.` })), uploadError && (_jsx("p", { className: "text-sm text-danger", "data-token": "--color-danger", children: uploadError })), _jsx(Input, { value: search, onChange: handleSearch, placeholder: "Search media..." }), _jsxs("div", { className: "grid max-h-64 grid-cols-3 gap-2 overflow-auto", children: [loading && (_jsx("div", { className: "col-span-3 flex items-center justify-center", children: _jsx(Loader, {}) })), !loading && mediaError && (_jsx("p", { className: "text-danger col-span-3 text-sm", "data-token": "--color-danger", children: mediaError })), !loading && !mediaError &&
                                media
                                    .filter((m) => m.type === "image")
                                    .map((m) => (_jsx("button", { type: "button", onClick: () => {
                                        onSelect(m.url);
                                        setOpen(false);
                                    }, className: "relative aspect-square", children: _jsx(Image, { src: m.url, alt: m.altText || "media", fill: true, className: "object-cover" }) }, m.url))), !loading &&
                                !mediaError &&
                                media.filter((m) => m.type === "image").length === 0 && (_jsx("p", { className: "text-muted-foreground col-span-3 text-sm", children: "No media found." }))] })] })] }));
}
export default memo(ImagePicker);
