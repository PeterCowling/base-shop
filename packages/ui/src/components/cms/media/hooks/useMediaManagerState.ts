// packages/ui/src/components/cms/media/hooks/useMediaManagerState.ts
"use client";

import {
  type UseMediaManagerStateOptions,
  type UseMediaManagerStateResult,
  type MediaItemWithUrl,
} from "./utils/types";
import { useMediaState } from "./utils/useMediaState";
import { useDeleteHandlers } from "./utils/useDeleteHandlers";
import { useUploadHandlers } from "./utils/useUploadHandlers";
import { useReplaceHandlers } from "./utils/useReplaceHandlers";
import { useDetailsHandlers } from "./utils/useDetailsHandlers";

export function useMediaManagerState({
  shop,
  initialFiles,
  onDelete,
  onMetadataUpdate,
}: UseMediaManagerStateOptions): UseMediaManagerStateResult {
  const { state, actions } = useMediaState(initialFiles);

  const upload = useUploadHandlers(actions);
  const deletion = useDeleteHandlers({ shop, onDelete, state, actions });
  const replace = useReplaceHandlers({ state, actions });
  const details = useDetailsHandlers({
    shop,
    onMetadataUpdate,
    state,
    actions,
  });

  return {
    files: state.files,
    uploadPanel: {
      onUploaded: upload.onUploaded,
      onUploadError: upload.onUploadError,
    },
    library: {
      onDelete: deletion.onRequestDelete,
      onReplace: replace.onReplace,
      onReplaceSuccess: replace.onReplaceSuccess,
      onReplaceError: replace.onReplaceError,
      onSelect: details.onSelect,
      isDeleting: deletion.isDeleting,
      isReplacing: replace.isReplacing,
    },
    deleteDialog: {
      open: Boolean(state.dialogDeleteUrl),
      pending: state.deletePending,
      onOpenChange: deletion.onDialogOpenChange,
      onCancel: deletion.onCancelDelete,
      onConfirm: deletion.onConfirmDelete,
    },
    detailsPanel: {
      selectedItem: details.selectedItem,
      loading: state.metadataPending,
      onSubmit: details.onMetadataSubmit,
      onClose: details.onCloseDetails,
    },
    toast: {
      ...state.toast,
      onClose: actions.handleToastClose,
    },
  };
}

export type { MediaItemWithUrl };
export type { UseMediaManagerStateResult } from "./utils/types";
