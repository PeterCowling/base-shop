// packages/ui/src/components/cms/media/hooks/utils/useReplaceHandlers.ts
"use client";

import { useCallback } from "react";
import type { MediaItem } from "@acme/types";

import { hasUrl } from "./utils";
import type { MediaItemWithUrl } from "./types";
import type { MediaManagerState, MediaStateActions } from "./useMediaState";

interface ReplaceDeps {
  state: Pick<MediaManagerState, "files" | "replacingUrl" | "selectedUrl">;
  actions: Pick<
    MediaStateActions,
    "setReplacingUrl" | "setFiles" | "setSelectedUrl" | "setToast"
  >;
}

export function useReplaceHandlers({ state, actions }: ReplaceDeps) {
  const { files, replacingUrl, selectedUrl } = state;
  const { setReplacingUrl, setFiles, setSelectedUrl, setToast } = actions;

  const onReplace = useCallback(
    (oldUrl: string) => {
      setReplacingUrl(oldUrl);
    },
    [setReplacingUrl]
  );

  const onReplaceSuccess = useCallback(
    (item: MediaItem) => {
      if (!replacingUrl) {
        console.warn("Replacement completed without a tracked URL.");
        return;
      }

      if (!hasUrl(item)) {
        console.error("Replacement media item is missing a URL", item);
        setToast({
          open: true,
          message: "Replacement failed: missing media URL.",
          variant: "error",
        });
        setReplacingUrl(null);
        return;
      }

      const itemWithUrl = item as MediaItemWithUrl;
      const hasTarget = files.some((file) => file.url === replacingUrl);

      if (!hasTarget) {
        console.error("Failed to locate media item to replace", replacingUrl);
        setToast({
          open: true,
          message: "Failed to update media after replacement.",
          variant: "error",
        });
        setReplacingUrl(null);
        return;
      }

      setFiles((prev) =>
        prev.map((file) =>
          file.url === replacingUrl
            ? ({ ...file, ...itemWithUrl } as MediaItemWithUrl)
            : file
        )
      );

      if (selectedUrl === replacingUrl) {
        setSelectedUrl(itemWithUrl.url);
      }

      setReplacingUrl(null);
      setToast({ open: true, message: "Media replaced.", variant: "success" });
    },
    [files, replacingUrl, selectedUrl, setFiles, setReplacingUrl, setSelectedUrl, setToast]
  );

  const onReplaceError = useCallback(
    (message: string) => {
      console.error("Failed to replace media item", message);
      setReplacingUrl(null);
      setToast({
        open: true,
        message: message || "Failed to replace media item.",
        variant: "error",
      });
    },
    [setReplacingUrl, setToast]
  );

  const isReplacing = useCallback(
    (item: MediaItemWithUrl) => replacingUrl === item.url,
    [replacingUrl]
  );

  return { onReplace, onReplaceSuccess, onReplaceError, isReplacing } as const;
}

