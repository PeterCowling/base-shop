// packages/ui/components/cms/MediaManager.tsx
"use client";

import { Input } from "@/components/atoms-shadcn";
import { deleteMedia } from "@cms/actions/media.server";
import type { ImageOrientation, MediaItem } from "@types";
import { useMediaUpload } from "@ui/hooks/useMediaUpload";
import { useCallback, useState } from "react";
import MediaFileList from "./MediaFileList";

interface Props {
  shop: string;
  initialFiles: MediaItem[];
}

export default function MediaManager({ shop, initialFiles }: Props) {
  const [files, setFiles] = useState<MediaItem[]>(initialFiles);

  const handleDelete = useCallback(
    async (src: string) => {
      /* eslint-disable no-alert -- simple confirmation is fine */
      if (!confirm("Delete this image?")) return;
      await deleteMedia(shop, src);
      setFiles((prev) => prev.filter((f) => f.url !== src));
    },
    [shop]
  );

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

  return (
    <div className="space-y-6">
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={openFileDialog}
        className="flex h-32 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 text-sm text-gray-500"
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      {progress && (
        <p className="text-sm text-gray-600">
          Uploaded {progress.done}/{progress.total}
        </p>
      )}
      {pendingFile && isValid !== null && (
        <div className="space-y-2">
          <p
            className={
              isValid ? "text-sm text-green-600" : "text-sm text-red-600"
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
                className="rounded bg-blue-600 px-2 text-sm text-white"
              >
                Upload
              </button>
            </div>
          )}
        </div>
      )}
      {files.length > 0 && (
        <MediaFileList files={files} onDelete={handleDelete} />
      )}
    </div>
  );
}
