"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { PageComponent } from "@acme/types";
import type { SectionTemplate } from "@acme/types/section/template";
import { Button, Input } from "../../atoms/shadcn";
import { ulid } from "ulid";
import { getBuiltInSections } from "./builtInSections.data";
import { getPalettePreview } from "./previewImages";
import Image from "next/image";
import { useTranslations } from "@acme/i18n";
import { Grid as DSGrid } from "../../atoms/primitives/Grid";
import { Stack as DSStack } from "../../atoms/primitives/Stack";
import { Inline as DSInline } from "../../atoms/primitives/Inline";
import type { ComponentType } from "./defaults";

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
  allowedTypes?: Set<ComponentType>;
}

const DATA_CY_SECTIONS_PANEL = "pb-sections-panel";

function collectTypes(node: PageComponent): Set<ComponentType> {
  const types = new Set<ComponentType>();
  const walk = (n: PageComponent) => {
    const t = (n as { type?: string }).type;
    if (t) types.add(t as ComponentType);
    const children = (n as { children?: PageComponent[] }).children;
    if (Array.isArray(children)) children.forEach(walk);
  };
  walk(node);
  return types;
}

const isAllowedTemplate = (component: PageComponent, allowedTypes?: Set<ComponentType>): boolean => {
  if (!allowedTypes) return true;
  const types = collectTypes(component);
  for (const t of types) {
    if (!allowedTypes.has(t)) return false;
  }
  return true;
};

export default function SectionsPanel({ shop, onInsert, onInsertLinked, allowedTypes }: Props) {
  const t = useTranslations();
  const builtInSections = useMemo(
    () => getBuiltInSections(((k: string) => t(k) as string)),
    [t],
  );
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
    <aside className="w-full shrink-0" data-cy={DATA_CY_SECTIONS_PANEL}>
      <div className="flex items-center justify-between gap-2 p-2">
        <div className="text-sm font-semibold">{t("cms.builder.sections.title")}</div>
      </div>
      <div className="p-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("cms.builder.sections.search.placeholder") as string} aria-label={t("cms.builder.sections.search.aria") as string} />
      </div>
      {/* Demo presets area (simple flow) */}
      <div className="px-2 pb-2">
        <div className="mb-1 text-xs font-semibold text-muted-foreground">{t("cms.builder.sections.demoPresets")}</div>
        <DSInline gap={1} className="flex-wrap">
          {/* i18n-exempt */}
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs min-h-10 min-w-10"
            onClick={() => onInsert(cloneWithIds({ id: ulid(), type: "Section", children: [{ id: ulid(), type: "Text", text: t("cms.builder.sections.presets.titlePlusButton.text") }, { id: ulid(), type: "Button", label: t("cms.builder.cta"), href: "/shop" }] } as unknown as PageComponent))}
          >
            {t("cms.builder.sections.presets.titleCta")}
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs min-h-10 min-w-10"
            onClick={() => onInsert(cloneWithIds({ id: ulid(), type: "Section", children: [{ id: ulid(), type: "Image", src: "/hero/slide-1.jpg", alt: "" }] } as unknown as PageComponent))}
          >
            {t("cms.builder.sections.presets.imageHero")}
          </button>
        </DSInline>
      </div>
      {/* Built-in section groups (replaces tag chips) */}
      <div className="px-2 pb-2">
        <div className="mb-1 text-xs font-semibold text-muted-foreground">{t("cms.builder.sections.builtin")}</div>
        {(() => {
          const groups: Record<string, typeof builtInSections> = {};
          for (const s of builtInSections) {
            if (!isAllowedTemplate(s.build(), allowedTypes)) continue;
            const key = s.previewType.startsWith("HeaderSection")
              ? String(t("cms.builder.sections.groups.headers"))
              : s.previewType.startsWith("FooterSection")
                ? String(t("cms.builder.sections.groups.footers"))
                : String(t("cms.builder.sections.groups.essentials"));
            (groups[key] ||= []).push(s);
          }
          const order = [String(t("cms.builder.sections.groups.headers")), String(t("cms.builder.sections.groups.footers")), String(t("cms.builder.sections.groups.essentials"))] as const;
          return order
            .filter((k) => Array.isArray(groups[k]) && groups[k]!.length > 0)
            .map((k) => (
              <div key={k} className="mb-2">
                <div className="mb-1 text-xs font-medium text-muted-foreground">{k}</div>
                <DSGrid cols={1} gap={2}>
                  {groups[k]!.map((p) => {
                    const resolvedPreview = p.preview === "/window.svg" ? getPalettePreview(p.previewType) : p.preview;
                    const labelNode = p.labelKey ? t(p.labelKey) : (p.label ?? "");
                    const descNode = p.descriptionKey ? t(p.descriptionKey) : (p.description ?? "");
                    const titleText = String(p.labelKey ? t(p.labelKey) : (p.label ?? ""));
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className="rounded border p-1 text-start hover:bg-muted min-h-10 min-w-10"
                        title={titleText}
                        onClick={() => {
                          const candidate = cloneWithIds(p.build());
                          if (!isAllowedTemplate(candidate, allowedTypes)) return;
                          onInsert(candidate);
                        }}
                      >
                        <div className="relative w-full aspect-video">
                          <Image src={resolvedPreview} alt="" fill className="rounded border bg-muted object-cover" aria-hidden />
                        </div>
                        <div className="mt-1 truncate text-xs" title={titleText}>{labelNode}</div>
                        {Boolean(p.descriptionKey || p.description) && (
                          <div className="truncate text-xs text-muted-foreground" title={String(descNode)}>{descNode}</div>
                        )}
                      </button>
                    );
                  })}
                </DSGrid>
              </div>
            ));
        })()}
      </div>
      <DSStack gap={2} className="overflow-auto p-2" style={{ maxHeight: "calc(100svh - 6rem)" }}>
        {items.length === 0 && !loading && <div className="p-2 text-sm text-muted-foreground">{t("cms.builder.sections.none")}</div>}
        {items
          .filter((s) => isAllowedTemplate(s.template as unknown as PageComponent, allowedTypes))
          .map((s) => (
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
                onClick={() => {
                  const candidate = cloneWithIds(s.template);
                  if (!isAllowedTemplate(candidate, allowedTypes)) return;
                  onInsert(candidate);
                }}
              >
                {t("cms.builder.sections.insertCopy")}
              </Button>
              {onInsertLinked && (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-10 min-w-10 px-2 text-xs"
                  onClick={() => {
                    const candidate = cloneWithIds(s.template);
                    if (!isAllowedTemplate(candidate, allowedTypes)) return;
                    onInsertLinked({ globalId: s.id, label: s.label, component: candidate });
                  }}
                >
                  {t("cms.builder.sections.insertLinked")}
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
              {loading ? t("cms.builder.loading") : hasMore ? t("cms.builder.loadMore") : t("cms.builder.loaded")}
            </Button>
          </div>
        )}
      </DSStack>
    </aside>
  );
}
