// packages/ui/src/components/cms/media/hooks/utils/useUploadHandlers.ts
"use client";

import { useCallback } from "react";
import { useTranslations } from "@acme/i18n";
import type { MediaItem } from "@acme/types";

import { hasUrl } from "./utils";
import type { MediaItemWithUrl } from "./types";
import type { MediaStateActions } from "./useMediaState";

export function useUploadHandlers(actions: Pick<
  MediaStateActions,
  "setFiles" | "setSelectedUrl" | "setToast"
>) {
  const { setFiles, setSelectedUrl, setToast } = actions;
  const t = useTranslations();

  const onUploaded = useCallback(
    (item: MediaItem) => {
      if (!hasUrl(item)) {
        // i18n-exempt — developer diagnostic, not user-facing
        console.error("Uploaded media item is missing a URL", item);
        setToast({
          open: true,
          message: t("Uploaded media item is missing a URL."),
          variant: "error",
        });
        return;
      }

      const itemWithUrl = item as MediaItemWithUrl;
      setFiles((prev) => [itemWithUrl, ...prev]);
      setSelectedUrl(itemWithUrl.url);
      setToast({ open: true, message: t("Media uploaded."), variant: "success" });
    },
    [setFiles, setSelectedUrl, setToast, t]
  );

  const onUploadError = useCallback(
    (message: string) => {
      setToast({ open: true, message, variant: "error" });
    },
    [setToast]
  );

  return { onUploaded, onUploadError } as const;
}
