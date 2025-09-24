"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { PageComponent } from "@acme/types";
import type { SectionTemplate } from "@acme/types/section/template";
import { Button, Input } from "../../atoms/shadcn";
import { ulid } from "ulid";
import { builtInSections } from "./builtInSections.data";
import { getPalettePreview } from "./previewImages";

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
  // Tag chips replaced by built-in section groups; keep state for compatibility but unused
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  // Increased page size to better handle larger section sets
  const pageSize = 100;
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
    // No tag chips UI — do not append tag filters
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

  // Tags UI removed; no reload by tag filters

  const hasMore = items.length < total;

  return (
    <aside className="w-full shrink-0" data-cy="pb-sections-panel">
      <div className="flex items-center justify-between gap-2 p-2">
        <div className="text-sm font-semibold">Sections</div>
      </div>
      <div className="p-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" aria-label="Search sections" />
      </div>
      {/* Demo presets area (simple flow) */}
      <div className="px-2 pb-2">
        <div className="mb-1 text-xs font-semibold text-muted-foreground">Demo Presets</div>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className="rounded border px-2 py-1 text-[11px]"
            onClick={() => onInsert(cloneWithIds({ id: ulid(), type: "Section", children: [{ id: ulid(), type: "Text", text: "Preset: Title + Button" }, { id: ulid(), type: "Button", label: "CTA", href: "/shop" }] } as any))}
          >
            Title + CTA
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1 text-[11px]"
            onClick={() => onInsert(cloneWithIds({ id: ulid(), type: "Section", children: [{ id: ulid(), type: "Image", src: "/hero/slide-1.jpg", alt: "" }] } as any))}
          >
            Image Hero
          </button>
        </div>
      </div>
      {/* Built-in section groups (replaces tag chips) */}
      <div className="px-2 pb-2">
        <div className="mb-1 text-xs font-semibold text-muted-foreground">Built-in Sections</div>
        {(() => {
          const groups: Record<string, typeof builtInSections> = {};
          for (const s of builtInSections) {
            const key = s.previewType.startsWith("HeaderSection")
              ? "Headers"
              : s.previewType.startsWith("FooterSection")
                ? "Footers"
                : "Essentials";
            (groups[key] ||= []).push(s);
          }
          const order = ["Headers", "Footers", "Essentials"] as const;
          return order
            .filter((k) => Array.isArray(groups[k]) && groups[k]!.length > 0)
            .map((k) => (
              <div key={k} className="mb-2">
                <div className="mb-1 text-[11px] font-medium text-muted-foreground">{k}</div>
                <div className="grid grid-cols-1 gap-2">
                  {groups[k]!.map((p) => {
                    const resolvedPreview = p.preview === "/window.svg" ? getPalettePreview(p.previewType) : p.preview;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className="rounded border p-1 text-left hover:bg-muted"
                        title={p.label}
                        onClick={() => onInsert(cloneWithIds(p.build() as any))}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={resolvedPreview} alt="" className="aspect-[16/9] w-full rounded border bg-muted" aria-hidden />
                        <div className="mt-1 truncate text-[12px]" title={p.label}>{p.label}</div>
                        {p.description && <div className="truncate text-[11px] text-muted-foreground" title={p.description}>{p.description}</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ));
        })()}
      </div>
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
