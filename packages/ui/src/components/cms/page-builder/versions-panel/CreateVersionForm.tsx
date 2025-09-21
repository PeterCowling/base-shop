"use client";

import { useState } from "react";
import { Button, Input } from "../../../atoms/shadcn";

interface Props {
  onCreate: (label: string) => Promise<void> | void;
  autoFocusLabel?: boolean;
}

const CreateVersionForm = ({ onCreate, autoFocusLabel = false }: Props) => {
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!label.trim()) return;
    setSaving(true);
    try {
      await onCreate(label.trim());
      setLabel("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <label className="text-sm font-medium">Create version</label>
        <Input
          placeholder="Label (e.g. hero color tweak)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          autoFocus={autoFocusLabel}
        />
      </div>
      <Button onClick={submit} disabled={saving || !label.trim()}>
        {saving ? "Saving…" : "Save Version"}
      </Button>
    </div>
  );
};

export default CreateVersionForm;
