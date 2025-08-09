import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useRef, useState } from "react";
import { useImageOrientationValidation } from "./useImageOrientationValidation";
/* ──────────────────────────────────────────────────────────────────────
 * Hook implementation
 * ──────────────────────────────────────────────────────────────────── */
export function useImageUpload(options) {
    const { shop, requiredOrientation, onUploaded } = options;
    /* ---------- state ------------------------------------------------ */
    const [pendingFile, setPendingFile] = useState(null);
    const [altText, setAltText] = useState("");
    const [progress, setProgress] = useState(null);
    const [error, setError] = useState();
    const inputRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);
    /* ---------- orientation check ----------------------------------- */
    const { actual, isValid } = useImageOrientationValidation(pendingFile, requiredOrientation);
    /* ---------- upload handler -------------------------------------- */
    const handleUpload = useCallback(async () => {
        if (!pendingFile)
            return;
        setProgress({ done: 0, total: 1 });
        const fd = new FormData();
        fd.append("file", pendingFile);
        if (altText)
            fd.append("altText", altText);
        try {
            const res = await fetch(`/cms/api/media?shop=${shop}&orientation=${requiredOrientation}`, { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || res.statusText);
            onUploaded?.(data);
            setError(undefined);
        }
        catch (err) {
            if (err instanceof Error)
                setError(err.message);
        }
        setProgress(null);
        setPendingFile(null);
        setAltText("");
    }, [pendingFile, altText, shop, requiredOrientation, onUploaded]);
    /* ---------- drag-and-drop & picker ------------------------------ */
    const onDrop = useCallback((e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0] ?? null;
        setPendingFile(file);
        setAltText("");
        setDragActive(false);
    }, []);
    const onFileChange = useCallback((e) => {
        const file = e.target.files?.[0] ?? null;
        setPendingFile(file);
        setAltText("");
    }, []);
    const openFileDialog = useCallback(() => {
        inputRef.current?.click();
    }, []);
    /* ---------- ready-made uploader UI ------------------------------ */
    const uploader = (_jsxs("div", { tabIndex: 0, role: "button", "aria-label": "Drop image here or press Enter to browse", onDragOver: (e) => e.preventDefault(), onDragEnter: () => setDragActive(true), onDragLeave: () => setDragActive(false), onDrop: onDrop, onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openFileDialog();
            }
        }, className: `rounded border-2 border-dashed p-4 text-center${dragActive ? " highlighted" : ""}`, children: [_jsx("input", { ref: inputRef, type: "file", accept: "image/*", className: "hidden", onChange: onFileChange }), _jsx("p", { className: "mb-2", children: "Drag & drop or" }), _jsx("button", { type: "button", onClick: openFileDialog, className: "bg-primary rounded px-3 py-1 text-white", children: "Browse\u2026" }), pendingFile && (_jsx("p", { className: "mt-2 text-sm text-gray-500", children: pendingFile.name })), progress && (_jsxs("p", { className: "mt-2 text-sm", children: ["Uploading\u2026 ", progress.done, "/", progress.total] })), error && _jsx("p", { className: "mt-2 text-sm text-red-600", children: error }), isValid === false && (_jsxs("p", { className: "mt-2 text-sm text-orange-600", children: ["Wrong orientation (needs ", requiredOrientation, ")"] }))] }));
    /* ---------- public result --------------------------------------- */
    return {
        pendingFile,
        altText,
        setAltText,
        actual,
        isValid,
        progress,
        error,
        handleUpload,
        inputRef,
        openFileDialog,
        onDrop,
        onFileChange,
        uploader,
    };
}
/* ------------------------------------------------------------------
 *  Compatibility exports
 * ------------------------------------------------------------------ */
// 1. allow `import { useMediaUpload } from "@ui/hooks/useMediaUpload"`
export { useImageUpload as useMediaUpload };
// 2. allow `import useMediaUpload from "@ui/hooks/useMediaUpload"`
export default useImageUpload;
