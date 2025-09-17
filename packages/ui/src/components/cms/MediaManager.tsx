// packages/ui/src/components/cms/MediaManager.tsx
"use client";

import { memo, ReactElement, useCallback, useMemo, useState } from "react";
import type { MediaItem } from "@acme/types";
import { Toast } from "../atoms";
import MediaDetailsPanel, {
  type MediaDetailsFormValues,
} from "./media/MediaDetailsPanel";
import Library from "./media/Library";
import UploadPanel from "./media/UploadPanel";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type MediaItemWithUrl = MediaItem & { url: string };

type ToastState = {
  open: boolean;
  message: string;
  variant: "info" | "success" | "error";
};

interface Props {
  shop: string;
  initialFiles: MediaItem[];

  /**
   * Removes a media item on the server.
   * Implemented in – and supplied by – the host application (e.g. `apps/cms`).
   */
  onDelete: (shop: string, src: string) => void | Promise<void>;
  onMetadataUpdate: (
    shop: string,
    src: string,
    fields: MediaDetailsFormValues
  ) => MediaItem | Promise<MediaItem>;
  uploaderTargetId?: string;
}

function hasUrl(item: MediaItem): item is MediaItemWithUrl {
  return typeof item.url === "string" && item.url.length > 0;
}

function ensureHasUrl(items: MediaItem[]): MediaItemWithUrl[] {
  return items.filter(hasUrl);
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

function MediaManagerBase({
  shop,
  initialFiles,
  onDelete,
  onMetadataUpdate,
  uploaderTargetId,
}: Props): ReactElement {
  const [files, setFiles] = useState<MediaItemWithUrl[]>(() =>
    ensureHasUrl(initialFiles)
  );
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [metadataPending, setMetadataPending] = useState(false);
  const [replacingUrl, setReplacingUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    variant: "info",
  });

  const selectedItem = useMemo(() => {
    if (!selectedUrl) return null;
    return files.find((file) => file.url === selectedUrl) ?? null;
  }, [files, selectedUrl]);

  const handleDelete = useCallback(
    async (src: string) => {
      if (!confirm("Delete this image?")) return;
      await onDelete(shop, src);
      setFiles((prev) => prev.filter((f) => f.url !== src));
      setSelectedUrl((prev) => (prev === src ? null : prev));
    },
    [onDelete, shop]
  );

  const handleUploaded = useCallback((item: MediaItem) => {
    if (!hasUrl(item)) {
      console.error("Uploaded media item is missing a URL", item);
      setToast({
        open: true,
        message: "Uploaded media item is missing a URL.",
        variant: "error",
      });
      return;
    }

    setFiles((prev) => [item, ...prev.filter((file) => file.url !== item.url)]);
    setSelectedUrl(item.url);
    setToast({
      open: true,
      message: "Media uploaded.",
      variant: "success",
    });
  }, []);

  const handleUploadError = useCallback((message: string) => {
    console.error("Failed to upload media", message);
    setToast({
      open: true,
      message: message || "Failed to upload media.",
      variant: "error",
    });
  }, []);

  const handleReplace = useCallback((oldUrl: string, item: MediaItem) => {
    if (!hasUrl(item)) {
      console.error("Replacement media item is missing a URL", item);
      setToast({
        open: true,
        message: "Replacement media item is missing a URL.",
        variant: "error",
      });
      return;
    }

    setReplacingUrl(oldUrl);
  }, []);

  const handleReplaceSuccess = useCallback(
    (newItem: MediaItem) => {
      if (!replacingUrl) {
        console.error("Replacement completed without a pending item", newItem);
        setToast({
          open: true,
          message: "Replacement finished but no media was pending.",
          variant: "error",
        });
        return;
      }

      if (!hasUrl(newItem)) {
        console.error("Replacement media item is missing a URL", newItem);
        setToast({
          open: true,
          message: "Replacement media item is missing a URL.",
          variant: "error",
        });
        setReplacingUrl(null);
        return;
      }

      const oldUrl = replacingUrl;
      setFiles((prev) =>
        prev.map((file) =>
          file.url === oldUrl
            ? ({ ...file, ...newItem } as MediaItemWithUrl)
            : file
        )
      );
      setSelectedUrl((prev) => (prev === oldUrl ? newItem.url : prev));
      setToast({
        open: true,
        message: "Media replaced.",
        variant: "success",
      });
      setReplacingUrl(null);
    },
    [replacingUrl]
  );

  const handleReplaceError = useCallback((message: string) => {
    console.error("Failed to replace media", message);
    setReplacingUrl(null);
    setToast({
      open: true,
      message: message || "Failed to replace media.",
      variant: "error",
    });
  }, []);

  const handleSelect = useCallback((item: MediaItemWithUrl | null) => {
    setSelectedUrl(item?.url ?? null);
  }, []);

  const handleMetadataSubmit = useCallback(
    async (fields: MediaDetailsFormValues) => {
      if (!selectedItem) return;

      const currentUrl = selectedItem.url;
      setMetadataPending(true);
      try {
        const updated = await onMetadataUpdate(shop, currentUrl, fields);
        if (!hasUrl(updated)) {
          throw new Error("Updated media item is missing a URL.");
        }

        setFiles((prev) =>
          prev.map((file) =>
            file.url === currentUrl
              ? ({ ...file, ...updated } as MediaItemWithUrl)
              : file
          )
        );
        setSelectedUrl(updated.url);
        setToast({
          open: true,
          message: "Media details updated.",
          variant: "success",
        });
      } catch (error) {
        console.error("Failed to update media metadata", error);
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Failed to update media metadata.";
        setToast({
          open: true,
          message,
          variant: "error",
        });
      } finally {
        setMetadataPending(false);
      }
    },
    [onMetadataUpdate, selectedItem, shop]
  );

  const handleCloseDetails = useCallback(() => {
    setSelectedUrl(null);
  }, []);

  return (
    <div className="space-y-6">
      <UploadPanel
        shop={shop}
        onUploaded={handleUploaded}
        focusTargetId={uploaderTargetId}
        onUploadError={handleUploadError}
      />
      <Library
        files={files}
        shop={shop}
        onDelete={handleDelete}
        onReplace={handleReplace}
        onSelect={handleSelect}
        selectedUrl={selectedUrl ?? undefined}
        isReplacing={
          replacingUrl ? (file) => file.url === replacingUrl : undefined
        }
        onReplaceSuccess={handleReplaceSuccess}
        onReplaceError={handleReplaceError}
      />
      {selectedItem ? (
        <MediaDetailsPanel
          open
          item={selectedItem}
          loading={metadataPending}
          onSubmit={handleMetadataSubmit}
          onClose={handleCloseDetails}
        />
      ) : null}
      <Toast
        open={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Export                                                                    */
/* -------------------------------------------------------------------------- */

export { MediaDetailsPanel };
export type {
  MediaDetailsFormValues,
  MediaDetailsPanelProps,
} from "./media/MediaDetailsPanel";

export default memo(MediaManagerBase);

