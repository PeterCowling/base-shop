// packages/ui/src/components/cms/MediaManager.tsx
"use client";

import { Input } from "@ui/components/atoms/shadcn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../atoms/primitives";
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
  const [tag, setTag] = useState("");
  const feedbackId = "media-manager-feedback";

  const tagOptions = useMemo(
    () => Array.from(new Set(files.flatMap((f) => f.tags ?? []))),
    [files]
  );

  const filteredFiles = useMemo(() => {
    const q = query.toLowerCase();
    return files.filter((f) => {
      const matchesQuery =
        !q ||
        f.url.toLowerCase().includes(q) ||
        f.altText?.toLowerCase().includes(q);
      const matchesTag = !tag || f.tags?.includes(tag);
      return matchesQuery && matchesTag;
    });
  }, [files, query, tag]);

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

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Search & tag filter */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search media"
          aria-label="Search media"
        />
        {tagOptions.length > 0 && (
          <Select value={tag} onValueChange={(v) => setTag(v)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All tags</SelectItem>
              {tagOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Upload drop-zone / picker */}
      <div
        tabIndex={0}
        role="button"
        aria-label="Drop image here or press Enter to browse"
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
          accept="image/*"
          multiple
          className="hidden"
          onChange={onFileChange}
        />
        Drop image here or click to upload
      </div>

      {/* Validation / progress feedback */}
      <div id={feedbackId} role="status" aria-live="polite" className="space-y-2">
        {error && <p className="text-sm text-danger">{error}</p>}
        {progress && (
          <p className="text-sm text-muted">
            Uploaded {progress.done}/{progress.total}
          </p>
        )}
        {pendingFile && isValid !== null && (
          <div className="space-y-2">
            <p
              className={
                isValid ? "text-sm text-success" : "text-sm text-danger"
              }
            >
              {isValid
                ? `Image orientation is ${actual}; requirement satisfied.`
                : `Selected image is ${actual}; please upload a ${REQUIRED_ORIENTATION} image.`}
            </p>
            {isValid && (
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Alt text"
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

      {/* File list */}
      {filteredFiles.length > 0 && (
        <MediaFileList files={filteredFiles} onDelete={handleDelete} />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Export                                                                    */
/* -------------------------------------------------------------------------- */

export default memo(MediaManagerBase);
