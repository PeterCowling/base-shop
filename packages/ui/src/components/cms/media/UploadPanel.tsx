// packages/ui/src/components/cms/media/UploadPanel.tsx
"use client";

import Image from "next/image";
import { Button, Input } from "../../atoms/shadcn";
import type { ImageOrientation, MediaItem } from "@acme/types";
import { useMediaUpload } from "@ui/hooks/useMediaUpload";
import { ChangeEvent, ReactElement, useEffect, useState } from "react";
import { Spinner } from "../../atoms";
import { cn } from "../../../utils/style";

interface UploadPanelProps {
  shop: string;
  onUploaded: (item: MediaItem) => void;
  focusTargetId?: string;
  onUploadError?: (message: string) => void;
}

export default function UploadPanel({
  shop,
  onUploaded,
  focusTargetId,
  onUploadError,
}: UploadPanelProps): ReactElement {
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
  const isUploading = Boolean(progress);

  useEffect(() => {
    if (error === undefined) return;
    onUploadError?.(error);
  }, [error, onUploadError]);

  return (
    <div className="space-y-2">
      <div
        id={focusTargetId}
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
        className={cn(
          "flex h-32 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-muted text-sm text-muted",
          dragActive && "ring-2 ring-primary/60 bg-primary/5"
        )}
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
              <Image
                src={thumbnail}
                alt="preview"
                width={80}
                height={80}
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
                <Button
                  onClick={handleUpload}
                  type="button"
                  className="h-auto px-2 py-1 text-sm"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="h-4 w-4" />
                      <span className="sr-only" aria-live="polite" aria-atomic="true">
                        Uploading…
                      </span>
                    </span>
                  ) : (
                    "Upload"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
