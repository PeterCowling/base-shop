// packages/ui/src/components/cms/MediaManager.tsx
"use client";

import { memo, ReactElement, useCallback, useMemo, useState } from "react";
import type { MediaItem } from "@acme/types";
import { Toast } from "../atoms";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../atoms/shadcn";
import Library from "./media/Library";
import MediaDetailsPanel, {
  type MediaDetailsValues,
} from "./media/MediaDetailsPanel";
import UploadPanel from "./media/UploadPanel";

interface MetadataUpdates {
  title?: string | null;
  altText?: string | null;
  description?: string | null;
  tags?: string[] | null;
}

interface Props {
  shop: string;
  initialFiles: MediaItem[];
  /**
   * Removes a media item on the server.
   */
  onDelete: (shop: string, src: string) => void | Promise<void>;
  /**
   * Optional callback to update metadata for a media item.
   */
  onUpdateMetadata?: (
    shop: string,
    src: string,
    updates: MetadataUpdates
  ) => Promise<MediaItem> | MediaItem;
}

type WithUrl = MediaItem & { url: string };

type ToastState = { open: boolean; message: string };

function MediaManagerBase({
  shop,
  initialFiles,
  onDelete,
  onUpdateMetadata,
}: Props): ReactElement {
  const [files, setFiles] = useState<WithUrl[]>(() =>
    initialFiles.filter((item): item is WithUrl => Boolean(item?.url))
  );
  const [deleteTarget, setDeleteTarget] = useState<WithUrl | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [detailsItem, setDetailsItem] = useState<WithUrl | null>(null);
  const [toast, setToast] = useState<ToastState>({ open: false, message: "" });

  const showToast = useCallback((message: string) => {
    setToast({ open: true, message });
  }, []);

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const handleUploaded = useCallback((item: MediaItem) => {
    if (!item?.url) return;
    const withUrl = item as WithUrl;
    setFiles((prev) => {
      const existingIndex = prev.findIndex((file) => file.url === withUrl.url);
      if (existingIndex >= 0) {
        const next = [...prev];
        next.splice(existingIndex, 1, withUrl);
        return next;
      }
      return [withUrl, ...prev];
    });
    showToast("Media uploaded.");
  }, [showToast]);

  const handleReplace = useCallback((oldUrl: string, item: MediaItem) => {
    if (!item?.url) return;
    const withUrl = item as WithUrl;
    setFiles((prev) =>
      prev.map((file) => (file.url === oldUrl ? withUrl : file))
    );
    showToast("Media replaced.");
  }, [showToast]);

  const handleDeleteRequest = useCallback((url: string) => {
    const target = files.find((file) => file.url === url) ?? null;
    setDeleteTarget(target);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  }, [files]);

  const handleDeleteDialogChange = useCallback((open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setDeleteTarget(null);
      setDeleteError(null);
    }
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await onDelete(shop, deleteTarget.url);
      setFiles((prev) => prev.filter((file) => file.url !== deleteTarget.url));
      showToast("Media deleted.");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError((error as Error).message || "Failed to delete media.");
    } finally {
      setDeletePending(false);
    }
  }, [deleteTarget, onDelete, shop, showToast]);

  const handleOpenDetails = useCallback((item: WithUrl) => {
    setDetailsItem(item);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setDetailsItem(null);
  }, []);

  const deriveUpdates = useCallback(
    (values: MediaDetailsValues): MetadataUpdates => ({
      title: values.title ? values.title : null,
      altText: values.altText ? values.altText : null,
      description: values.description ? values.description : null,
      tags: values.tags.length > 0 ? values.tags : [],
    }),
    []
  );

  const mergeUpdatedItem = useCallback(
    (original: WithUrl, updated: MediaItem, values: MediaDetailsValues): WithUrl => {
      const tags = Array.isArray(updated.tags)
        ? updated.tags
        : values.tags;
      const result: WithUrl = {
        ...original,
        ...updated,
        url: updated.url ?? original.url,
        title: updated.title ?? values.title ?? original.title,
        altText: updated.altText ?? values.altText ?? original.altText,
        tags,
      };
      if (!result.altText && !values.altText) {
        delete (result as Partial<MediaItem>).altText;
      }
      if (!result.title && !values.title) {
        delete (result as Partial<MediaItem>).title;
      }
      if (!tags || tags.length === 0) {
        delete (result as Partial<MediaItem>).tags;
      }
      return result;
    },
    []
  );

  const handleDetailsSave = useCallback(
    async (values: MediaDetailsValues) => {
      if (!detailsItem) return;
      const updates = deriveUpdates(values);
      try {
        const updated = onUpdateMetadata
          ? await onUpdateMetadata(shop, detailsItem.url, updates)
          : ({
              ...detailsItem,
              title: values.title || undefined,
              altText: values.altText || undefined,
              tags: values.tags.length ? values.tags : undefined,
              description: values.description || undefined,
            } as MediaItem);

        const nextItem = mergeUpdatedItem(detailsItem, updated, values);

        setFiles((prev) =>
          prev.map((file) => (file.url === detailsItem.url ? nextItem : file))
        );
        showToast("Media details updated.");
      } catch (error) {
        showToast((error as Error).message || "Failed to update media details.");
        throw error;
      }
    },
    [deriveUpdates, detailsItem, mergeUpdatedItem, onUpdateMetadata, shop, showToast]
  );

  const deleteName = useMemo(() => {
    if (!deleteTarget) return "this media item";
    try {
      return decodeURIComponent(deleteTarget.url.split("/").pop() ?? deleteTarget.url);
    } catch {
      return deleteTarget.url;
    }
  }, [deleteTarget]);

  return (
    <div className="space-y-6">
      <UploadPanel shop={shop} onUploaded={handleUploaded} />
      <Library
        files={files}
        shop={shop}
        onDelete={handleDeleteRequest}
        onReplace={handleReplace}
        onOpenDetails={handleOpenDetails}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogChange}>
        <DialogContent aria-label="Confirm delete" className="max-w-sm space-y-4">
          <DialogHeader>
            <DialogTitle>Delete media</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p className="text-sm text-danger" role="alert">
              {deleteError}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDeleteDialogChange(false)}
              disabled={deletePending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deletePending}
            >
              {deletePending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaDetailsPanel
        open={Boolean(detailsItem)}
        item={detailsItem}
        onClose={handleCloseDetails}
        onSave={handleDetailsSave}
      />

      <Toast open={toast.open} message={toast.message} onClose={closeToast} />
    </div>
  );
}

export default memo(MediaManagerBase);
