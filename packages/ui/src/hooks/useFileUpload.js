import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useRef, useState } from "react";
import { useImageOrientationValidation } from "./useImageOrientationValidation";
/* ──────────────────────────────────────────────────────────────────────
 * Hook implementation
 * ──────────────────────────────────────────────────────────────────── */
export function useFileUpload(options) {
    const { shop, requiredOrientation, onUploaded } = options;
    /* ---------- state ------------------------------------------------ */
    const [pendingFile, setPendingFile] = useState(null);
    const [altText, setAltText] = useState("");
    const [tags, setTags] = useState("");
    const [progress, setProgress] = useState(null);
    const [error, setError] = useState();
    const inputRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);
    const feedbackId = "uploader-feedback";
    /* ---------- orientation check ----------------------------------- */
    const isVideo = pendingFile?.type.startsWith("video/") ?? false;
    const { actual, isValid: orientationValid } = useImageOrientationValidation(isVideo ? null : pendingFile, requiredOrientation);
    const isValid = isVideo ? true : orientationValid;
    /* ---------- upload handler -------------------------------------- */
    const handleUpload = useCallback(async () => {
        if (!pendingFile)
            return;
        setProgress({ done: 0, total: 1 });
        const fd = new FormData();
        fd.append("file", pendingFile);
        if (altText)
            fd.append("altText", altText);
        if (tags) {
            const tagList = tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
            if (tagList.length)
                fd.append("tags", JSON.stringify(tagList));
        }
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
        setTags("");
    }, [pendingFile, altText, tags, shop, requiredOrientation, onUploaded]);
    /* ---------- drag-and-drop & picker ------------------------------ */
    const onDrop = useCallback((e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0] ?? null;
        setPendingFile(file);
        setAltText("");
        setTags("");
        setDragActive(false);
    }, []);
    const onFileChange = useCallback((e) => {
        const file = e.target.files?.[0] ?? null;
        setPendingFile(file);
        setAltText("");
        setTags("");
    }, []);
    const openFileDialog = useCallback(() => {
        inputRef.current?.click();
    }, []);
    /* ---------- ready-made uploader UI ------------------------------ */
    const uploader = (_jsxs("div", { tabIndex: 0, role: "button", "aria-label": "Drop image or video here or press Enter to browse", "aria-describedby": feedbackId, onDragOver: (e) => e.preventDefault(), onDragEnter: () => setDragActive(true), onDragLeave: () => setDragActive(false), onDrop: onDrop, onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openFileDialog();
            }
        }, className: `rounded border-2 border-dashed p-4 text-center${dragActive ? "highlighted" : ""}`, children: [_jsx("input", { ref: inputRef, type: "file", accept: "image/*,video/*", className: "hidden", onChange: onFileChange }), _jsx("p", { className: "mb-2", children: "Drag & drop or" }), _jsx("button", { type: "button", onClick: openFileDialog, className: "bg-primary text-primary-fg rounded px-3 py-1", children: "Browse\u2026" }), _jsxs("div", { id: feedbackId, role: "status", "aria-live": "polite", children: [pendingFile && (_jsx("p", { className: "text-muted-foreground mt-2 text-sm", children: pendingFile.name })), progress && (_jsxs("p", { className: "mt-2 text-sm", children: ["Uploading\u2026 ", progress.done, "/", progress.total] })), error && (_jsx("p", { className: "text-danger mt-2 text-sm", "data-token": "--color-danger", children: error })), isValid === false && !isVideo && (_jsxs("p", { className: "text-warning mt-2 text-sm", children: ["Wrong orientation (needs ", requiredOrientation, ")"] }))] })] }));
    /* ---------- public result --------------------------------------- */
    return {
        pendingFile,
        altText,
        setAltText,
        tags,
        setTags,
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
// 1. allow `import { useMediaUpload } from "./useMediaUpload"`
export { useFileUpload as useMediaUpload };
// 2. allow `import useMediaUpload from "./useMediaUpload"`
export default useFileUpload;
