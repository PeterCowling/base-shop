"use client";

import { useEffect, useState } from "react";
import { CheckIcon, RotateCounterClockwiseIcon, UpdateIcon } from "@radix-ui/react-icons";

import { Spinner, Tooltip } from "@acme/design-system/atoms";
import { Inline, Stack } from "@acme/design-system/primitives";
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger } from "@acme/design-system/shadcn";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@acme/design-system/shadcn/AlertDialog";
import { DialogDescription } from "@acme/design-system/shadcn/Dialog";
import { useTranslations } from "@acme/i18n";
import type { HistoryState, PageComponent } from "@acme/types";

import VersionsPanel from "./VersionsPanel";

interface Props {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onPublish: () => void;
  saving: boolean;
  publishing: boolean;
  saveError?: string | null;
  publishError?: string | null;
  autoSaveState: "idle" | "saving" | "saved" | "error";
  onRevertToPublished?: (components: PageComponent[]) => void;
  lastPublishedComponents?: PageComponent[];
  // Versions panel integration (optional)
  shop?: string | null;
  pageId?: string | null;
  currentComponents?: PageComponent[];
  editor?: HistoryState["editor"];
  onRestoreVersion?: (components: PageComponent[]) => void;
  // Visibility controls (to support multi-row layouts)
  showUndoRedo?: boolean;
  showSavePublish?: boolean;
  showVersions?: boolean;
}

const UndoRedoControls = ({ canUndo, canRedo, onUndo, onRedo }: Pick<Props, "canUndo" | "canRedo" | "onUndo" | "onRedo">) => (
  <>
    {/* i18n-exempt -- PB-2414: editor-only tooltip */}
    <Tooltip text="Undo (Ctrl/⌘+Z)">
      <Button onClick={onUndo} disabled={!canUndo} aria-label="Undo" size="icon">
        <RotateCounterClockwiseIcon className="h-4 w-4" aria-hidden="true" />
      </Button>
    </Tooltip>
    {/* i18n-exempt -- PB-2414: editor-only tooltip */}
    <Tooltip text="Redo (Ctrl/⌘+Y)">
      <Button onClick={onRedo} disabled={!canRedo} aria-label="Redo" size="icon">
        <UpdateIcon className="h-4 w-4" aria-hidden="true" />
      </Button>
    </Tooltip>
  </>
);

const SaveControls = ({ onSave, saving, autoSaveState, saveError }: Pick<Props, "onSave" | "saving" | "autoSaveState" | "saveError">) => (
  <Stack gap={1}>
    <Inline gap={2} alignY="center">
      {/* i18n-exempt -- PB-2414: editor-only tooltip */}
      <Tooltip text="Save (Ctrl/⌘+S)">
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Spinner className="h-4 w-4" /> : (
            // i18n-exempt -- PB-2414: editor-only action label
            "Save"
          )}
        </Button>
      </Tooltip>
      {autoSaveState === "saving" && (
        <Inline gap={1} alignY="center" className="text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />{/* i18n-exempt -- PB-2414: status message */} Saving…
        </Inline>
      )}
      {autoSaveState === "saved" && (
        <Inline gap={1} alignY="center" className="text-sm text-muted-foreground">
          <CheckIcon className="h-4 w-4 text-primary" />{/* i18n-exempt -- PB-2414: status message */} All changes saved
        </Inline>
      )}
    </Inline>
    {saveError && (
      <p className="text-sm text-destructive">{saveError}</p>
    )}
  </Stack>
);

const PublishControls = ({ onPublish, publishing, publishError }: Pick<Props, "onPublish" | "publishing" | "publishError">) => (
  <Stack gap={1}>
    {/* i18n-exempt -- PB-2414: editor-only tooltip */}
    <Tooltip text="Publish page">
      <Button
        variant="default"
        className="h-9 px-4"
        onClick={onPublish}
        disabled={publishing}
        data-tour="publish"
      >
        {publishing ? <Spinner className="h-4 w-4" /> : (
          // i18n-exempt -- PB-2414: editor-only action label
          "Publish"
        )}
      </Button>
    </Tooltip>
    {publishError && (
      <p className="text-sm text-destructive">{publishError}</p>
    )}
  </Stack>
);

