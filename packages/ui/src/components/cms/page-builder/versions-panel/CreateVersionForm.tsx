// i18n-exempt -- Next.js directive literal (not user-facing copy)
"use client";

import { useEffect, useRef, useState } from "react";
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

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocusLabel) return;
    // Programmatic focus avoids the a11y anti-pattern of autoFocus on mount
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [autoFocusLabel]);

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <label className="text-sm font-medium">Create version{/* i18n-exempt -- PB-1023: internal editor copy */}</label>
        <Input
          placeholder="Label (e.g. hero color tweak)" /* i18n-exempt -- PB-1023: internal editor copy */
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          ref={inputRef}
        />
      </div>
      <Button onClick={submit} disabled={saving || !label.trim()}>
        {saving ? "Saving…" : "Save Version"}{/* i18n-exempt -- PB-1023: internal editor copy */}
      </Button>
    </div>
  );
};

export default CreateVersionForm;
