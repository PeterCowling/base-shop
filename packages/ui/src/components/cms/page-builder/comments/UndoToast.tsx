"use client";

import { Button } from "../../../atoms/shadcn";
import type { Thread } from "./types";

export function UndoToast({ lastDeleted, onRestore, onDismiss }: {
  lastDeleted: Thread | null;
  onRestore: () => void | Promise<void>;
  onDismiss: () => void;
}) {
  if (!lastDeleted) return null;
  return (
    <div className="pointer-events-auto fixed bottom-3 end-3 z-[70] flex items-center gap-3 rounded border bg-background px-3 py-2 shadow">
      <span className="text-sm">Thread deleted</span>
      <Button variant="outline" className="h-7 px-2 text-xs" onClick={() => void onRestore()}>
        Restore
      </Button>
      <Button variant="ghost" className="h-7 px-2 text-xs" onClick={onDismiss}>
        Dismiss
      </Button>
    </div>
  );
}

export default UndoToast;
