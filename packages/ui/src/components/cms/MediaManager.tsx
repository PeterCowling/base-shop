// packages/ui/src/components/cms/MediaManager.tsx
"use client";

import { memo, ReactElement, useCallback, useMemo, useState } from "react";
import type { MediaItem } from "@acme/types";
import MediaDetailsPanel, {
  type MediaDetailsFormValues,
} from "./media/MediaDetailsPanel";
import Library from "./media/Library";
import UploadPanel from "./media/UploadPanel";
import { Toast } from "../atoms";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type MediaItemWithUrl = MediaItem & { url: string };

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

type ToastStatus = "success" | "error";

interface ToastState {
  open: boolean;
  message: string;
  status: ToastStatus;
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
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    status: "success",
  });

  const selectedItem = useMemo(() => {
    if (!selectedUrl) return null;
    return files.find((file) => file.url === selectedUrl) ?? null;
  }, [files, selectedUrl]);

  const showToast = useCallback((message: string, status: ToastStatus) => {
    setToast({ open: true, message, status });
  }, []);

  const closeToast = useCallback(() => {
    setToast((current) => ({ ...current, open: false }));
  }, []);

  const toastClassName = useMemo(() => {
    return toast.status === "error"
      ? "bg-destructive text-destructive-foreground"
      : "bg-success text-success-fg";
  }, [toast.status]);

  const handleDelete = useCallback(
    async (src: string) => {
      if (!confirm("Delete this image?")) return;
      try {
        await onDelete(shop, src);
        setFiles((prev) => prev.filter((f) => f.url !== src));
        setSelectedUrl((prev) => (prev === src ? null : prev));
        showToast("Media deleted.", "success");
      } catch (error) {
        console.error("Failed to delete media", error);
        showToast("Failed to delete media.", "error");
      }
    },
    [onDelete, shop, showToast]
  );

  const handleUploaded = useCallback((item: MediaItem) => {
    if (!hasUrl(item)) {
      console.error("Uploaded media item is missing a URL", item);
      return;
    }
    setFiles((prev) => [item, ...prev]);
  }, []);

  const handleReplace = useCallback((oldUrl: string, item: MediaItem) => {
    if (!hasUrl(item)) {
      console.error("Replacement media item is missing a URL", item);
      return;
    }
    setFiles((prev) => prev.map((f) => (f.url === oldUrl ? item : f)));
    setSelectedUrl((prev) => (prev === oldUrl ? item.url : prev));
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
          console.error("Updated media item is missing a URL", updated);
          showToast("Failed to update media metadata.", "error");
          return;
        }

        setFiles((prev) =>
          prev.map((file) =>
            file.url === currentUrl
              ? ({ ...file, ...updated } as MediaItemWithUrl)
              : file
          )
        );
        setSelectedUrl(null);
        showToast("Media details saved.", "success");
      } catch (error) {
        console.error("Failed to update media metadata", error);
        showToast("Failed to update media metadata.", "error");
      } finally {
        setMetadataPending(false);
      }
    },
    [onMetadataUpdate, selectedItem, shop, showToast]
  );

  const handleCloseDetails = useCallback(() => {
    setSelectedUrl(null);
  }, []);

  return (
    <>
      <div className="space-y-6">
        <UploadPanel
          shop={shop}
          onUploaded={handleUploaded}
          focusTargetId={uploaderTargetId}
        />
        <Library
          files={files}
          shop={shop}
          onDelete={handleDelete}
          onReplace={handleReplace}
          onSelect={handleSelect}
        />
        {selectedItem ? (
          <MediaDetailsPanel
            open
            item={selectedItem}
            pending={metadataPending}
            onSubmit={handleMetadataSubmit}
            onClose={handleCloseDetails}
          />
        ) : null}
      </div>
      <Toast
        open={toast.open}
        message={toast.message}
        onClose={closeToast}
        className={toastClassName}
        role="status"
        data-variant={toast.status}
      />
    </>
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

