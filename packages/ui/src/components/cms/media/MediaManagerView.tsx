// packages/ui/src/components/cms/media/MediaManagerView.tsx
"use client";

import type { ReactElement } from "react";

import { useTranslations } from "@acme/i18n";

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

import MediaDetailsPanel from "./details/MediaDetailsPanel";
import type { UseMediaManagerStateResult } from "./hooks/useMediaManagerState";
import Library from "./Library";
import UploadPanel from "./UploadPanel";

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
  const t = useTranslations();
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
            <DialogTitle>{t("cms.media.confirmDelete.title")}</DialogTitle>
            <DialogDescription>
              {t("cms.media.confirmDelete.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={deleteDialog.onCancel}
              disabled={deleteDialog.pending}
            >
              {t("actions.cancel")}
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
                  <span className="sr-only">{t("cms.media.deleting")}</span>
                </>
              ) : (
                t("actions.delete")
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
        data-cy="media-manager-toast" /* i18n-exempt -- DS-000 test hook attribute [ttl=2026-01-01] */
      />
    </div>
  );
}
