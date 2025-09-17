// packages/ui/src/components/cms/MediaManager.tsx
"use client";

import { memo, ReactElement, useCallback, useMemo, useState } from "react";
import type { MediaItem } from "@acme/types";
import { Spinner, Toast } from "../atoms";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../atoms/shadcn";
import MediaDetailsPanel, {
  type MediaDetailsFormValues,
} from "./media/MediaDetailsPanel";
import Library from "./media/Library";
import UploadPanel from "./media/UploadPanel";

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
  const [dialogDeleteUrl, setDialogDeleteUrl] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    variant: "success" | "error";
    message: string;
  }>({ open: false, variant: "success", message: "" });

  const selectedItem = useMemo(() => {
    if (!selectedUrl) return null;
    return files.find((file) => file.url === selectedUrl) ?? null;
  }, [files, selectedUrl]);

  const deletingUrl = deletePending ? dialogDeleteUrl : null;

  const showToast = useCallback(
    (variant: "success" | "error", message: string) => {
      setToast({ open: true, variant, message });
    },
    []
  );

  const closeToast = useCallback(() => {
    setToast((current) => ({ ...current, open: false }));
  }, []);

  const handleRequestDelete = useCallback((src: string) => {
    setDialogDeleteUrl(src);
  }, []);

  const handleCancelDelete = useCallback(() => {
    if (deletePending) return;
    setDialogDeleteUrl(null);
  }, [deletePending]);

  const handleConfirmDelete = useCallback(async () => {
    if (!dialogDeleteUrl) return;

    const targetUrl = dialogDeleteUrl;
    setDeletePending(true);
    try {
      await onDelete(shop, targetUrl);
      setFiles((prev) => prev.filter((f) => f.url !== targetUrl));
      setSelectedUrl((prev) => (prev === targetUrl ? null : prev));
      showToast("success", "Media deleted.");
      setDialogDeleteUrl(null);
    } catch (error) {
      console.error("Failed to delete media item", error);
      const message =
        error instanceof Error
          ? error.message || "Failed to delete media item."
          : "Failed to delete media item.";
      showToast("error", message);
    } finally {
      setDeletePending(false);
    }
  }, [dialogDeleteUrl, onDelete, shop, showToast]);

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
          return;
        }

        setFiles((prev) =>
          prev.map((file) =>
            file.url === currentUrl
              ? ({ ...file, ...updated } as MediaItemWithUrl)
              : file
          )
        );
        setSelectedUrl(updated.url);
      } catch (error) {
        console.error("Failed to update media metadata", error);
      } finally {
        setMetadataPending(false);
      }
    },
    [onMetadataUpdate, selectedItem, shop]
  );

  const handleCloseDetails = useCallback(() => {
    setSelectedUrl(null);
  }, []);

  const deleteDialogFileName = useMemo(() => {
    if (!dialogDeleteUrl) return null;
    try {
      return decodeURIComponent(dialogDeleteUrl.split("/").pop() ?? dialogDeleteUrl);
    } catch {
      return dialogDeleteUrl;
    }
  }, [dialogDeleteUrl]);

  return (
    <>
      <Toast
        open={toast.open}
        message={toast.message}
        onClose={closeToast}
        className={
          toast.variant === "error"
            ? "bg-destructive text-destructive-foreground"
            : "bg-success text-success-fg"
        }
      />
      <Dialog
        open={Boolean(dialogDeleteUrl)}
        onOpenChange={(open) => {
          if (!open) handleCancelDelete();
        }}
      >
        <DialogContent
          onEscapeKeyDown={deletePending ? (event) => event.preventDefault() : undefined}
          onPointerDownOutside={
            deletePending ? (event) => event.preventDefault() : undefined
          }
          className="max-w-md"
        >
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle>Delete media</DialogTitle>
            <DialogDescription className="text-left text-sm text-muted-foreground">
              Are you sure you want to delete
              {" "}
              <span className="font-medium text-foreground">
                {deleteDialogFileName ?? "this media file"}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelDelete}
              disabled={deletePending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deletePending || !dialogDeleteUrl}
              aria-label="Delete media"
            >
              {deletePending ? (
                <>
                  <Spinner className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Deleting media…</span>
                </>
              ) : (
                "Delete media"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="space-y-6">
        <UploadPanel
          shop={shop}
          onUploaded={handleUploaded}
          focusTargetId={uploaderTargetId}
        />
        <Library
          files={files}
          shop={shop}
          onDelete={handleRequestDelete}
          onReplace={handleReplace}
          onSelect={handleSelect}
          isDeleting={(item) => deletingUrl === item.url}
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

