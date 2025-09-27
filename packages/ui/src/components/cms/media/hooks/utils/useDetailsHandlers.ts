// packages/ui/src/components/cms/media/hooks/utils/useDetailsHandlers.ts
"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "@acme/i18n";
import type { MediaItem } from "@acme/types";
import type { MediaDetailsFormValues } from "../../details/MediaDetailsPanel";

import { hasUrl } from "./utils";
import type { MediaItemWithUrl, UseMediaManagerStateOptions } from "./types";
import type { MediaManagerState, MediaStateActions } from "./useMediaState";

interface DetailsDeps {
  shop: UseMediaManagerStateOptions["shop"];
  onMetadataUpdate: UseMediaManagerStateOptions["onMetadataUpdate"];
  state: Pick<MediaManagerState, "files" | "selectedUrl" | "metadataPending">;
  actions: Pick<
    MediaStateActions,
    "setMetadataPending" | "setFiles" | "setSelectedUrl" | "setToast"
  >;
}

export function useDetailsHandlers({ shop, onMetadataUpdate, state, actions }: DetailsDeps) {
  const { files, selectedUrl } = state;
  const { setMetadataPending, setFiles, setSelectedUrl, setToast } = actions;
  const t = useTranslations();

  const selectedItem = useMemo(() => {
    if (!selectedUrl) return null;
    return files.find((file) => file.url === selectedUrl) ?? null;
  }, [files, selectedUrl]);

  const onMetadataSubmit = useCallback(
    async (fields: MediaDetailsFormValues) => {
      if (!selectedItem) return;

      const currentUrl = selectedItem.url;
      setMetadataPending(true);
      try {
        const updated: MediaItem = await onMetadataUpdate(shop, currentUrl, fields);
        if (!hasUrl(updated)) {
          // i18n-exempt — developer diagnostic, not user-facing
          throw new Error("Updated media item is missing a URL");
        }

        const updatedWithUrl = updated as MediaItemWithUrl;
        const hasTarget = files.some((file) => file.url === currentUrl);

        if (!hasTarget) {
          // i18n-exempt — developer diagnostic, not user-facing
          throw new Error("Media item could not be found in the current list");
        }

        setFiles((prev) =>
          prev.map((file) =>
            file.url === currentUrl
              ? ({ ...file, ...updatedWithUrl } as MediaItemWithUrl)
              : file
          )
        );

        setSelectedUrl(updatedWithUrl.url);
        setToast({ open: true, message: t("Media details updated."), variant: "success" });
      } catch (error) {
        // i18n-exempt — developer diagnostic, not user-facing
        console.error("Failed to update media metadata", error);
        setToast({
          open: true,
          message: t("Failed to update media metadata."),
          variant: "error",
        });
      } finally {
        setMetadataPending(false);
      }
    },
    [files, onMetadataUpdate, selectedItem, setFiles, setMetadataPending, setSelectedUrl, setToast, shop, t]
  );

  const onCloseDetails = useCallback(() => {
    setSelectedUrl(null);
  }, [setSelectedUrl]);

  const onSelect = useCallback((item: MediaItemWithUrl | null) => {
    setSelectedUrl(item?.url ?? null);
  }, [setSelectedUrl]);

  return { selectedItem, onMetadataSubmit, onCloseDetails, onSelect } as const;
}
