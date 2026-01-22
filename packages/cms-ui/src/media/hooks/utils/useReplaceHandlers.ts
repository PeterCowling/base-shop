// packages/ui/src/components/cms/media/hooks/utils/useReplaceHandlers.ts
"use client";

import { useCallback } from "react";

import { useTranslations } from "@acme/i18n";
import type { MediaItem } from "@acme/types";

import type { MediaItemWithUrl } from "./types";
import type { MediaManagerState, MediaStateActions } from "./useMediaState";
import { hasUrl } from "./utils";

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
  const t = useTranslations();

  const onReplace = useCallback(
    (oldUrl: string) => {
      setReplacingUrl(oldUrl);
    },
    [setReplacingUrl]
  );

  const onReplaceSuccess = useCallback(
    (item: MediaItem) => {
      if (!replacingUrl) {
        // i18n-exempt -- INTL-204 developer diagnostic, not user-facing [ttl=2026-12-31]
        console.warn("Replacement completed without a tracked URL.");
        return;
      }

      if (!hasUrl(item)) {
        // i18n-exempt -- INTL-204 developer diagnostic, not user-facing [ttl=2026-12-31]
        console.error("Replacement media item is missing a URL", item);
        setToast({
          open: true,
          message: t("cms.media.errors.replaceMissingUrl"),
          variant: "error",
        });
        setReplacingUrl(null);
        return;
      }

      const itemWithUrl = item as MediaItemWithUrl;
      const hasTarget = files.some((file) => file.url === replacingUrl);

      if (!hasTarget) {
        // i18n-exempt -- INTL-204 developer diagnostic, not user-facing [ttl=2026-12-31]
        console.error("Failed to locate media item to replace", replacingUrl);
        setToast({
          open: true,
          message: t("cms.media.errors.replaceUpdateFailed"),
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
      setToast({ open: true, message: t("cms.media.toast.replaced"), variant: "success" });
    },
    [files, replacingUrl, selectedUrl, setFiles, setReplacingUrl, setSelectedUrl, setToast, t]
  );

  const onReplaceError = useCallback(
    (message: string) => {
      // i18n-exempt -- INTL-204 developer diagnostic, not user-facing [ttl=2026-12-31]
      console.error("Failed to replace media item", message);
      setReplacingUrl(null);
      setToast({
        open: true,
        message: message || (t("cms.media.errors.replaceFailed") as string),
        variant: "error",
      });
    },
    [setReplacingUrl, setToast, t]
  );

  const isReplacing = useCallback(
    (item: MediaItemWithUrl) => replacingUrl === item.url,
    [replacingUrl]
  );

  return { onReplace, onReplaceSuccess, onReplaceError, isReplacing } as const;
}
