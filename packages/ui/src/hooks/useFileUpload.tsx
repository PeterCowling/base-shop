"use client";
/* --------------------------------------------------------------------------
 * packages/ui/hooks/useFileUpload.tsx
 *
 * Hook for uploading images to the CMS media library with optional
 * orientation validation, drag-and-drop support, progress feedback
 * and a ready-made “uploader” UI element.
 * -------------------------------------------------------------------------- */

import type { ChangeEvent, DragEvent, ReactElement, RefObject } from "react";
import { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { Button } from "../components/atoms/shadcn";
import type { ImageOrientation, MediaItem } from "@acme/types";
import { useImageOrientationValidation } from "./useImageOrientationValidation";
import { cn } from "../utils/style";

/* ──────────────────────────────────────────────────────────────────────
 * Public API types
 * ──────────────────────────────────────────────────────────────────── */

export interface UseFileUploadOptions {
  /** Shop slug the media belongs to (`/data/shops/<shop>/media`) */
  shop: string;
  /** Expected orientation of the uploaded image (e.g. `"landscape"`) */
  requiredOrientation: ImageOrientation;
  /** Callback fired when the upload succeeds */
  onUploaded?: (item: MediaItem) => void;
  /** Optional content policy: decide if an external URL may be ingested */
  allowExternalUrl?: (url: string) => boolean;
  /** Allowed MIME type prefixes when ingesting external URLs or files */
  allowedMimePrefixes?: string[];
  /** Max file size in bytes for external ingestion or local files */
  maxBytes?: number;
}

export interface UploadProgress {
  done: number;
  total: number;
}

export interface UseFileUploadResult {
  /* ─── state ───────────────────────────── */
  pendingFile: File | null;
  altText: string;
  setAltText: (text: string) => void;
  /** Comma separated list of tags */
  tags: string;
  setTags: (tags: string) => void;

  /* ─── validation ──────────────────────── */
  actual: ImageOrientation | null;
  isValid: boolean | null;

  /* ─── upload ──────────────────────────── */
  progress: UploadProgress | null;
  error: string | undefined;
  handleUpload: () => Promise<void>;
  /** True while an upload is in-flight (prevents double submits) */
  isUploading: boolean;

  /* ─── helpers ─────────────────────────── */
  inputRef: RefObject<HTMLInputElement | null>;
  openFileDialog: () => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  /**
   * Analyze a DataTransfer for files/URL/text and prepare an upload (sets pendingFile when possible).
   * Returns what was handled: 'file' | 'url' | 'text' | 'none'. Does not start upload automatically.
   */
  processDataTransfer: (e: DragEvent<HTMLDivElement>) => Promise<"file" | "url" | "text" | "none">;

  /* ─── UI element ──────────────────────── */
  uploader: ReactElement;
}

/* ──────────────────────────────────────────────────────────────────────
 * Hook implementation
 * ──────────────────────────────────────────────────────────────────── */

export function useFileUpload(
  options: UseFileUploadOptions
): UseFileUploadResult {
  const { shop, requiredOrientation, onUploaded } = options;

  /* ---------- state ------------------------------------------------ */
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [tags, setTags] = useState("");
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const feedbackId = "uploader-feedback";
  const uploadingRef = useRef(false);
  const [isUploading, setIsUploading] = useState(false);

  // Policy and limits
  const allowExternalUrl = options.allowExternalUrl ?? (() => true);
  const allowedMimePrefixes = options.allowedMimePrefixes ?? ["image/", "video/"];
  const maxBytes = Number.isFinite(options.maxBytes as number) ? (options.maxBytes as number) : 25 * 1024 * 1024; // 25MB

  /* ---------- orientation check ----------------------------------- */
  const isVideo = pendingFile?.type?.startsWith("video/") ?? false;

  const { actual: rawActual, isValid: rawValid } = useImageOrientationValidation(
    isVideo ? null : pendingFile,
    requiredOrientation,
  );

  const actual = isVideo ? null : rawActual;
  const isValid = isVideo ? true : rawValid;

  /* ---------- upload handler -------------------------------------- */
  const handleUpload = useCallback(async () => {
    if (uploadingRef.current) return; // prevent double-submit
    if (!pendingFile) return;
    if (isValid === false) {
      setError(
        actual
          ? `Image orientation mismatch: expected ${requiredOrientation}, got ${actual}`
          : `Image orientation mismatch: expected ${requiredOrientation}`,
      );
      return;
    }

    uploadingRef.current = true;
    setIsUploading(true);
    flushSync(() => setProgress({ done: 0, total: 1 }));

    const fd = new FormData();
    fd.append("file", pendingFile);
    if (altText) fd.append("altText", altText);
    if (tags) {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (tagList.length) fd.append("tags", JSON.stringify(tagList));
    }

    try {
      const res = await fetch(
        `/cms/api/media?shop=${shop}&orientation=${requiredOrientation}`,
        { method: "POST", body: fd }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);

      onUploaded?.(data as MediaItem);
      setError(undefined);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    }

    flushSync(() => setProgress(null));
    setPendingFile(null);
    setAltText("");
    setTags("");
    uploadingRef.current = false;
    setIsUploading(false);
  }, [
    pendingFile,
    altText,
    tags,
    shop,
    requiredOrientation,
    onUploaded,
    actual,
    isValid,
  ]);

  /* ---------- drag-and-drop & picker ------------------------------ */
  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] ?? null;
    if (!file) return;
    // Basic local file type/size policy
    if (maxBytes && file.size > maxBytes) {
      setError(`File too large (>${Math.round(maxBytes / (1024 * 1024))}MB)`);
      return;
    }
    if (allowedMimePrefixes.length && file.type) {
      const ok = allowedMimePrefixes.some((p) => file.type.startsWith(p));
      if (!ok) {
        setError(`Unsupported file type: ${file.type}`);
        return;
      }
    }
    setPendingFile(file);
    setAltText("");
    setTags("");
    setDragActive(false);
  }, []);

  const onFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (maxBytes && file.size > maxBytes) {
      setError(`File too large (>${Math.round(maxBytes / (1024 * 1024))}MB)`);
      return;
    }
    if (allowedMimePrefixes.length && file.type) {
      const ok = allowedMimePrefixes.some((p) => file.type.startsWith(p));
      if (!ok) {
        setError(`Unsupported file type: ${file.type}`);
        return;
      }
    }
    setPendingFile(file);
    setAltText("");
    setTags("");
  }, []);

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  /* ---------- ready-made uploader UI ------------------------------ */
  const uploader = (
    <div
      tabIndex={0}
      role="button"
      aria-label="Drop image or video here or press Enter to browse"
      aria-describedby={feedbackId}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => setDragActive(true)}
      onDragLeave={() => setDragActive(false)}
      onDrop={onDrop}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openFileDialog();
        }
      }}
      className={cn(
        "rounded border-2 border-dashed p-4 text-center",
        dragActive && "ring-2 ring-primary/60 bg-primary/5"
      )}
    >
      {/* hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={onFileChange}
      />

      <p className="mb-2">Drag &amp; drop or</p>
      <Button
        type="button"
        onClick={openFileDialog}
        className="h-auto px-3 py-1 text-sm"
      >
        Browse…
      </Button>

      <div id={feedbackId} role="status" aria-live="polite">
        {pendingFile && (
          <p className="text-muted-foreground mt-2 text-sm">
            {pendingFile.name}
          </p>
        )}

        {progress && (
          <p className="mt-2 text-sm">
            Uploading… {progress.done}/{progress.total}
          </p>
        )}

        {error && (
          <p className="text-danger mt-2 text-sm" data-token="--color-danger">
            {error}
          </p>
        )}
        {isValid === false && !isVideo && (
          <p className="text-warning mt-2 text-sm">
            Wrong orientation (needs {requiredOrientation})
          </p>
        )}
      </div>
    </div>
  );

  /* ---------- external URL/text ingestion ------------------------- */
  const isSafeHttpUrl = (raw: string): boolean => {
    try {
      const u = new URL(raw);
      const scheme = `${u.protocol}`.toLowerCase();
      if (scheme === "javascript:" || scheme === "data:") return false;
      return scheme === "http:" || scheme === "https:";
    } catch {
      return false;
    }
  };

  const extractUrlFromText = (text: string): string | null => {
    try {
      const trimmed = text.trim();
      if (isSafeHttpUrl(trimmed)) return trimmed;
      // naive URL detection inside text
      const m = trimmed.match(/https?:\/\/[^\s]+/i);
      return m && isSafeHttpUrl(m[0]) ? m[0] : null;
    } catch {
      return null;
    }
  };

  const ingestExternalUrl = async (url: string): Promise<boolean> => {
    if (!isSafeHttpUrl(url)) { setError("Blocked URL scheme"); return false; }
    if (!allowExternalUrl(url)) { setError("External URL not allowed by policy"); return false; }
    try {
      // Note: we can’t reliably stream progress here; set a placeholder progress
      setProgress({ done: 0, total: 1 });
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error(`Failed to fetch resource (${res.status})`);
      const ct = res.headers.get("content-type") || "";
      if (allowedMimePrefixes.length && ct) {
        const ok = allowedMimePrefixes.some((p) => ct.startsWith(p));
        if (!ok) throw new Error(`Unsupported content-type: ${ct}`);
      }
      const blob = await res.blob();
      if (maxBytes && blob.size > maxBytes) {
        throw new Error(`File too large (>${Math.round(maxBytes / (1024 * 1024))}MB)`);
      }
      const name = (() => {
        try {
          const u = new URL(url);
          const base = u.pathname.split("/").filter(Boolean).pop() || "asset";
          return base;
        } catch { return "asset"; }
      })();
      const file = new File([blob], name, { type: blob.type || ct || "application/octet-stream" });
      setPendingFile(file);
      setAltText("");
      setTags("");
      setProgress(null);
      return true;
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      setProgress(null);
      return false;
    }
  };

  const processDataTransfer = async (e: DragEvent<HTMLDivElement>): Promise<"file" | "url" | "text" | "none"> => {
    try {
      const dt = e.dataTransfer;
      if (!dt) return "none";
      // 1) Files take precedence
      const file = dt.files?.[0] ?? null;
      if (file) {
        if (maxBytes && file.size > maxBytes) { setError(`File too large (>${Math.round(maxBytes / (1024 * 1024))}MB)`); return "none"; }
        if (allowedMimePrefixes.length && file.type) {
          const ok = allowedMimePrefixes.some((p) => file.type.startsWith(p));
          if (!ok) { setError(`Unsupported file type: ${file.type}`); return "none"; }
        }
        setPendingFile(file);
        setAltText("");
        setTags("");
        return "file";
      }
      // 2) URL (text/uri-list) or fallback to text/plain
      let url = dt.getData("text/uri-list");
      if (!url) {
        const text = dt.getData("text/plain");
        url = extractUrlFromText(text) || "";
        if (!url && text) return "text";
      }
      if (url) {
        const ok = await ingestExternalUrl(url);
        return ok ? "url" : "none";
      }
      return "none";
    } catch {
      return "none";
    }
  };

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
    isUploading,
    inputRef,
    openFileDialog,
    onDrop,
    onFileChange,
    processDataTransfer,
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

// legacy type aliases
export type {
  UseFileUploadOptions as UseMediaUploadOptions,
  UseFileUploadResult as UseMediaUploadResult,
};
