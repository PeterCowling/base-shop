// packages/ui/src/components/cms/media/hooks/utils/types.ts
import type { MediaItem } from "@acme/types";

import type { MediaDetailsFormValues } from "../../details/MediaDetailsPanel";

export type MediaItemWithUrl = MediaItem & { url: string };

export interface ToastState {
  open: boolean;
  message: string;
  variant?: "success" | "error";
}

export interface MediaManagerState {
  files: MediaItemWithUrl[];
  selectedUrl: string | null;
  dialogDeleteUrl: string | null;
  deletePending: boolean;
  metadataPending: boolean;
  replacingUrl: string | null;
  toast: ToastState;
}

export type StateUpdater<T> = T | ((previous: T) => T);

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

