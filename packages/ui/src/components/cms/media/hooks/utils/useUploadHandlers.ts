// packages/ui/src/components/cms/media/hooks/utils/useUploadHandlers.ts
"use client";

import { useCallback } from "react";
import type { MediaItem } from "@acme/types";

import { hasUrl } from "./utils";
import type { MediaItemWithUrl } from "./types";
import type { MediaStateActions } from "./useMediaState";

export function useUploadHandlers(actions: Pick<
  MediaStateActions,
  "setFiles" | "setSelectedUrl" | "setToast"
>) {
  const { setFiles, setSelectedUrl, setToast } = actions;

  const onUploaded = useCallback(
    (item: MediaItem) => {
      if (!hasUrl(item)) {
        console.error("Uploaded media item is missing a URL", item);
        setToast({
          open: true,
          message: "Uploaded media item is missing a URL.",
          variant: "error",
        });
        return;
      }

      const itemWithUrl = item as MediaItemWithUrl;
      setFiles((prev) => [itemWithUrl, ...prev]);
      setSelectedUrl(itemWithUrl.url);
      setToast({ open: true, message: "Media uploaded.", variant: "success" });
    },
    [setFiles, setSelectedUrl, setToast]
  );

  const onUploadError = useCallback(
    (message: string) => {
      setToast({ open: true, message, variant: "error" });
    },
    [setToast]
  );

  return { onUploaded, onUploadError } as const;
}

