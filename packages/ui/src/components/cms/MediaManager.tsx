// packages/ui/src/components/cms/MediaManager.tsx
"use client";

import { memo, ReactElement, useCallback, useMemo, useState } from "react";
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
import { Spinner, Toast } from "../atoms";
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
      setState((previous) => ({
        ...previous,
        replacingUrl:
          typeof value === "function"
            ? (value as (prev: string | null) => string | null)(
                previous.replacingUrl
              )
            : value,
      }));
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

  const { files, selectedUrl, metadataPending } = state;

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

  const handleUploaded = useCallback((item: MediaItem) => {
    if (!hasUrl(item)) {
      console.error("Uploaded media item is missing a URL", item);
      return;
    }
    const itemWithUrl = item as MediaItemWithUrl;
    setFiles((prev) => [itemWithUrl, ...prev]);
    setUploading(false);
    setToast({
      open: true,
      message: "Media uploaded.",
      variant: "success",
    });
  }, [setFiles, setToast, setUploading]);

  const handleReplace = useCallback((oldUrl: string, item: MediaItem) => {
    setReplacingUrl(oldUrl);
    if (!hasUrl(item)) {
      console.error("Replacement media item is missing a URL", item);
      setReplacingUrl(null);
      return;
    }
    const itemWithUrl = item as MediaItemWithUrl;
    setFiles((prev) => prev.map((f) => (f.url === oldUrl ? itemWithUrl : f)));
    setSelectedUrl((prev) => (prev === oldUrl ? itemWithUrl.url : prev));
    setReplacingUrl(null);
    setToast({
      open: true,
      message: "Media replaced.",
      variant: "success",
    });
  }, [setFiles, setReplacingUrl, setSelectedUrl, setToast]);

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
          return;
        }

        const updatedWithUrl = updated as MediaItemWithUrl;
        setFiles((prev) =>
          prev.map((file) =>
            file.url === currentUrl
              ? ({ ...file, ...updatedWithUrl } as MediaItemWithUrl)
              : file
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
    [onMetadataUpdate, selectedItem, setFiles, setMetadataPending, setSelectedUrl, setToast, shop]
  );

  const handleCloseDetails = useCallback(() => {
    setSelectedUrl(null);
  }, [setSelectedUrl]);

  return (
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
          loading={metadataPending}
          onSubmit={handleMetadataSubmit}
          onClose={handleCloseDetails}
        />
      ) : null}
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

