// packages/ui/src/components/cms/media/hooks/utils/useUploadHandlers.ts
"use client";

import { useCallback } from "react";

import { useTranslations } from "@acme/i18n";
import type { MediaItem } from "@acme/types";

import type { MediaItemWithUrl } from "./types";
import type { MediaStateActions } from "./useMediaState";
import { hasUrl } from "./utils";

export function useUploadHandlers(actions: Pick<
  MediaStateActions,
  "setFiles" | "setSelectedUrl" | "setToast"
>) {
  const { setFiles, setSelectedUrl, setToast } = actions;
  const t = useTranslations();

  const onUploaded = useCallback(
    (item: MediaItem) => {
      if (!hasUrl(item)) {
        console.error(/* i18n-exempt -- DEV-LOG-001 [ttl=2026-01-01] */ "cms.media.upload.missingUrl", item);
        setToast({
          open: true,
          message: t("cms.media.upload.missingUrl"),
          variant: "error",
        });
        return;
      }

      const itemWithUrl = item as MediaItemWithUrl;
      setFiles((prev) => [itemWithUrl, ...prev]);
      setSelectedUrl(itemWithUrl.url);
      setToast({ open: true, message: t("cms.media.upload.success"), variant: "success" });
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
