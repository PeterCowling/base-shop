"use client";

import { useState } from "react";
import { Button, Input } from "../../../atoms/shadcn";
import type { VersionEntry } from "./api";

interface Props {
  selected: VersionEntry | null;
  onRename: (newLabel: string) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}

const RenameDeleteControls = ({ selected, onRename, onDelete }: Props) => {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [busy, setBusy] = useState(false);

  if (!selected) return null;

  const startRename = () => {
    setRenaming(selected.id);
    setRenameValue(selected.label);
  };

  const doRename = async () => {
    if (!renameValue.trim()) return;
    setBusy(true);
    try {
      await onRename(renameValue.trim());
      setRenaming(null);
      setRenameValue("");
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await onDelete();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {renaming === selected.id ? (
        <>
          <Input
            placeholder="New label"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
          />
          <Button variant="outline" onClick={() => setRenaming(null)}>Cancel</Button>
          <Button onClick={doRename} disabled={!renameValue.trim() || busy}>Save</Button>
        </>
      ) : (
        <>
          <Button variant="outline" onClick={startRename}>Rename</Button>
          <Button variant="destructive" onClick={doDelete} disabled={busy}>Delete</Button>
        </>
      )}
    </div>
  );
};

export default RenameDeleteControls;

