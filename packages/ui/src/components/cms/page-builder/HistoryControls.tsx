"use client";

import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger } from "../../atoms/shadcn";
import { Tooltip } from "../../atoms";
import { useEffect, useState } from "react";
import { Spinner } from "../../atoms";
import { CheckIcon } from "@radix-ui/react-icons";
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
  <div className="flex gap-2">
    <Tooltip text="Undo (Ctrl/⌘+Z)">
      <Button onClick={onUndo} disabled={!canUndo}>
        Undo
      </Button>
    </Tooltip>
    <Tooltip text="Redo (Ctrl/⌘+Y)">
      <Button onClick={onRedo} disabled={!canRedo}>
        Redo
      </Button>
    </Tooltip>
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Tooltip text="Save (Ctrl/⌘+S)">
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Spinner className="h-4 w-4" /> : "Save"}
          </Button>
        </Tooltip>
        {autoSaveState === "saving" && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Saving…
          </div>
        )}
        {autoSaveState === "saved" && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <CheckIcon className="h-4 w-4 text-green-500" /> All changes saved
          </div>
        )}
      </div>
      {saveError && (
        <p className="text-sm text-red-500">{saveError}</p>
      )}
    </div>
    <div className="flex flex-col gap-1">
      <Tooltip text="Publish page">
        <Button
          variant="default"
          className="h-9 px-4"
          onClick={onPublish}
          disabled={publishing}
          data-tour="publish"
        >
          {publishing ? <Spinner className="h-4 w-4" /> : "Publish"}
        </Button>
      </Tooltip>
      {publishError && (
        <p className="text-sm text-red-500">{publishError}</p>
      )}
    </div>
    {shop && pageId && currentComponents && onRestoreVersion && (
      <Dialog open={isOpenManage} onOpenChange={setIsOpenManage}>
        <DialogTrigger asChild>
          <Tooltip text="Manage versions (Ctrl/⌘+Shift+V)">
            <Button variant="outline" onClick={() => setIsOpenManage(true)}>Versions</Button>
          </Tooltip>
        </DialogTrigger>
        <DialogContent className="max-w-5xl">
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
    {shop && pageId && currentComponents && onRestoreVersion && (
      <Dialog open={isOpenSave} onOpenChange={setIsOpenSave}>
        <DialogTrigger asChild>
          <Tooltip text="Save version snapshot (Ctrl/⌘+Shift+S)">
            <Button variant="outline" onClick={() => setIsOpenSave(true)}>Save Version</Button>
          </Tooltip>
        </DialogTrigger>
        <DialogContent className="max-w-5xl">
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
  </div>
)};

export default HistoryControls;