const VersionsManageDialog = ({
  isOpen,
  setIsOpen,
  shop,
  pageId,
  currentComponents,
  editor,
  onRestoreVersion,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  shop: string;
  pageId: string;
  currentComponents: PageComponent[];
  editor?: HistoryState["editor"];
  onRestoreVersion: (components: PageComponent[]) => void;
}) => (
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogTrigger asChild>
      {/* i18n-exempt -- PB-2414: editor-only tooltip */}
      <Tooltip text="Manage versions (Ctrl/⌘+Shift+V)">
        <Button variant="outline" onClick={() => setIsOpen(true)}>
          {/* i18n-exempt -- PB-2414: editor-only dialog trigger */}
          Versions
        </Button>
      </Tooltip>
    </DialogTrigger>
    <DialogContent className="w-full">
      {/* i18n-exempt -- PB-2414: editor-only dialog title */}
      <DialogTitle>Versions</DialogTitle>
      <VersionsPanel
        shop={shop}
        pageId={pageId}
        current={currentComponents}
        editor={editor}
        onRestore={onRestoreVersion}
      />
    </DialogContent>
  </Dialog>
);

const VersionsSaveDialog = ({
  isOpen,
  setIsOpen,
  shop,
  pageId,
  currentComponents,
  editor,
  onRestoreVersion,
  lastPublishedComponents,
  onRevertToPublished,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  shop: string;
  pageId: string;
  currentComponents: PageComponent[];
  editor?: HistoryState["editor"];
  onRestoreVersion: (components: PageComponent[]) => void;
  lastPublishedComponents?: PageComponent[];
  onRevertToPublished?: (components: PageComponent[]) => void;
}) => {
  const t = useTranslations();
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {/* i18n-exempt -- PB-2414: editor-only tooltip */}
        <Tooltip text="Save version snapshot (Ctrl/⌘+Shift+S)">
          <Button variant="outline" onClick={() => setIsOpen(true)}>
            {/* i18n-exempt -- PB-2414: editor-only dialog trigger */}
            Save Version
          </Button>
        </Tooltip>
      </DialogTrigger>
      <DialogContent className="w-full">
        {/* i18n-exempt -- PB-2414: editor-only dialog title */}
        <DialogTitle>Save Version</DialogTitle>
        <VersionsPanel
          shop={shop}
          pageId={pageId}
          current={currentComponents}
          editor={editor}
          onRestore={onRestoreVersion}
          autoFocusLabel
        />
        {lastPublishedComponents && onRevertToPublished && (
          <div className="mt-4 space-y-2 rounded border border-border/30 p-3">
            <DialogDescription>
              {t("cms.builder.versions.revert.description")}
            </DialogDescription>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="h-8 px-2 text-xs">
                  {t("cms.builder.versions.revert.button")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("cms.builder.versions.revert.title")}</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onRevertToPublished?.(lastPublishedComponents);
                      setIsOpen(false);
                    }}
                  >
                    {t("cms.builder.versions.revert.confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const HistoryControls = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onPublish,
  saving,
  publishing,
  saveError,
  publishError,
  autoSaveState,
  onRevertToPublished,
  lastPublishedComponents,
  shop,
  pageId,
  currentComponents,
  editor,
  onRestoreVersion,
  showUndoRedo = true,
  showSavePublish = true,
  showVersions = true,
}: Props) => {
  const [isOpenSave, setIsOpenSave] = useState(false);
  const [isOpenManage, setIsOpenManage] = useState(false);

  // Listen for global events to open dialogs
  useEffect(() => {
    const openSave = () => setIsOpenSave(true);
    const openManage = () => setIsOpenManage(true);
    window.addEventListener("pb:save-version", openSave as EventListener);
    window.addEventListener("pb:open-versions", openManage as EventListener);
    return () => {
      window.removeEventListener("pb:save-version", openSave as EventListener);
      window.removeEventListener("pb:open-versions", openManage as EventListener);
    };
  }, []);

  const canShowVersions = showVersions && shop && pageId && currentComponents && onRestoreVersion;

  return (
    <Inline gap={2}>
      {showUndoRedo && <UndoRedoControls canUndo={canUndo} canRedo={canRedo} onUndo={onUndo} onRedo={onRedo} />}
      {showSavePublish && <SaveControls onSave={onSave} saving={saving} autoSaveState={autoSaveState} saveError={saveError} />}
      {showSavePublish && <PublishControls onPublish={onPublish} publishing={publishing} publishError={publishError} />}
      {canShowVersions && (
        <VersionsManageDialog
          isOpen={isOpenManage}
          setIsOpen={setIsOpenManage}
          shop={shop}
          pageId={pageId}
          currentComponents={currentComponents}
          editor={editor}
          onRestoreVersion={onRestoreVersion}
        />
      )}
      {canShowVersions && (
        <VersionsSaveDialog
          isOpen={isOpenSave}
          setIsOpen={setIsOpenSave}
          shop={shop}
          pageId={pageId}
          currentComponents={currentComponents}
          editor={editor}
          onRestoreVersion={onRestoreVersion}
          lastPublishedComponents={lastPublishedComponents}
          onRevertToPublished={onRevertToPublished}
        />
      )}
    </Inline>
  );
};

export default HistoryControls;
