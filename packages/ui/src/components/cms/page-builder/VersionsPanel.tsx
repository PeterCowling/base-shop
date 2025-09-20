"use client";

import { useEffect, useMemo, useState } from "react";
import type { PageComponent, HistoryState } from "@acme/types";
import { Button, Input } from "../../atoms/shadcn";
import PreviewPane from "./PreviewPane";

interface VersionEntry {
  id: string;
  label: string;
  timestamp: string;
  components: PageComponent[];
  editor?: HistoryState["editor"];
}

interface Props {
  shop: string;
  pageId: string;
  current: PageComponent[];
  editor?: HistoryState["editor"];
  onRestore: (components: PageComponent[]) => void;
  autoFocusLabel?: boolean;
}

export default function VersionsPanel({ shop, pageId, current, editor, onRestore, autoFocusLabel = false }: Props) {
  const [versions, setVersions] = useState<VersionEntry[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const selected = useMemo(() => versions?.find((v) => v.id === selectedId) ?? null, [versions, selectedId]);

  const diffSummary = useMemo(() => {
    if (!selected) return null;
    // Flatten trees by id for a cheap diff
    const flat = (list: PageComponent[]): Record<string, PageComponent> => {
      const out: Record<string, PageComponent> = {};
      const walk = (n: PageComponent) => {
        out[n.id] = n;
        const kids = (n as any).children as PageComponent[] | undefined;
        if (Array.isArray(kids)) kids.forEach(walk);
      };
      list.forEach(walk);
      return out;
    };
    const a = flat(current);
    const b = flat(selected.components);
    const aIds = new Set(Object.keys(a));
    const bIds = new Set(Object.keys(b));
    const addedIds: string[] = [];
    const removedIds: string[] = [];
    const modifiedList: { id: string; keys: string[] }[] = [];
    bIds.forEach((id) => { if (!aIds.has(id)) addedIds.push(id); });
    aIds.forEach((id) => { if (!bIds.has(id)) removedIds.push(id); });
    // Modified when present in both but shallow JSON differs (excluding id)
    aIds.forEach((id) => {
      if (!bIds.has(id)) return;
      const aa = a[id] as any;
      const bb = b[id] as any;
      const keys = Array.from(new Set([...Object.keys(aa ?? {}), ...Object.keys(bb ?? {})])).filter((k) => k !== "id");
      const changed = keys.filter((k) => JSON.stringify(aa?.[k]) !== JSON.stringify(bb?.[k]));
      if (changed.length > 0) modifiedList.push({ id, keys: changed });
    });
    return { added: addedIds.length, removed: removedIds.length, modified: modifiedList.length, addedIds, removedIds, modifiedList };
  }, [current, selected]);

  const load = async () => {
    try {
      setError(null);
      const res = await fetch(`/cms/api/page-versions/${shop}/${pageId}`);
      const data = (await res.json()) as VersionEntry[];
      setVersions(data);
      if (data.length && !selectedId) setSelectedId(data[0].id);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop, pageId]);

  const createVersion = async () => {
    if (!label.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/cms/api/page-versions/${shop}/${pageId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), components: current, editor }),
      });
      if (!res.ok) throw new Error(`Failed to save version: ${res.status}`);
      setLabel("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const renameSelected = async () => {
    if (!selectedId || !renameValue.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/cms/api/page-versions/${shop}/${pageId}/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: renameValue.trim() }),
      });
      if (!res.ok) throw new Error(`Failed to rename: ${res.status}`);
      setRenaming(null);
      setRenameValue("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const deleteSelected = async () => {
    if (!selectedId) return;
    if (!window.confirm("Delete selected version?")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/cms/api/page-versions/${shop}/${pageId}/${selectedId}`, {
        method: "DELETE",
      });
      if (!(res.status === 204)) throw new Error(`Failed to delete: ${res.status}`);
      setSelectedId(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
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
        <Button onClick={createVersion} disabled={saving || !label.trim()}>
          {saving ? "Saving…" : "Save Version"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <div className="text-sm font-medium mb-2">Versions</div>
          <div className="max-h-64 overflow-y-auto rounded border">
            {versions?.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedId(v.id)}
                className={`flex w-full items-center justify-between px-2 py-1 text-left text-sm hover:bg-accent ${selectedId === v.id ? "bg-accent" : ""}`}
                aria-label={`Select version ${v.label}`}
              >
                <span className="truncate" title={v.label}>{v.label}</span>
                <time className="ml-2 shrink-0 text-muted-foreground" dateTime={v.timestamp}>
                  {new Date(v.timestamp).toLocaleString()}
                </time>
              </button>
            ))}
            {(!versions || versions.length === 0) && (
              <div className="p-2 text-sm text-muted-foreground">No versions yet</div>
            )}
          </div>
        </div>
        <div className="col-span-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-sm font-medium mb-1">Current</div>
              <PreviewPane components={current} locale="en" deviceId="desktop" onChange={() => {}} editor={editor} />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Selected</div>
              <div className="rounded border min-h-10">
                {selected ? (
                  <PreviewPane components={selected.components} locale="en" deviceId="desktop" onChange={() => {}} editor={selected.editor} />
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">Select a version to preview</div>
                )}
              </div>
            </div>
          </div>
          {selected && diffSummary && (
            <div className="rounded border bg-muted/40 p-2 text-sm text-muted-foreground">
              <span className="font-medium">Changes:</span>
              <span className="ml-2">{diffSummary.modified} modified</span>
              <span className="ml-2">{diffSummary.added} added</span>
              <span className="ml-2">{diffSummary.removed} removed</span>
              {(diffSummary.addedIds?.length ?? 0) > 0 && (
                <div className="mt-1">
                  <span className="font-medium">Added:</span>
                  <span className="ml-1">{diffSummary.addedIds!.slice(0, 5).join(", ")}{diffSummary.addedIds!.length > 5 ? "…" : ""}</span>
                </div>
              )}
              {(diffSummary.removedIds?.length ?? 0) > 0 && (
                <div className="mt-1">
                  <span className="font-medium">Removed:</span>
                  <span className="ml-1">{diffSummary.removedIds!.slice(0, 5).join(", ")}{diffSummary.removedIds!.length > 5 ? "…" : ""}</span>
                </div>
              )}
              {(diffSummary.modifiedList?.length ?? 0) > 0 && (
                <div className="mt-1">
                  <span className="font-medium">Modified:</span>
                  <ul className="ml-2 list-disc">
                    {diffSummary.modifiedList!.slice(0, 5).map((m) => (
                      <li key={m.id}>
                        <span className="mr-1">{m.id}:</span>
                        <span className="opacity-80">{m.keys.slice(0, 6).join(", ")}{m.keys.length > 6 ? "…" : ""}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            {selected && (
              <div className="flex items-center gap-2">
                {renaming === selected.id ? (
                  <>
                    <Input
                      placeholder="New label"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                    />
                    <Button variant="outline" onClick={() => setRenaming(null)}>Cancel</Button>
                    <Button onClick={renameSelected} disabled={!renameValue.trim() || saving}>Save</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => { setRenaming(selected.id); setRenameValue(selected.label); }}>Rename</Button>
                    <Button variant="destructive" onClick={deleteSelected}>Delete</Button>
                  </>
                )}
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => selected && onRestore(selected.components)}
              disabled={!selected}
            >
              Restore Selected
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
