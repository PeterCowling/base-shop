// packages/ui/src/components/cms/MediaManager.tsx
"use client";

import {
  memo,
  ReactElement,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MediaItem } from "@acme/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../atoms/shadcn";
import { Button } from "../atoms/shadcn";
import { Spinner, Toast } from "../atoms";
import MediaDetailsPanel from "./media/MediaDetailsPanel";
import Library from "./media/Library";
import UploadPanel from "./media/UploadPanel";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type UpdateMetadataFields = {
  title?: string | null;
  altText?: string | null;
  tags?: string[] | null;
};

interface Props {
  shop: string;
  initialFiles: MediaItem[];

  /**
   * Removes a media item on the server.
   * Implemented in – and supplied by – the host application (e.g. `apps/cms`).
   */
  onDelete: (shop: string, src: string) => void | Promise<void>;

  /**
   * Persists metadata updates for a media item.
   */
  onMetadataUpdate: (
    shop: string,
    src: string,
    fields: UpdateMetadataFields
  ) => Promise<MediaItem>;
}

interface ToastState {
  open: boolean;
  message: string;
  variant?: "success" | "error" | "info";
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

function MediaManagerBase({
  shop,
  initialFiles,
  onDelete,
  onMetadataUpdate,
}: Props): ReactElement {
  const [files, setFiles] = useState<MediaItem[]>(initialFiles);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [pendingDeleteUrl, setPendingDeleteUrl] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [replacingUrls, setReplacingUrls] = useState<Set<string>>(new Set());
  const skipDeleteForReplace = useRef<Set<string>>(new Set());
  const [toastState, setToastState] = useState<ToastState>({
    open: false,
    message: "",
  });

  const selectedItem = useMemo(() => {
    if (!selectedUrl) return null;
    return (
      files.find((file): file is MediaItem & { url: string } => file.url === selectedUrl) ??
      null
    );
  }, [files, selectedUrl]);

  const showToast = useCallback(
    (message: string, variant?: ToastState["variant"]) => {
      setToastState({ open: true, message, variant });
    },
    []
  );

  const closeToast = useCallback(() => {
    setToastState({ open: false, message: "" });
  }, []);

  const handleDelete = useCallback(
    (src: string) => {
      if (skipDeleteForReplace.current.has(src)) {
        skipDeleteForReplace.current.delete(src);
        return onDelete(shop, src);
      }

      setPendingDeleteUrl(src);
      setDeleteDialogOpen(true);
      return Promise.resolve();
    },
    [onDelete, shop]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDeleteUrl) return;
    setDeleteLoading(true);
    const target = pendingDeleteUrl;
    try {
      await onDelete(shop, target);
      setFiles((prev) => prev.filter((f) => f.url !== target));
      if (selectedUrl === target) setSelectedUrl(null);
      showToast("Media deleted.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Failed to delete media."), "error");
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setPendingDeleteUrl(null);
    }
  }, [onDelete, pendingDeleteUrl, selectedUrl, shop, showToast]);

  const handleCancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setPendingDeleteUrl(null);
  }, []);

  const handleUploaded = useCallback(
    (item: MediaItem) => {
      setFiles((prev) => [item, ...prev]);
      showToast("Media uploaded.", "success");
    },
    [showToast]
  );

  const handleUploadError = useCallback(
    (message: string) => {
      showToast(message || "Upload failed.", "error");
    },
    [showToast]
  );

  const handleReplaceStart = useCallback((oldUrl: string) => {
    skipDeleteForReplace.current.add(oldUrl);
    setReplacingUrls((prev) => {
      const next = new Set(prev);
      next.add(oldUrl);
      return next;
    });
  }, []);

  const handleReplaceSuccess = useCallback(
    (oldUrl: string, item: MediaItem) => {
      const resolved =
        typeof (item as MediaItem & { url?: string }).url === "string"
          ? (item as MediaItem & { url: string })
          : ({ ...item, url: oldUrl } as MediaItem & { url: string });
      setFiles((prev) => prev.map((f) => (f.url === oldUrl ? resolved : f)));
      if (selectedUrl === oldUrl) setSelectedUrl(resolved.url ?? null);
      setReplacingUrls((prev) => {
        const next = new Set(prev);
        next.delete(oldUrl);
        if (resolved.url) next.delete(resolved.url);
        return next;
      });
      showToast("Media replaced.", "success");
    },
    [selectedUrl, showToast]
  );

  const handleReplaceError = useCallback(
    (oldUrl: string, error: Error) => {
      setReplacingUrls((prev) => {
        const next = new Set(prev);
        next.delete(oldUrl);
        return next;
      });
      showToast(getErrorMessage(error, "Failed to replace media."), "error");
    },
    [showToast]
  );

  const handleSelect = useCallback((item: MediaItem & { url: string }) => {
    setSelectedUrl(item.url);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedUrl(null);
  }, []);

  const handleMetadataSubmit = useCallback(
    async (fields: UpdateMetadataFields) => {
      if (!selectedItem?.url) return;
      setMetadataLoading(true);
      const target = selectedItem.url;
      try {
        const updated = await onMetadataUpdate(shop, target, fields);
        const resolvedUrl =
          typeof (updated as MediaItem & { url?: string }).url === "string"
            ? (updated as MediaItem & { url: string }).url
            : target;

        setFiles((prev) =>
          prev.map((file) => (file.url === target ? { ...file, ...updated } : file))
        );
        setSelectedUrl(resolvedUrl);
        showToast("Metadata updated.", "success");
      } catch (error) {
        showToast(getErrorMessage(error, "Failed to update metadata."), "error");
      } finally {
        setMetadataLoading(false);
      }
    },
    [onMetadataUpdate, selectedItem, shop, showToast]
  );

  const isDeleting = useCallback(
    (url: string) =>
      Boolean(
        pendingDeleteUrl &&
          pendingDeleteUrl === url &&
          (deleteDialogOpen || deleteLoading)
      ),
    [deleteDialogOpen, deleteLoading, pendingDeleteUrl]
  );

  const isReplacing = useCallback(
    (url: string) => replacingUrls.has(url),
    [replacingUrls]
  );

  const toastVisuals = useMemo(() => {
    if (toastState.variant === "error") {
      return {
        className: "bg-danger text-danger-fg",
        tokenProps: {
          "data-token": "--color-danger",
          "data-token-fg": "--color-danger-fg",
        } as Record<string, string>,
      };
    }
    if (toastState.variant === "success") {
      return {
        className: "bg-success text-success-fg",
        tokenProps: {
          "data-token": "--color-success",
          "data-token-fg": "--color-success-fg",
        } as Record<string, string>,
      };
    }
    return { className: undefined, tokenProps: {} as Record<string, string> };
  }, [toastState.variant]);

  return (
    <div className="space-y-6">
      <UploadPanel
        shop={shop}
        onUploaded={handleUploaded}
        onUploadError={handleUploadError}
      />
      <Library
        files={files}
        shop={shop}
        onDelete={handleDelete}
        onReplace={handleReplaceStart}
        onReplaceSuccess={handleReplaceSuccess}
        onReplaceError={handleReplaceError}
        onSelect={handleSelect}
        selectedUrl={selectedUrl}
        isDeleting={isDeleting}
        isReplacing={isReplacing}
      />

      <MediaDetailsPanel
        item={selectedItem}
        loading={metadataLoading}
        onSubmit={handleMetadataSubmit}
        onClose={handleCloseDetails}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => !open && handleCancelDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete media</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this media item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelDelete}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? <Spinner className="h-4 w-4" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toast
        open={toastState.open}
        message={toastState.message}
        onClose={closeToast}
        className={toastVisuals.className}
        {...toastVisuals.tokenProps}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Export                                                                    */
/* -------------------------------------------------------------------------- */

export default memo(MediaManagerBase);

