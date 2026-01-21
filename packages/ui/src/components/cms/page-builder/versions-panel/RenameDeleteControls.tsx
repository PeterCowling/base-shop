"use client";

import { useState } from "react";

import { Inline } from "../../../atoms/primitives/Inline";
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
    <Inline gap={2} alignY="center">
      {renaming === selected.id ? (
        <>
          <Input
            placeholder="New label" /* i18n-exempt -- PB-1023 */
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
          />
          <Button variant="outline" onClick={() => setRenaming(null)}>Cancel{/* i18n-exempt -- PB-1023 */}</Button>
          <Button onClick={doRename} disabled={!renameValue.trim() || busy}>Save{/* i18n-exempt -- PB-1023 */}</Button>
        </>
      ) : (
        <>
          <Button variant="outline" onClick={startRename}>Rename{/* i18n-exempt -- PB-1023 */}</Button>
          <Button variant="destructive" onClick={doDelete} disabled={busy}>Delete{/* i18n-exempt -- PB-1023 */}</Button>
        </>
      )}
    </Inline>
  );
};

export default RenameDeleteControls;
