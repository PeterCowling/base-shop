// packages/ui/src/components/cms/media/UploadPanel.tsx
"use client";

import Image from "next/image";
import { Button, Input } from "../../atoms/shadcn";
import type { ImageOrientation, MediaItem } from "@acme/types";
import { useMediaUpload } from "@ui/hooks/useMediaUpload";
import { ChangeEvent, ReactElement, useEffect, useState } from "react";
import { Spinner } from "../../atoms";
import { cn } from "../../../utils/style";
import { useTranslations } from "@acme/i18n";
import { Cover } from "../../atoms/primitives/Cover";
import { Inline } from "../../atoms/primitives/Inline";

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
  const t = useTranslations();
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
      <Cover
        id={focusTargetId}
        tabIndex={0}
        role="button"
        aria-label={String(
          t("Drop image or video here or press Enter to browse")
        )}
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
          /* i18n-exempt: utility classes only */
          "h-32 cursor-pointer rounded-md border-2 border-dashed border-muted text-sm text-muted",
          /* i18n-exempt: utility classes only */
          dragActive && "ring-2 ring-primary/60 bg-primary/5"
        )}
      >
        {/* Centered content rendered by Cover */}
        <Input
          ref={inputRef}
          type="file"
          accept="image/*,video/*" /* i18n-exempt: MIME filter */
          multiple
          className="hidden" /* i18n-exempt: utility class */
          onChange={onFileChange}
        />
        {t("Drop image or video here or click to upload")}
      </Cover>

      <div id={feedbackId} role="status" aria-live="polite" className="space-y-2">
        {error && (
          <p className="text-sm text-danger" data-token="--color-danger">{/* i18n-exempt: token name */}
            {error}
          </p>
        )}
        {progress && (
          <p className="text-sm text-muted" data-token="--color-muted">{/* i18n-exempt: token name */}
            {t("Uploaded")} {progress.done}/{progress.total}
          </p>
        )}
        {pendingFile && (isVideo || isValid !== null) && (
          <div className="space-y-2">
            {thumbnail && (
              <Image
                src={thumbnail}
                alt={String(t("preview"))}
                width={80}
                height={80}
                className="h-20 w-20 rounded object-cover"
              />
            )}
            {!isVideo && (
              <p
                className={isValid ? "text-sm text-success" : "text-sm text-danger"} /* i18n-exempt: utility classes */
                data-token={isValid ? "--color-success" : "--color-danger"} /* i18n-exempt: token name */
              >
                {isValid
                  ? (
                      <>
                        {t("Image orientation is")} {actual}; {t("requirement satisfied.")}
                      </>
                    )
                  : (
                      <>
                        {t("Selected image is")} {actual}; {t("please upload a")} {REQUIRED_ORIENTATION} {t("image.")}
                      </>
                    )}
              </p>
            )}
            {(isVideo || isValid) && (
              <Inline className="gap-2 sm:flex-nowrap">
                <Input
                  type="text"
                  value={altText}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setAltText(e.target.value)
                  }
                  placeholder={String(isVideo ? t("Title") : t("Alt text"))}
                  className="flex-1"
                />
                <Input
                  type="text"
                  value={uploadTags}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setUploadTags(e.target.value)
                  }
                  placeholder={String(t("Tags (comma separated)"))}
                  className="flex-1"
                />
                <Button
                  onClick={handleUpload}
                  type="button"
                  className="h-auto px-2 py-1 text-sm"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Inline className="items-center gap-2">
                      <Spinner className="h-4 w-4" />
                      <span className="sr-only" aria-live="polite" aria-atomic="true">
                        {t("Uploading…")}
                      </span>
                    </Inline>
                  ) : (
                    t("Upload")
                  )}
                </Button>
              </Inline>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
