// packages/ui/src/components/cms/media/hooks/useMediaManagerState.ts
"use client";

import { useCallback, useMemo, useState } from "react";
import type { MediaItem } from "@acme/types";

import type { MediaDetailsFormValues } from "../details/MediaDetailsPanel";

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
  toast: ToastState;
}

type StateUpdater<T> = T | ((previous: T) => T);

export interface UseMediaManagerStateOptions {
  shop: string;
  initialFiles: MediaItem[];
  onDelete: (shop: string, src: string) => void | Promise<void>;
  onMetadataUpdate: (
    shop: string,
    src: string,
    fields: MediaDetailsFormValues
  ) => MediaItem | Promise<MediaItem>;
}

export interface MediaManagerUploadPanelHandlers {
  onUploaded: (item: MediaItem) => void;
  onUploadError: (message: string) => void;
}

export interface MediaManagerLibraryHandlers {
  onDelete: (url: string) => void;
  onReplace: (url: string) => void;
  onReplaceSuccess: (item: MediaItem) => void;
  onReplaceError: (message: string) => void;
  onSelect: (item: MediaItemWithUrl | null) => void;
  isDeleting: (item: MediaItemWithUrl) => boolean;
  isReplacing: (item: MediaItemWithUrl) => boolean;
}

export interface MediaManagerDeleteDialogState {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export interface MediaManagerDetailsPanelState {
  selectedItem: MediaItemWithUrl | null;
  loading: boolean;
  onSubmit: (fields: MediaDetailsFormValues) => Promise<void>;
  onClose: () => void;
}

export interface MediaManagerToastState extends ToastState {
  onClose: () => void;
}

export interface UseMediaManagerStateResult {
  files: MediaItemWithUrl[];
  uploadPanel: MediaManagerUploadPanelHandlers;
  library: MediaManagerLibraryHandlers;
  deleteDialog: MediaManagerDeleteDialogState;
  detailsPanel: MediaManagerDetailsPanelState;
  toast: MediaManagerToastState;
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

export function useMediaManagerState({
  shop,
  initialFiles,
  onDelete,
  onMetadataUpdate,
}: UseMediaManagerStateOptions): UseMediaManagerStateResult {
  const [state, setState] = useState<MediaManagerState>(() => ({
    files: ensureHasUrl(initialFiles),
    selectedUrl: null,
    dialogDeleteUrl: null,
    deletePending: false,
    metadataPending: false,
    replacingUrl: null,
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

  const {
    files,
    selectedUrl,
    dialogDeleteUrl,
    deletePending,
    metadataPending,
    replacingUrl,
    toast: toastState,
  } = state;

  const deletingUrl = deletePending ? dialogDeleteUrl : null;

  const selectedItem = useMemo(() => {
    if (!selectedUrl) return null;
    return files.find((file) => file.url === selectedUrl) ?? null;
  }, [files, selectedUrl]);

  const handleRequestDelete = useCallback(
    (url: string) => {
      setDialogDeleteUrl(url);
    },
    [setDialogDeleteUrl]
  );

  const handleConfirmDelete = useCallback(
    async () => {
      const targetUrl = dialogDeleteUrl;
      if (!targetUrl) return;

      setDeletePending(true);
      try {
        await onDelete(shop, targetUrl);
        setFiles((prev) => prev.filter((file) => file.url !== targetUrl));
        setSelectedUrl((prev) => (prev === targetUrl ? null : prev));
        setToast({
          open: true,
          message: "Media deleted.",
          variant: "success",
        });
        setDialogDeleteUrl(null);
      } catch (error) {
        console.error("Failed to delete media item", error);
        setToast({
          open: true,
          message: "Failed to delete media item.",
          variant: "error",
        });
      } finally {
        setDeletePending(false);
      }
    },
    [
      dialogDeleteUrl,
      onDelete,
      setDeletePending,
      setDialogDeleteUrl,
      setFiles,
      setSelectedUrl,
      setToast,
      shop,
    ]
  );

  const handleCancelDelete = useCallback(() => {
    setDialogDeleteUrl(null);
  }, [setDialogDeleteUrl]);

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        if (deletePending) return;
        handleCancelDelete();
      }
    },
    [deletePending, handleCancelDelete]
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
        return;
      }

      const itemWithUrl = item as MediaItemWithUrl;
      setFiles((prev) => [itemWithUrl, ...prev]);
      setSelectedUrl(itemWithUrl.url);
      setToast({
        open: true,
        message: "Media uploaded.",
        variant: "success",
      });
    },
    [setFiles, setSelectedUrl, setToast]
  );

  const handleReplace = useCallback(
    (oldUrl: string) => {
      setReplacingUrl(oldUrl);
    },
    [setReplacingUrl]
  );

  const handleReplaceSuccess = useCallback(
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
        console.error(
          "Failed to locate media item to replace",
          replacingUrl
        );
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
      setToast({
        open: true,
        message: "Media replaced.",
        variant: "success",
      });
    },
    [
      files,
      replacingUrl,
      selectedUrl,
      setFiles,
      setReplacingUrl,
      setSelectedUrl,
      setToast,
    ]
  );

  const handleReplaceError = useCallback(
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
          throw new Error("Updated media item is missing a URL");
        }

        const updatedWithUrl = updated as MediaItemWithUrl;
        const hasTarget = files.some((file) => file.url === currentUrl);

        if (!hasTarget) {
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
      files,
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

  const isDeleting = useCallback(
    (item: MediaItemWithUrl) => deletingUrl === item.url,
    [deletingUrl]
  );

  const isReplacing = useCallback(
    (item: MediaItemWithUrl) => replacingUrl === item.url,
    [replacingUrl]
  );

  const handleUploadError = useCallback(
    (message: string) => {
      setToast({ open: true, message, variant: "error" });
    },
    [setToast]
  );

  const handleToastClose = useCallback(() => {
    setToast((previous) => ({ ...previous, open: false }));
  }, [setToast]);

  return {
    files,
    uploadPanel: {
      onUploaded: handleUploaded,
      onUploadError: handleUploadError,
    },
    library: {
      onDelete: handleRequestDelete,
      onReplace: handleReplace,
      onReplaceSuccess: handleReplaceSuccess,
      onReplaceError: handleReplaceError,
      onSelect: handleSelect,
      isDeleting,
      isReplacing,
    },
    deleteDialog: {
      open: Boolean(dialogDeleteUrl),
      pending: deletePending,
      onOpenChange: handleDialogOpenChange,
      onCancel: handleCancelDelete,
      onConfirm: handleConfirmDelete,
    },
    detailsPanel: {
      selectedItem,
      loading: metadataPending,
      onSubmit: handleMetadataSubmit,
      onClose: handleCloseDetails,
    },
    toast: {
      ...toastState,
      onClose: handleToastClose,
    },
  };
}

export type { MediaItemWithUrl };
