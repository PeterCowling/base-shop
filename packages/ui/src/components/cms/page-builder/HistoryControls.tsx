"use client";

import { Button } from "../../atoms/shadcn";
import { Spinner } from "../../atoms";
import { CheckIcon } from "@radix-ui/react-icons";

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
}: Props) => (
  <div className="flex gap-2">
    <Button onClick={onUndo} disabled={!canUndo}>
      Undo
    </Button>
    <Button onClick={onRedo} disabled={!canRedo}>
      Redo
    </Button>
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Spinner className="h-4 w-4" /> : "Save"}
        </Button>
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
      <Button
        variant="outline"
        onClick={onPublish}
        disabled={publishing}
        data-tour="publish"
      >
        {publishing ? <Spinner className="h-4 w-4" /> : "Publish"}
      </Button>
      {publishError && (
        <p className="text-sm text-red-500">{publishError}</p>
      )}
    </div>
  </div>
);

export default HistoryControls;

