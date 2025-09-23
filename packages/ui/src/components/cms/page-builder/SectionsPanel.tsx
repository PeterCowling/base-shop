"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { PageComponent } from "@acme/types";
import type { SectionTemplate } from "@acme/types/section/template";
import { Button, Input } from "../../atoms/shadcn";
import { ulid } from "ulid";

function cloneWithIds(node: PageComponent): PageComponent {
  const cloned = { ...node, id: ulid() } as any;
  const children = (node as any).children as PageComponent[] | undefined;
  if (Array.isArray(children)) cloned.children = children.map((c) => cloneWithIds(c));
  return cloned as PageComponent;
}

interface Props {
  shop?: string | null;
  onInsert: (component: PageComponent) => void;
  onInsertLinked?: (item: { globalId: string; label: string; component: PageComponent }) => void;
}

export default function SectionsPanel({ shop, onInsert, onInsertLinked }: Props) {
  const [items, setItems] = useState<SectionTemplate[]>([]);
  const [q, setQ] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 24;
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const load = (reset: boolean) => {
    const s = String(shop || "");
    if (!s) return;
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    selectedTags.forEach((t) => params.append("tag", t));
    params.set("page", String(reset ? 1 : page));
    params.set("pageSize", String(pageSize));
    fetch(`/cms/api/sections/${encodeURIComponent(s)}?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        if (!json) return;
        if (Array.isArray(json)) {
          setItems(json as SectionTemplate[]);
          setTotal((json as SectionTemplate[]).length);
          setAllTags([]);
        } else if (json && Array.isArray(json.items)) {
          setItems((prev) => (reset ? (json.items as SectionTemplate[]) : [...prev, ...(json.items as SectionTemplate[])]));
          setTotal(Number(json.total || 0));
          setAllTags(Array.isArray(json.allTags) ? (json.allTags as string[]) : []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Initial load and on shop change
  useEffect(() => {
    setItems([]);
    setPage(1);
    setTotal(0);
    setAllTags([]);
    setSelectedTags([]);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setPage(1);
      setItems([]);
      load(true);
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Reload when tags change
  useEffect(() => {
    setPage(1);
    setItems([]);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTags.join(",")]);

  const hasMore = items.length < total;

  return (
    <aside className="w-[280px] shrink-0" data-cy="pb-sections-panel">
      <div className="flex items-center justify-between gap-2 p-2">
        <div className="text-sm font-semibold">Sections</div>
      </div>
      <div className="p-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" aria-label="Search sections" />
      </div>
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-2">
          {allTags.map((t) => {
            const active = selectedTags.includes(t);
            return (
              <button
                key={t}
                type="button"
                className={[
                  "rounded border px-2 py-1 text-[11px]",
                  active ? "bg-muted" : "bg-transparent",
                ].join(" ")}
                aria-pressed={active}
                onClick={() =>
                  setSelectedTags((prev) =>
                    prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
                  )
                }
                title={active ? `Remove tag filter: ${t}` : `Filter by tag: ${t}`}
              >
                {t}
              </button>
            );
          })}
          {selectedTags.length > 0 && (
            <button
              type="button"
              className="ml-auto text-[11px] text-muted-foreground underline"
              onClick={() => setSelectedTags([])}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
      <div className="flex max-h-[calc(100vh-6rem)] flex-col gap-2 overflow-auto p-2">
        {items.length === 0 && !loading && <div className="p-2 text-sm text-muted-foreground">No sections</div>}
        {items.map((s) => (
          <div key={s.id} className="space-y-1 rounded border p-2">
            <div className="truncate text-sm font-medium">{s.label}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.status}</div>
            {/* Thumbnail preview */}
            {s.thumbnail ? (
              <div className="relative mt-1 aspect-[16/9] overflow-hidden rounded border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.thumbnail} alt="" className="h-full w-full object-cover" aria-hidden />
              </div>
            ) : (
              <div className="mt-1 aspect-[16/9] rounded border bg-muted/40" />
            )}
            {/* Tags */}
            {Array.isArray(s.tags) && s.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {s.tags.map((t) => (
                  <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => onInsert(cloneWithIds(s.template as any))}
              >
                Insert copy
              </Button>
              {onInsertLinked && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  onClick={() => onInsertLinked({ globalId: s.id, label: s.label, component: s.template as any })}
                >
                  Insert linked
                </Button>
              )}
            </div>
          </div>
        ))}
        {(loading || hasMore) && (
          <div className="p-2">
            <Button
              type="button"
              variant="outline"
              className="h-7 px-2 text-xs w-full"
              disabled={loading}
              onClick={() => {
                if (loading) return;
                setPage((p) => p + 1);
                load(false);
              }}
            >
              {loading ? "Loading…" : hasMore ? "Load more" : "Loaded"}
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
