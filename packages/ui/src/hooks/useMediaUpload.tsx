/* --------------------------------------------------------------------------
 * packages/ui/hooks/useImageUpload.tsx
 *
 * Hook for uploading images to the CMS media library with optional
 * orientation validation, drag-and-drop support, progress feedback
 * and a ready-made “uploader” UI element.
 * -------------------------------------------------------------------------- */

import type { ChangeEvent, DragEvent, ReactElement, RefObject } from "react";
import { useCallback, useRef, useState } from "react";

import type { ImageOrientation, MediaItem } from "@types";
import { useImageOrientationValidation } from "./useImageOrientationValidation";

/* ──────────────────────────────────────────────────────────────────────
 * Public API types
 * ──────────────────────────────────────────────────────────────────── */

export interface UseMediaUploadOptions {
  /** Shop slug the media belongs to (`/data/shops/<shop>/media`) */
  shop: string;
  /** Expected orientation of the uploaded image (e.g. `"landscape"`) */
  requiredOrientation: ImageOrientation;
  /** Callback fired when the upload succeeds */
  onUploaded?: (item: MediaItem) => void;
}

export interface UploadProgress {
  done: number;
  total: number;
}

export interface UseMediaUploadResult {
  /* ─── state ───────────────────────────── */
  pendingFile: File | null;
  altText: string;
  setAltText: (text: string) => void;

  /* ─── validation ──────────────────────── */
  actual: ImageOrientation | null;
  isValid: boolean | null;

  /* ─── upload ──────────────────────────── */
  progress: UploadProgress | null;
  error: string | undefined;
  handleUpload: () => Promise<void>;

  /* ─── helpers ─────────────────────────── */
  inputRef: RefObject<HTMLInputElement | null>;
  openFileDialog: () => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;

  /* ─── UI element ──────────────────────── */
  uploader: ReactElement;
}

/* ──────────────────────────────────────────────────────────────────────
 * Hook implementation
 * ──────────────────────────────────────────────────────────────────── */

export function useImageUpload(
  options: UseMediaUploadOptions
): UseMediaUploadResult {
  const { shop, requiredOrientation, onUploaded } = options;

  /* ---------- state ------------------------------------------------ */
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  /* ---------- orientation check ----------------------------------- */
  const { actual, isValid } = useImageOrientationValidation(
    pendingFile,
    requiredOrientation
  );

  /* ---------- upload handler -------------------------------------- */
  const handleUpload = useCallback(async () => {
    if (!pendingFile) return;

    setProgress({ done: 0, total: 1 });

    const fd = new FormData();
    fd.append("file", pendingFile);
    if (altText) fd.append("altText", altText);

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

    setProgress(null);
    setPendingFile(null);
    setAltText("");
  }, [pendingFile, altText, shop, requiredOrientation, onUploaded]);

  /* ---------- drag-and-drop & picker ------------------------------ */
  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] ?? null;
    setPendingFile(file);
    setAltText("");
  }, []);

  const onFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPendingFile(file);
    setAltText("");
  }, []);

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  /* ---------- ready-made uploader UI ------------------------------ */
  const uploader = (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="rounded border-2 border-dashed p-4 text-center"
    >
      {/* hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      <p className="mb-2">Drag &amp; drop or</p>
      <button
        type="button"
        onClick={openFileDialog}
        className="bg-primary rounded px-3 py-1 text-white"
      >
        Browse…
      </button>

      {pendingFile && (
        <p className="mt-2 text-sm text-gray-500">{pendingFile.name}</p>
      )}

      {progress && (
        <p className="mt-2 text-sm">
          Uploading… {progress.done}/{progress.total}
        </p>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {isValid === false && (
        <p className="mt-2 text-sm text-orange-600">
          Wrong orientation (needs {requiredOrientation})
        </p>
      )}
    </div>
  );

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
