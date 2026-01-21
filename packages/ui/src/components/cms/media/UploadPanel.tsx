// packages/ui/src/components/cms/media/UploadPanel.tsx
"use client";

import { type ChangeEvent, type ReactElement, useEffect, useState } from "react";
import Image from "next/image";

import { useTranslations } from "@acme/i18n";
import type { ImageOrientation, MediaItem } from "@acme/types";

import { useMediaUpload } from "../../../hooks/useMediaUpload";
import { cn } from "../../../utils/style";
import { Spinner } from "../../atoms";
import { Cover } from "../../atoms/primitives/Cover";
import { Inline } from "../../atoms/primitives/Inline";
import { Button, Input } from "../../atoms/shadcn";

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
          t("upload.dropHelp")
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
          /* i18n-exempt -- DS-000 utility classes only [ttl=2026-01-01] */
          "h-32 cursor-pointer rounded-md border-2 border-dashed border-muted text-sm text-muted",
          /* i18n-exempt -- DS-000 utility classes only [ttl=2026-01-01] */
          dragActive && "ring-2 ring-primary/60 bg-primary/5"
        )}
      >
        {/* Centered content rendered by Cover */}
        <Input
          ref={inputRef}
          type="file"
          accept="image/*,video/*" /* i18n-exempt -- DS-000 MIME filter [ttl=2026-01-01] */
          multiple
          className="hidden" /* i18n-exempt -- DS-000 utility class [ttl=2026-01-01] */
          onChange={onFileChange}
        />
        {t("upload.dropCta")}
      </Cover>

      <div id={feedbackId} role="status" aria-live="polite" className="space-y-2">
        {error && (
          <p className="text-sm text-danger" data-token="--color-danger">{/* i18n-exempt -- DS-000 token name [ttl=2026-01-01] */}
            {error}
          </p>
        )}
        {progress && (
          <p className="text-sm text-muted" data-token="--color-muted">{/* i18n-exempt -- DS-000 token name [ttl=2026-01-01] */}
            {t("upload.uploadedCount", { done: progress.done, total: progress.total })}
          </p>
        )}
        {pendingFile && (isVideo || isValid !== null) && (
          <div className="space-y-2">
            {thumbnail && (
              <Image
                src={thumbnail}
                alt={String(t("wizard.preview.title"))}
                width={80}
                height={80}
                className="h-20 w-20 rounded object-cover"
              />
            )}
            {!isVideo && (
              <p
                className={isValid ? "text-sm text-success" : "text-sm text-danger"} /* i18n-exempt -- DS-000 utility classes [ttl=2026-01-01] */
                data-token={isValid ? "--color-success" : "--color-danger"} /* i18n-exempt -- DS-000 token name [ttl=2026-01-01] */
              >
                {isValid
                  ? t("cms.image.orientation.ok", { actual })
                  : t("cms.image.orientation.bad", { actual, required: REQUIRED_ORIENTATION })}
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
                  placeholder={String(isVideo ? t("fields.title") : t("cms.image.alt"))}
                  className="flex-1"
                />
                <Input
                  type="text"
                  value={uploadTags}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setUploadTags(e.target.value)
                  }
                  placeholder={String(t("fields.tags.placeholderCommaSeparated"))}
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
                        {t("upload.uploading")}
                      </span>
                    </Inline>
                  ) : (
                    t("cms.image.upload")
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
