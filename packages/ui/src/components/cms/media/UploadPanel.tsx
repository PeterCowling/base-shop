// packages/ui/src/components/cms/media/UploadPanel.tsx
"use client";

import { Input } from "../../atoms/shadcn";
import type { ImageOrientation, MediaItem } from "@acme/types";
import { useMediaUpload } from "@ui/hooks/useMediaUpload";
import { ChangeEvent, ReactElement, useState } from "react";

interface UploadPanelProps {
  shop: string;
  onUploaded: (item: MediaItem) => void;
}

export default function UploadPanel({ shop, onUploaded }: UploadPanelProps): ReactElement {
  const [dragActive, setDragActive] = useState(false);
  const feedbackId = "media-upload-feedback";

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
    onUploaded,
  });
  const isVideo = pendingFile?.type?.startsWith("video/") ?? false;

  return (
    <div className="space-y-2">
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
                className={isValid ? "text-sm text-success" : "text-sm text-danger"}
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
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setAltText(e.target.value)
                  }
                  placeholder={isVideo ? "Title" : "Alt text"}
                  className="flex-1"
                />
                <Input
                  type="text"
                  value={uploadTags}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setUploadTags(e.target.value)
                  }
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
    </div>
  );
}

