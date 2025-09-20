"use client";

import { useMemo, useState } from "react";
import { Button, DialogContent, DialogHeader, DialogTitle, Input } from "../../../atoms/shadcn";

export type Breakpoint = { id: string; label: string; min?: number; max?: number };

interface Props {
  breakpoints: Breakpoint[];
  onChange: (list: Breakpoint[]) => void;
}

export default function BreakpointsPanel({ breakpoints, onChange }: Props) {
  const [list, setList] = useState<Breakpoint[]>(() => [...breakpoints]);
  const [draft, setDraft] = useState<{ label: string; min: string; max: string }>({ label: "", min: "", max: "" });

  const add = () => {
    const label = draft.label.trim();
    if (!label) return;
    const min = draft.min ? Math.max(0, parseInt(draft.min, 10) || 0) : undefined;
    const max = draft.max ? Math.max(0, parseInt(draft.max, 10) || 0) : undefined;
    const base = label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    let id = base || `bp-${Date.now()}`;
    let i = 1;
    const ids = new Set(list.map((b) => b.id));
    while (ids.has(id)) id = `${base}-${i++}`;
    setList((prev) => [...prev, { id, label, min, max }]);
    setDraft({ label: "", min: "", max: "" });
  };

  const remove = (id: string) => setList((prev) => prev.filter((b) => b.id !== id));
  const save = () => onChange(list);

  const summary = useMemo(() => (list.length ? `${list.length} breakpoint${list.length === 1 ? "" : "s"}` : "None"), [list]);

  return (
    <DialogContent className="space-y-3">
      <DialogHeader>
        <DialogTitle>Custom Breakpoints</DialogTitle>
      </DialogHeader>
      <div className="text-sm text-muted-foreground">Define additional responsive ranges. These complement the default Desktop/Tablet/Mobile presets.</div>
      <div className="rounded border p-2">
        <div className="mb-2 text-xs font-semibold text-muted-foreground">Current ({summary})</div>
        <ul className="max-h-64 space-y-1 overflow-auto">
          {list.length === 0 && (
            <li className="text-sm text-muted-foreground">No custom breakpoints</li>
          )}
          {list.map((bp) => (
            <li key={bp.id} className="flex items-center justify-between rounded border p-2 text-sm">
              <div className="truncate">
                <span className="font-medium">{bp.label}</span>
                <span className="text-muted-foreground"> — {bp.min ? `${bp.min}px` : ""}{bp.min && bp.max ? " to " : ""}{bp.max ? `${bp.max}px` : (bp.min ? "+" : "")}</span>
              </div>
              <Button type="button" variant="outline" className="h-7 px-2 text-xs" onClick={() => remove(bp.id)}>Delete</Button>
            </li>
          ))}
        </ul>
        <div className="mt-3 grid grid-cols-4 gap-2">
          <Input placeholder="Label" value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} />
          <Input placeholder="Min px" type="number" value={draft.min} onChange={(e) => setDraft((d) => ({ ...d, min: e.target.value }))} />
          <Input placeholder="Max px" type="number" value={draft.max} onChange={(e) => setDraft((d) => ({ ...d, max: e.target.value }))} />
          <Button type="button" variant="outline" onClick={add}>Add</Button>
        </div>
        <div className="mt-3 flex justify-end">
          <Button type="button" variant="outline" onClick={save}>Save</Button>
        </div>
      </div>
    </DialogContent>
  );
}
