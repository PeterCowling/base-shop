"use client";
/* --------------------------------------------------------------------------
 * packages/ui/hooks/useFileUpload.tsx
 *
 * Hook for uploading images to the CMS media library with optional
 * orientation validation, drag-and-drop support, progress feedback
 * and a ready-made “uploader” UI element.
 * -------------------------------------------------------------------------- */

import type { ChangeEvent, DragEvent, ReactElement, RefObject } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

import type { ImageOrientation, MediaItem } from "@acme/types";
import { useImageOrientationValidation } from "./useImageOrientationValidation";
import { validateFilePolicy, firstFileFromChange } from "./upload/filePolicy";
import { ingestExternalUrl, ingestFromText } from "./upload/ingestExternalUrl";
import { uploadToCms } from "./upload/uploadToCms";
import UploaderSurface from "../components/upload/UploaderSurface";

// Stable default list to avoid re-creation on each render
const DEFAULT_PREFIXES = ["image/", "video/"] as const;

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
  const uploadingRef = useRef(false);
  const [isUploading, setIsUploading] = useState(false);

  // Policy and limits
  const allowExternalUrl = options.allowExternalUrl ?? (() => true);
  const allowedMimePrefixes = useMemo(
    () => (options.allowedMimePrefixes ?? (DEFAULT_PREFIXES as unknown as string[])),
    [options.allowedMimePrefixes]
  );
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
    const { item, error } = await uploadToCms({
      shop,
      requiredOrientation,
      file: pendingFile,
      altText,
      tagsCsv: tags,
    });
    if (item) {
      onUploaded?.(item as MediaItem);
      setError(undefined);
    } else if (error) {
      setError(error);
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
    const policyError = validateFilePolicy(file, allowedMimePrefixes, maxBytes);
    if (policyError) {
      setError(policyError);
      return;
    }
    setPendingFile(file);
    setAltText("");
    setTags("");
  }, [allowedMimePrefixes, maxBytes]);

  const onFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = firstFileFromChange(e);
    if (!file) return;
    const policyError = validateFilePolicy(file, allowedMimePrefixes, maxBytes);
    if (policyError) {
      setError(policyError);
      return;
    }
    setPendingFile(file);
    setAltText("");
    setTags("");
  }, [allowedMimePrefixes, maxBytes]);

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  /* ---------- ready-made uploader UI ------------------------------ */
  const uploader = (
    <UploaderSurface
      inputRef={inputRef}
      pendingFile={pendingFile}
      progress={progress}
      error={error}
      isValid={isValid}
      isVideo={isVideo}
      requiredOrientation={requiredOrientation}
      onDrop={onDrop}
      onFileChange={onFileChange}
      openFileDialog={openFileDialog}
    />
  );

  /* ---------- external URL/text ingestion ------------------------- */
  const ingestUrl = async (url: string): Promise<boolean> => {
    // We can’t reliably stream progress here; set a placeholder progress
    setProgress({ done: 0, total: 1 });
    const { file, error } = await ingestExternalUrl(url, {
      allowedMimePrefixes,
      maxBytes,
      allowExternalUrl,
    });
    if (file) {
      setPendingFile(file);
      setAltText("");
      setTags("");
      setProgress(null);
      return true;
    }
    if (error) setError(error);
    setProgress(null);
    return false;
  };

  const processDataTransfer = async (e: DragEvent<HTMLDivElement>): Promise<"file" | "url" | "text" | "none"> => {
    try {
      const dt = e.dataTransfer;
      if (!dt) return "none";
      const file = dt.files?.[0] ?? null;
      if (file) {
        const policyError = validateFilePolicy(file, allowedMimePrefixes, maxBytes);
        if (policyError) { setError(policyError); return "none"; }
        setPendingFile(file);
        setAltText("");
        setTags("");
        return "file";
      }
      // URLs or text fallback
      const url = dt.getData("text/uri-list");
      if (!url) {
        const text = dt.getData("text/plain");
        const { file: ingestedFile, error, handled } = await ingestFromText(text, {
          allowedMimePrefixes,
          maxBytes,
          allowExternalUrl,
        });
        if (handled === "text") return "text";
        if (ingestedFile) {
          setPendingFile(ingestedFile);
          setAltText("");
          setTags("");
          return "url";
        }
        if (error) setError(error);
        return "none";
      }
      if (url) {
        const ok = await ingestUrl(url);
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
