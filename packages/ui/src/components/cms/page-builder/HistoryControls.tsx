"use client";

import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger } from "../../atoms/shadcn";
import { Tooltip } from "../../atoms";
import { Inline, Stack } from "../../atoms/primitives";
import { useEffect, useState } from "react";
import { Spinner } from "../../atoms";
import { CheckIcon, RotateCounterClockwiseIcon, UpdateIcon } from "@radix-ui/react-icons";
import VersionsPanel from "./VersionsPanel";
import type { PageComponent, HistoryState } from "@acme/types";

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
  return (
    <Inline gap={2}>
      {showUndoRedo && (
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
      )}
      {showSavePublish && (
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
                <CheckIcon className="h-4 w-4 text-green-500" />{/* i18n-exempt -- PB-2414: status message */} All changes saved
              </Inline>
            )}
          </Inline>
          {saveError && (
            <p className="text-sm text-red-500">{saveError}</p>
          )}
        </Stack>
      )}
      {showSavePublish && (
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
            <p className="text-sm text-red-500">{publishError}</p>
          )}
        </Stack>
      )}
      {showVersions && shop && pageId && currentComponents && onRestoreVersion && (
        <Dialog open={isOpenManage} onOpenChange={setIsOpenManage}>
          <DialogTrigger asChild>
            {/* i18n-exempt -- PB-2414: editor-only tooltip */}
            <Tooltip text="Manage versions (Ctrl/⌘+Shift+V)">
              <Button variant="outline" onClick={() => setIsOpenManage(true)}>
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
      )}
      {showVersions && shop && pageId && currentComponents && onRestoreVersion && (
        <Dialog open={isOpenSave} onOpenChange={setIsOpenSave}>
          <DialogTrigger asChild>
            {/* i18n-exempt -- PB-2414: editor-only tooltip */}
            <Tooltip text="Save version snapshot (Ctrl/⌘+Shift+S)">
              <Button variant="outline" onClick={() => setIsOpenSave(true)}>
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
          </DialogContent>
        </Dialog>
      )}
    </Inline>
  );
};

export default HistoryControls;
