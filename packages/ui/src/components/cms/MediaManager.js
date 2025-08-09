// packages/ui/components/cms/MediaManager.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "@/components/atoms/shadcn";
import { deleteMedia } from "@cms/actions/media.server";
import { useMediaUpload } from "@ui/hooks/useMediaUpload";
import { useCallback, useState } from "react";
import MediaFileList from "./MediaFileList";
export default function MediaManager({ shop, initialFiles }) {
    const [files, setFiles] = useState(initialFiles);
    const [dragActive, setDragActive] = useState(false);
    const handleDelete = useCallback(async (src) => {
         
        if (!confirm("Delete this image?"))
            return;
        await deleteMedia(shop, src);
        setFiles((prev) => prev.filter((f) => f.url !== src));
    }, [shop]);
    const REQUIRED_ORIENTATION = "landscape";
    const { pendingFile, altText, setAltText, actual, isValid, progress, error, inputRef, openFileDialog, onDrop, onFileChange, handleUpload, } = useMediaUpload({
        shop,
        requiredOrientation: REQUIRED_ORIENTATION,
        onUploaded: (item) => setFiles((prev) => [item, ...prev]),
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { tabIndex: 0, role: "button", "aria-label": "Drop image here or press Enter to browse", onDrop: (e) => {
                onDrop(e);
                setDragActive(false);
            }, onDragOver: (e) => e.preventDefault(), onDragEnter: () => setDragActive(true), onDragLeave: () => setDragActive(false), onClick: openFileDialog, onKeyDown: (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openFileDialog();
                }
            }, className: `flex h-32 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 text-sm text-gray-500${dragActive ? " highlighted" : ""}`, children: [_jsx(Input, { ref: inputRef, type: "file", accept: "image/*", multiple: true, className: "hidden", onChange: onFileChange }), "Drop image here or click to upload"] }), error && _jsx("p", { className: "text-sm text-red-600", children: error }), progress && (_jsxs("p", { className: "text-sm text-gray-600", children: ["Uploaded ", progress.done, "/", progress.total] })), pendingFile && isValid !== null && (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: isValid ? "text-sm text-green-600" : "text-sm text-red-600", children: isValid
                            ? `Image orientation is ${actual}; requirement satisfied.`
                            : `Selected image is ${actual}; please upload a ${REQUIRED_ORIENTATION} image.` }), isValid && (_jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { type: "text", value: altText, onChange: (e) => setAltText(e.target.value), placeholder: "Alt text", className: "flex-1" }), _jsx("button", { onClick: handleUpload, className: "rounded bg-blue-600 px-2 text-sm text-white", children: "Upload" })] }))] })), files.length > 0 && (_jsx(MediaFileList, { files: files, onDelete: handleDelete }))] }));
}
