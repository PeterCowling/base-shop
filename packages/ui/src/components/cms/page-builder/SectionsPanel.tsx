"use client";

import React, { useEffect, useRef, useState } from "react";
import type { PageComponent } from "@acme/types";
import type { SectionTemplate } from "@acme/types/section/template";
import { Button, Input } from "../../atoms/shadcn";
import { ulid } from "ulid";
import { builtInSections } from "./builtInSections.data";
import { getPalettePreview } from "./previewImages";
import Image from "next/image";
import { useTranslations } from "@acme/i18n";
import { Grid as DSGrid } from "../../atoms/primitives/Grid";
import { Stack as DSStack } from "../../atoms/primitives/Stack";
import { Inline as DSInline } from "../../atoms/primitives/Inline";

function cloneWithIds(node: PageComponent): PageComponent {
  const base = node as unknown as Record<string, unknown>;
  const cloned = { ...base, id: ulid() } as unknown as PageComponent;
  const children = base["children"];
  if (Array.isArray(children)) {
    (cloned as unknown as { children: PageComponent[] }).children = (children as PageComponent[]).map((c) => cloneWithIds(c));
  }
  return cloned;
}

interface Props {
  shop?: string | null;
  onInsert: (component: PageComponent) => void;
  onInsertLinked?: (item: { globalId: string; label: string; component: PageComponent }) => void;
}

export default function SectionsPanel({ shop, onInsert, onInsertLinked }: Props) {
  const t = useTranslations();
  const [items, setItems] = useState<SectionTemplate[]>([]);
  const [q, setQ] = useState("");
  // Tag chips replaced by built-in section groups; keep state for compatibility but unused
  const [_allTags, setAllTags] = useState<string[]>([]);
  const [_selectedTags, setSelectedTags] = useState<string[]>([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- PB-123 keep stable deps; controlled by "shop"
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- PB-123 debounce on query change only
  }, [q]);

  // Tags UI removed; no reload by tag filters

  const hasMore = items.length < total;

  return (
    // i18n-exempt — data-cy attribute only
    <aside className="w-full shrink-0" data-cy="pb-sections-panel">
      <div className="flex items-center justify-between gap-2 p-2">
        <div className="text-sm font-semibold">{t("Sections")}</div>
      </div>
      <div className="p-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search…") as string} aria-label={t("Search sections") as string} />
      </div>
      {/* Demo presets area (simple flow) */}
      <div className="px-2 pb-2">
        <div className="mb-1 text-xs font-semibold text-muted-foreground">{t("Demo Presets")}</div>
        <DSInline gap={1} className="flex-wrap">
          {/* i18n-exempt */}
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs min-h-10 min-w-10"
            onClick={() => onInsert(cloneWithIds({ id: ulid(), type: "Section", children: [{ id: ulid(), type: "Text", text: t("Preset: Title + Button") }, { id: ulid(), type: "Button", label: t("CTA"), href: "/shop" }] } as unknown as PageComponent))}
          >
            {t("Title + CTA")}
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs min-h-10 min-w-10"
            onClick={() => onInsert(cloneWithIds({ id: ulid(), type: "Section", children: [{ id: ulid(), type: "Image", src: "/hero/slide-1.jpg", alt: "" }] } as unknown as PageComponent))}
          >
            {t("Image Hero")}
          </button>
        </DSInline>
      </div>
      {/* Built-in section groups (replaces tag chips) */}
      <div className="px-2 pb-2">
        <div className="mb-1 text-xs font-semibold text-muted-foreground">{t("Built-in Sections")}</div>
        {(() => {
          const groups: Record<string, typeof builtInSections> = {};
          for (const s of builtInSections) {
            const key = s.previewType.startsWith("HeaderSection")
              ? String(t("Headers"))
              : s.previewType.startsWith("FooterSection")
                ? String(t("Footers"))
                : String(t("Essentials"));
            (groups[key] ||= []).push(s);
          }
          const order = [String(t("Headers")), String(t("Footers")), String(t("Essentials"))] as const;
          return order
            .filter((k) => Array.isArray(groups[k]) && groups[k]!.length > 0)
            .map((k) => (
              <div key={k} className="mb-2">
                <div className="mb-1 text-xs font-medium text-muted-foreground">{k}</div>
                <DSGrid cols={1} gap={2}>
                  {groups[k]!.map((p) => {
                    const resolvedPreview = p.preview === "/window.svg" ? getPalettePreview(p.previewType) : p.preview;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className="rounded border p-1 text-start hover:bg-muted min-h-10 min-w-10"
                        title={p.label}
                        onClick={() => onInsert(cloneWithIds(p.build()))}
                      >
                        <div className="relative w-full aspect-video">
                          <Image src={resolvedPreview} alt="" fill className="rounded border bg-muted object-cover" aria-hidden />
                        </div>
                        <div className="mt-1 truncate text-xs" title={p.label}>{p.label}</div>
                        {p.description && <div className="truncate text-xs text-muted-foreground" title={p.description}>{p.description}</div>}
                      </button>
                    );
                  })}
                </DSGrid>
              </div>
            ));
        })()}
      </div>
      <DSStack gap={2} className="max-h-[calc(100svh-6rem)] overflow-auto p-2">
        {items.length === 0 && !loading && <div className="p-2 text-sm text-muted-foreground">{t("No sections")}</div>}
        {items.map((s) => (
          <div key={s.id} className="space-y-1 rounded border p-2">
            <div className="truncate text-sm font-medium">{s.label}</div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.status}</div>
            {/* Thumbnail preview */}
            {s.thumbnail ? (
              <div className="relative mt-1 aspect-video overflow-hidden rounded border bg-muted">
                <Image src={s.thumbnail} alt="" fill className="object-cover" aria-hidden data-aspect="16/9" />
              </div>
            ) : (
              <div className="mt-1 aspect-video rounded border bg-muted/40" />
            )}
            {/* Tags */}
            {Array.isArray(s.tags) && s.tags.length > 0 && (
              <DSInline className="mt-1" gap={1}>
                {s.tags.map((t) => (
                  <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {t}
                  </span>
                ))}
              </DSInline>
            )}
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="min-h-10 min-w-10 px-2 text-xs"
                onClick={() => onInsert(cloneWithIds(s.template))}
              >
                {t("Insert copy")}
              </Button>
              {onInsertLinked && (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-10 min-w-10 px-2 text-xs"
                  onClick={() => onInsertLinked({ globalId: s.id, label: s.label, component: s.template })}
                >
                  {t("Insert linked")}
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
              className="min-h-10 px-2 text-xs w-full"
              disabled={loading}
              onClick={() => {
                if (loading) return;
                setPage((p) => p + 1);
                load(false);
              }}
            >
              {loading ? t("Loading…") : hasMore ? t("Load more") : t("Loaded")}
            </Button>
          </div>
        )}
      </DSStack>
    </aside>
  );
}
