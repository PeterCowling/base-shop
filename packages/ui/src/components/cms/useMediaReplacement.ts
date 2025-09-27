"use client";

import type { ApiError, MediaItem } from "@acme/types";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Options {
  item: MediaItem & { url: string };
  shop: string;
  disabled: boolean;
  previewAlt?: string | null;
  tags: string[];
  onDelete: (url: string) => Promise<void> | void;
  onReplace: (oldUrl: string, item: MediaItem) => void;
  onReplaceSuccess?: (newItem: MediaItem) => void;
  onReplaceError?: (message: string) => void;
}

type UploadTimer = ReturnType<typeof setInterval> | undefined;

export function useMediaReplacement({
  item,
  shop,
  disabled,
  previewAlt,
  tags,
  onDelete,
  onReplace,
  onReplaceSuccess,
  onReplaceError,
}: Options) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const progressTimer = useRef<UploadTimer>(undefined);

  const clearTimer = useCallback(() => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = undefined;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const beginUploadProgress = useCallback(() => {
    clearTimer();
    setUploadProgress(4);
    progressTimer.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 6;
      });
    }, 300);
  }, [clearTimer]);

  const finishUploadProgress = useCallback(() => {
    clearTimer();
    setUploadProgress(100);
  }, [clearTimer]);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (disabled) {
        event.target.value = "";
        return;
      }

      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      setUploadError(null);
      setUploading(true);
      beginUploadProgress();

      let errorMessage: string | null = null;
      try {
        const fd = new FormData();
        fd.append("file", file);
        if (previewAlt) fd.append("altText", previewAlt);
        if (tags.length > 0) fd.append("tags", JSON.stringify(tags));

        const response = await fetch(`/cms/api/media?shop=${shop}`, {
          method: "POST",
          body: fd,
        });

        const data = (await response.json()) as MediaItem | ApiError;
        if (!response.ok || "error" in data) {
          // i18n-exempt — surfaced verbatim to caller, upstream may provide localized message
          throw new Error("Failed to upload replacement");
        }

        finishUploadProgress();
        await onDelete(item.url);
        onReplace(item.url, data);
        onReplaceSuccess?.(data);
      } catch (error) {
        clearTimer();
        setUploadProgress(0);
        // i18n-exempt — developer-friendly fallback; UI may map to localized copy
        errorMessage = (error as Error).message ?? "Replacement failed";
        setUploadError(errorMessage);
        if (errorMessage) onReplaceError?.(errorMessage);
      } finally {
        const delay = errorMessage ? 2000 : 400;
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
          if (errorMessage) setUploadError(null);
        }, delay);
      }
    },
    [
      beginUploadProgress,
      clearTimer,
      disabled,
      finishUploadProgress,
      item.url,
      onDelete,
      onReplace,
      onReplaceError,
      onReplaceSuccess,
      previewAlt,
      shop,
      tags,
    ]
  );

  return {
    uploading,
    uploadProgress,
    uploadError,
    handleFileChange,
  };
}
