// packages/ui/src/components/cms/media/MediaManagerView.tsx
"use client";

import type { ReactElement } from "react";

import { Spinner, Toast } from "../../atoms";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../atoms/shadcn";
import Library from "./Library";
import UploadPanel from "./UploadPanel";
import MediaDetailsPanel from "./details/MediaDetailsPanel";
import type { UseMediaManagerStateResult } from "./hooks/useMediaManagerState";

export interface MediaManagerViewProps extends UseMediaManagerStateResult {
  shop: string;
  uploaderTargetId?: string;
}

export default function MediaManagerView({
  shop,
  uploaderTargetId,
  files,
  uploadPanel,
  library,
  deleteDialog,
  detailsPanel,
  toast,
}: MediaManagerViewProps): ReactElement {
  return (
    <div className="space-y-6">
      <UploadPanel
        shop={shop}
        onUploaded={uploadPanel.onUploaded}
        focusTargetId={uploaderTargetId}
        onUploadError={uploadPanel.onUploadError}
      />
      <Library
        files={files}
        shop={shop}
        onDelete={library.onDelete}
        onReplace={library.onReplace}
        onReplaceSuccess={library.onReplaceSuccess}
        onReplaceError={library.onReplaceError}
        onSelect={library.onSelect}
        isDeleting={library.isDeleting}
        isReplacing={library.isReplacing}
      />
      <Dialog open={deleteDialog.open} onOpenChange={deleteDialog.onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete media?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the media
              file from your library.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={deleteDialog.onCancel}
              disabled={deleteDialog.pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={deleteDialog.onConfirm}
              disabled={deleteDialog.pending}
            >
              {deleteDialog.pending ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span className="sr-only">Deleting media</span>
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {detailsPanel.selectedItem ? (
        <MediaDetailsPanel
          open
          item={detailsPanel.selectedItem}
          loading={detailsPanel.loading}
          onSubmit={detailsPanel.onSubmit}
          onClose={detailsPanel.onClose}
        />
      ) : null}
      <Toast
        open={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={toast.onClose}
        data-cy="media-manager-toast"
      />
    </div>
  );
}
