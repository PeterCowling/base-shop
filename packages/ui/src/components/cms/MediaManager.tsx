// packages/ui/src/components/cms/MediaManager.tsx
"use client";

import { Input } from "@ui/components/atoms/shadcn";
import type { ImageOrientation, MediaItem } from "@acme/types";
import { useMediaUpload } from "@ui/hooks/useMediaUpload";
import { memo, ReactElement, useCallback, useMemo, useState } from "react";
import MediaFileList from "./MediaFileList";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface Props {
  shop: string;
  initialFiles: MediaItem[];

  /**
   * Removes a media item on the server.
   * Implemented in – and supplied by – the host application (e.g. `apps/cms`).
   */
  onDelete: (shop: string, src: string) => void | Promise<void>;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

function MediaManagerBase({
  shop,
  initialFiles,
  onDelete,
}: Props): ReactElement {
  const [files, setFiles] = useState<MediaItem[]>(initialFiles);
  const [dragActive, setDragActive] = useState(false);
  const [query, setQuery] = useState("");
  const feedbackId = "media-manager-feedback";

  /* ---------------------------------------------------------------------- */
  /*  Delete handler (stable)                                               */
  /* ---------------------------------------------------------------------- */
  const handleDelete = useCallback(
    async (src: string) => {
      /* eslint-disable no-alert -- simple confirmation is fine */
      if (!confirm("Delete this image?")) return;
      await onDelete(shop, src);
      setFiles((prev) => prev.filter((f) => f.url !== src));
    },
    [onDelete, shop]
  );

  const handleAltTextSave = useCallback(
    async (src: string, altText: string) => {
      const fd = new FormData();
      if (altText) fd.append("altText", altText);
      await fetch(
        `/cms/api/media?shop=${shop}&file=${encodeURIComponent(src)}`,
        { method: "POST", body: fd }
      );
      setFiles((prev) =>
        prev.map((f) => (f.url === src ? { ...f, altText } : f))
      );
    },
    [shop]
  );

  /* ---------------------------------------------------------------------- */
  /*  Upload workflow (via custom hook)                                     */
  /* ---------------------------------------------------------------------- */
  const REQUIRED_ORIENTATION: ImageOrientation = "landscape";
  const {
    pendingFile,
    altText,
    setAltText,
    actual,
    isValid,
    progress,
    error,
    inputRef,
    openFileDialog,
    onDrop,
    onFileChange,
    handleUpload,
  } = useMediaUpload({
    shop,
    requiredOrientation: REQUIRED_ORIENTATION,
    onUploaded: (item) => setFiles((prev) => [item, ...prev]),
  });
  const isVideo = pendingFile?.type.startsWith("video/") ?? false;

  const filteredFiles = useMemo(() => {
    if (!query) return files;
    const q = query.toLowerCase();
    return files.filter((f) => {
      const filename = f.url.split("/").pop()?.toLowerCase() ?? "";
      const tags = `${f.altText ?? ""} ${f.title ?? ""}`.toLowerCase();
      return filename.includes(q) || tags.includes(q);
    });
  }, [files, query]);

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Upload drop-zone / picker */}
      <div
        tabIndex={0}
        role="button"
        aria-label="Drop image or video here or press Enter to browse"
        aria-describedby={feedbackId}
        onDrop={(e) => {
          onDrop(e);
          setDragActive(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onClick={openFileDialog}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFileDialog();
          }
        }}
        className={`flex h-32 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-muted text-sm text-muted${
          dragActive ? " highlighted" : ""
        }`}
      >
        <Input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={onFileChange}
        />
        Drop image or video here or click to upload
      </div>

      {/* Validation / progress feedback */}
      <div id={feedbackId} role="status" aria-live="polite" className="space-y-2">
        {error && <p className="text-sm text-danger">{error}</p>}
        {progress && (
          <p className="text-sm text-muted">
            Uploaded {progress.done}/{progress.total}
          </p>
        )}
        {pendingFile && (isVideo || isValid !== null) && (
          <div className="space-y-2">
            {!isVideo && (
              <p
                className={
                  isValid ? "text-sm text-success" : "text-sm text-danger"
                }
              >
                {isValid
                  ? `Image orientation is ${actual}; requirement satisfied.`
                  : `Selected image is ${actual}; please upload a ${REQUIRED_ORIENTATION} image.`}
              </p>
            )}
            {(isVideo || isValid) && (
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder={isVideo ? "Title" : "Alt text"}
                  className="flex-1"
                />
                <button
                  onClick={handleUpload}
                  className="rounded bg-primary px-2 text-sm text-primary-fg"
                >
                  Upload
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search / filter */}
      {files.length > 0 && (
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by filename or tag"
        />
      )}

      {/* File list */}
      {filteredFiles.length > 0 && (
        <MediaFileList
          files={filteredFiles}
          onDelete={handleDelete}
          onAltTextSave={handleAltTextSave}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Export                                                                    */
/* -------------------------------------------------------------------------- */

export default memo(MediaManagerBase);
