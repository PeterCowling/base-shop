// packages/ui/src/components/cms/MediaManager.tsx
"use client";

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/atoms/shadcn";
import type { ImageOrientation, MediaItem } from "@acme/types";
import { useMediaUpload } from "@ui/hooks/useMediaUpload";
import { memo, ReactElement, useCallback, useState } from "react";
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
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [dragActive, setDragActive] = useState(false);
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

  /* ---------------------------------------------------------------------- */
  /*  Upload workflow (via custom hook)                                     */
  /* ---------------------------------------------------------------------- */
  const REQUIRED_ORIENTATION: ImageOrientation = "landscape";
  const {
    pendingFile,
    thumbnail,
    altText,
    setAltText,
    tags: uploadTags,
    setTags: setUploadTags,
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

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */
  const allTags = Array.from(new Set(files.flatMap((f) => f.tags ?? [])));
  const filteredFiles = files.filter((f) => {
    const name = f.url.split("/").pop()?.toLowerCase() ?? "";
    const q = query.toLowerCase();
    const matchesQuery = !q || name.includes(q);
    const matchesTag = !tag || (f.tags ?? []).includes(tag);
    return matchesQuery && matchesTag;
  });

  const handleReplace = useCallback(
    (oldUrl: string, item: MediaItem) => {
      setFiles((prev) => prev.map((f) => (f.url === oldUrl ? item : f)));
    },
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          type="search"
          placeholder="Search media..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        {allTags.length > 0 && (
          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All tags</SelectItem>
              {allTags.map((t) => (
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
        {error && (
          <p className="text-sm text-danger" data-token="--color-danger">
            {error}
          </p>
        )}
        {progress && (
          <p className="text-sm text-muted" data-token="--color-muted">
            Uploaded {progress.done}/{progress.total}
          </p>
        )}
        {pendingFile && (isVideo || isValid !== null) && (
          <div className="space-y-2">
            {thumbnail && (
              <img
                src={thumbnail}
                alt="preview"
                className="h-20 w-20 rounded object-cover"
              />
            )}
            {!isVideo && (
              <p
                className={
                  isValid ? "text-sm text-success" : "text-sm text-danger"
                }
                data-token={isValid ? "--color-success" : "--color-danger"}
              >
                {isValid
                  ? `Image orientation is ${actual}; requirement satisfied.`
                  : `Selected image is ${actual}; please upload a ${REQUIRED_ORIENTATION} image.`}
              </p>
            )}
            {(isVideo || isValid) && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder={isVideo ? "Title" : "Alt text"}
                  className="flex-1"
                />
                <Input
                  type="text"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="Tags (comma separated)"
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
        <MediaFileList
          files={filteredFiles}
          shop={shop}
          onDelete={handleDelete}
          onReplace={handleReplace}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Export                                                                    */
/* -------------------------------------------------------------------------- */

export default memo(MediaManagerBase);
