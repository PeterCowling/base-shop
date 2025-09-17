// packages/ui/src/components/cms/MediaManager.tsx
"use client";

import { memo, ReactElement, useCallback, useMemo, useRef, useState } from "react";
import type { MediaItem } from "@acme/types";
import MediaDetailsPanel, {
  type MediaDetailsFormValues,
} from "./media/details/MediaDetailsPanel";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../atoms/shadcn";
import { Toast } from "../atoms";
import Library from "./media/Library";
import UploadPanel from "./media/UploadPanel";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type MediaItemWithUrl = MediaItem & { url: string };

interface ToastState {
  open: boolean;
  message: string;
  variant?: "success" | "error";
}

interface MediaManagerState {
  files: MediaItemWithUrl[];
  selectedUrl: string | null;
  dialogDeleteUrl: string | null;
  deletePending: boolean;
  metadataPending: boolean;
  replacingUrl: string | null;
  uploading: boolean;
  toast: ToastState;
}

type StateUpdater<T> = T | ((previous: T) => T);

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
  return items.reduce<MediaItemWithUrl[]>((accumulator, item) => {
    if (!hasUrl(item)) {
      console.warn("Media item is missing a URL", item);
      return accumulator;
    }

    accumulator.push(item);
    return accumulator;
  }, []);
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
  const [state, setState] = useState<MediaManagerState>(() => ({
    files: ensureHasUrl(initialFiles),
    selectedUrl: null,
    dialogDeleteUrl: null,
    deletePending: false,
    metadataPending: false,
    replacingUrl: null,
    uploading: false,
    toast: { open: false, message: "" },
  }));

  const replacingUrlRef = useRef<string | null>(null);

  const setFiles = useCallback(
    (value: StateUpdater<MediaItemWithUrl[]>) => {
      setState((previous) => ({
        ...previous,
        files:
          typeof value === "function"
            ? (value as (prev: MediaItemWithUrl[]) => MediaItemWithUrl[])(
                previous.files
              )
            : value,
      }));
    },
    []
  );

  const setSelectedUrl = useCallback(
    (value: StateUpdater<string | null>) => {
      setState((previous) => ({
        ...previous,
        selectedUrl:
          typeof value === "function"
            ? (value as (prev: string | null) => string | null)(
                previous.selectedUrl
              )
            : value,
      }));
    },
    []
  );

  const setDialogDeleteUrl = useCallback(
    (value: StateUpdater<string | null>) => {
      setState((previous) => ({
        ...previous,
        dialogDeleteUrl:
          typeof value === "function"
            ? (value as (prev: string | null) => string | null)(
                previous.dialogDeleteUrl
              )
            : value,
      }));
    },
    []
  );

  const setDeletePending = useCallback(
    (value: StateUpdater<boolean>) => {
      setState((previous) => ({
        ...previous,
        deletePending:
          typeof value === "function"
            ? (value as (prev: boolean) => boolean)(previous.deletePending)
            : value,
      }));
    },
    []
  );

  const setMetadataPending = useCallback(
    (value: StateUpdater<boolean>) => {
      setState((previous) => ({
        ...previous,
        metadataPending:
          typeof value === "function"
            ? (value as (prev: boolean) => boolean)(previous.metadataPending)
            : value,
      }));
    },
    []
  );

  const setReplacingUrl = useCallback(
    (value: StateUpdater<string | null>) => {
      setState((previous) => {
        const nextValue =
          typeof value === "function"
            ? (value as (prev: string | null) => string | null)(
                previous.replacingUrl
              )
            : value;
        replacingUrlRef.current = nextValue;
        return {
          ...previous,
          replacingUrl: nextValue,
        };
      });
    },
    []
  );

  const setUploading = useCallback(
    (value: StateUpdater<boolean>) => {
      setState((previous) => ({
        ...previous,
        uploading:
          typeof value === "function"
            ? (value as (prev: boolean) => boolean)(previous.uploading)
            : value,
      }));
    },
    []
  );

  const setToast = useCallback(
    (value: StateUpdater<ToastState>) => {
      setState((previous) => ({
        ...previous,
        toast:
          typeof value === "function"
            ? (value as (prev: ToastState) => ToastState)(previous.toast)
            : value,
      }));
    },
    []
  );

  const { files, selectedUrl, metadataPending, replacingUrl, toast } = state;

  const selectedItem = useMemo(() => {
    if (!selectedUrl) return null;
    return files.find((file) => file.url === selectedUrl) ?? null;
  }, [files, selectedUrl]);

  const handleDelete = useCallback(
    async (src: string) => {
      if (!confirm("Delete this image?")) return;
      setDialogDeleteUrl(src);
      setDeletePending(true);
      try {
        await onDelete(shop, src);
        setFiles((prev) => prev.filter((f) => f.url !== src));
        setSelectedUrl((prev) => (prev === src ? null : prev));
        setToast({
          open: true,
          message: "Media deleted.",
          variant: "success",
        });
      } catch (error) {
        console.error("Failed to delete media item", error);
        setToast({
          open: true,
          message: "Failed to delete media item.",
          variant: "error",
        });
      } finally {
        setDeletePending(false);
        setDialogDeleteUrl(null);
      }
    },
    [onDelete, setDeletePending, setDialogDeleteUrl, setFiles, setSelectedUrl, setToast, shop]
  );

  const handleUploaded = useCallback(
    (item: MediaItem) => {
      if (!hasUrl(item)) {
        console.error("Uploaded media item is missing a URL", item);
        setToast({
          open: true,
          message: "Uploaded media item is missing a URL.",
          variant: "error",
        });
        setUploading(false);
        return;
      }

      const itemWithUrl = item as MediaItemWithUrl;
      setFiles((prev) => [itemWithUrl, ...prev]);
      setSelectedUrl(itemWithUrl.url);
      setUploading(false);
      setToast({
        open: true,
        message: "Media uploaded.",
        variant: "success",
      });
    },
    [setFiles, setSelectedUrl, setToast, setUploading]
  );

  const handleReplace = useCallback(
    (oldUrl: string, _item: MediaItem) => {
      setReplacingUrl(oldUrl);
    },
    [setReplacingUrl]
  );

  const handleReplaceSuccess = useCallback(
    (newItem: MediaItem) => {
      const targetUrl = replacingUrlRef.current;

      if (!targetUrl) {
        console.error(
          "Replacement succeeded but no item was marked for replacement",
          newItem
        );
        setReplacingUrl(null);
        setToast({
          open: true,
          message: "Unable to replace media item.",
          variant: "error",
        });
        return;
      }

      if (!hasUrl(newItem)) {
        console.error("Replacement media item is missing a URL", newItem);
        setReplacingUrl(null);
        setToast({
          open: true,
          message: "Replacement media item is missing a URL.",
          variant: "error",
        });
        return;
      }

      const newItemWithUrl = newItem as MediaItemWithUrl;
      setFiles((prev) =>
        prev.map((file) => (file.url === targetUrl ? newItemWithUrl : file))
      );
      setSelectedUrl((prev) =>
        prev === targetUrl ? newItemWithUrl.url : prev
      );
      setReplacingUrl(null);
      setToast({
        open: true,
        message: "Media replaced.",
        variant: "success",
      });
    },
    [setFiles, setReplacingUrl, setSelectedUrl, setToast]
  );

  const handleReplaceError = useCallback(
    (message: string) => {
      setReplacingUrl(null);
      setToast({
        open: true,
        message: message || "Failed to replace media item.",
        variant: "error",
      });
    },
    [setReplacingUrl, setToast]
  );

  const handleSelect = useCallback((item: MediaItemWithUrl | null) => {
    setSelectedUrl(item?.url ?? null);
  }, [setSelectedUrl]);

  const handleMetadataSubmit = useCallback(
    async (fields: MediaDetailsFormValues) => {
      if (!selectedItem) return;

      const currentUrl = selectedItem.url;
      setMetadataPending(true);
      try {
        const updated = await onMetadataUpdate(shop, currentUrl, fields);
        if (!hasUrl(updated)) {
          console.error("Updated media item is missing a URL", updated);
          throw new Error("Updated media item is missing a URL.");
        }

        const updatedWithUrl = updated as MediaItemWithUrl;
        setFiles((prev) =>
          prev.map((file) =>
            file.url === currentUrl ? updatedWithUrl : file
          )
        );
        setSelectedUrl(updatedWithUrl.url);
        setToast({
          open: true,
          message: "Media details updated.",
          variant: "success",
        });
      } catch (error) {
        console.error("Failed to update media metadata", error);
        setToast({
          open: true,
          message: "Failed to update media metadata.",
          variant: "error",
        });
      } finally {
        setMetadataPending(false);
      }
    },
    [
      onMetadataUpdate,
      selectedItem,
      setFiles,
      setMetadataPending,
      setSelectedUrl,
      setToast,
      shop,
    ]
  );

  const handleCloseDetails = useCallback(() => {
    setSelectedUrl(null);
  }, [setSelectedUrl]);

  return (
    <div className="space-y-6">
      <UploadPanel
        shop={shop}
        onUploaded={handleUploaded}
        onUploadError={(message) =>
          setToast({ open: true, message, variant: "error" })
        }
        focusTargetId={uploaderTargetId}
      />
      <Library
        files={files}
        shop={shop}
        onDelete={handleDelete}
        onReplace={handleReplace}
        onSelect={handleSelect}
        isReplacing={(file) => file.url === replacingUrl}
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
        onClose={() => setToast((previous) => ({ ...previous, open: false }))}
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
} from "./media/details/MediaDetailsPanel";

export default memo(MediaManagerBase);

