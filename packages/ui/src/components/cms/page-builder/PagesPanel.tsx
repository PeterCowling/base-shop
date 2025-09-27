"use client";
// i18n-exempt — editor-only Pages panel; copy pending i18n wiring

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Drawer, DrawerContent, DrawerTitle, DrawerPortal } from "../../atoms/primitives/drawer";
import { Button, Input, Textarea, Checkbox, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../atoms/shadcn";
import { OverlayScrim } from "../../atoms";
import { Sidebar } from "../../atoms/primitives/Sidebar";
import { Cluster } from "../../atoms/primitives/Cluster";
import { Stack } from "../../atoms/primitives/Stack";
import type { CheckedState } from "@radix-ui/react-checkbox";

type PageItem = {
  id: string;
  slug: string;
  title?: string;
  seo?: {
    title?: Record<string, string>;
    description?: Record<string, string>;
    image?: string;
    noindex?: boolean;
  };
  visibility?: "public" | "hidden";
  updatedAt?: string;
};

function deriveShopFromPath(): string | undefined {
  try {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const parts = path.split("/").filter(Boolean);
    const i = parts.findIndex((p) => p === "shop");
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
  } catch {}
  return undefined;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function PagesPanel({ open, onOpenChange, shop: shopProp = null }: { open: boolean; onOpenChange: (v: boolean) => void; shop?: string | null }) {
  const shop = useMemo(() => shopProp ?? deriveShopFromPath() ?? "", [shopProp]);
  const [q, setQ] = useState("");
  const [pages, setPages] = useState<PageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [orderDirty, setOrderDirty] = useState(false);

  // Load pages list (best-effort) when opening
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await fetch(`/cms/api/pages/${shop}`);
        if (res.ok) {
          const list = (await res.json()) as unknown[];
          // Normalize to PageItem shape
          const items: PageItem[] = list.map((p) => {
            const raw = p as Record<string, unknown>;
            const rawSeo = (raw["seo"] as Record<string, unknown> | undefined) ?? {};
            const img = typeof rawSeo["image"] === "string"
              ? (rawSeo["image"] as string)
              : ((rawSeo["image"] as Record<string, unknown> | undefined)?.["url"] as string | undefined) ?? "";
            const seo = { ...rawSeo, image: img } as PageItem["seo"];
            return {
              id: String((raw["id"] ?? raw["slug"] ?? uid()) as string),
              slug: String((raw["slug"] ?? raw["path"] ?? "") as string),
              title: raw["title"] as string | undefined,
              seo,
              visibility: raw["visibility"] as PageItem["visibility"] | undefined,
              updatedAt: raw["updatedAt"] as string | undefined,
            } satisfies PageItem;
          });
          setPages(items);
          if (!selectedId && items.length) setSelectedId(items[0].id);
          return;
        }
      } catch {}
      setPages([]);
    })();
  }, [open, shop, selectedId]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return pages;
    return pages.filter((p) => (p.title || "").toLowerCase().includes(query) || (p.slug || "").toLowerCase().includes(query));
  }, [pages, q]);

  const selected = useMemo(() => pages.find((p) => p.id === selectedId) || null, [pages, selectedId]);

  const updateSelected = (patch: Partial<PageItem>) => {
    if (!selected) return;
    setPages((prev) => prev.map((p) => (p.id === selected.id ? { ...p, ...patch } : p)));
  };

  const move = (id: string, dir: -1 | 1) => {
    setPages((prev) => {
      const i = prev.findIndex((p) => p.id === id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      const [item] = next.splice(i, 1);
      next.splice(j, 0, item);
      // Mark order as changed; user commits with Save Order
      setOrderDirty(true);
      return next;
    });
  };

  const saveOrder = async () => {
    try {
      const ids = pages.map((p) => p.id);
      const res = await fetch(`/cms/api/pages/${shop}/order`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (res.ok || res.status === 204) {
        setOrderDirty(false);
        try { window.dispatchEvent(new CustomEvent('pb:notify', { detail: { type: 'success', title: /* i18n-exempt */ 'Order saved' } })); } catch {}
      } else {
        try { window.dispatchEvent(new CustomEvent('pb:notify', { detail: { type: 'error', title: /* i18n-exempt */ 'Reorder failed' } })); } catch {}
      }
    } catch {
      try { window.dispatchEvent(new CustomEvent('pb:notify', { detail: { type: 'error', title: /* i18n-exempt */ 'Reorder failed' } })); } catch {}
    }
  };

  const addPage = async () => {
    const n = pages.length + 1;
    const title = `Untitled ${n}`;
    try {
      const res = await fetch(`/cms/api/pages/${shop}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, locale: "en" }),
      });
      if (res.ok) {
        const p: PageItem = await res.json();
        setPages((prev) => [...prev, p]);
        setSelectedId(p.id);
        try { window.dispatchEvent(new CustomEvent('pb:notify', { detail: { type: 'info', title: /* i18n-exempt */ 'Draft page created' } })); } catch {}
        return;
      }
    } catch {}
    // Fallback local add
    const item: PageItem = { id: uid(), slug: `untitled-${n}`, title, seo: { title: { en: title } }, visibility: "hidden" };
    setPages((prev) => [...prev, item]);
    setSelectedId(item.id);
  };

  const saveDraft = async () => {
    const sel = selected;
    if (!sel) return;
    try {
      const body = {
        updatedAt: sel.updatedAt || new Date().toISOString(),
        slug: sel.slug,
        visibility: sel.visibility ?? "public",
        seo: {
          title: sel.seo?.title || { en: sel.title || sel.slug },
          description: sel.seo?.description || {},
          noindex: !!sel.seo?.noindex,
        },
      };
      const res = await fetch(`/cms/api/pages/${shop}/${sel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const p: PageItem = await res.json();
        setPages((prev) => prev.map((it) => (it.id === p.id ? { ...it, ...p } : it)));
        setSelectedId(p.id);
        try { window.dispatchEvent(new CustomEvent('pb:notify', { detail: { type: 'success', title: /* i18n-exempt */ 'Saved' } })); } catch {}
      } else if (res.status === 409) {
        try { window.dispatchEvent(new CustomEvent('pb:notify', { detail: { type: 'error', title: /* i18n-exempt */ 'Conflict', message: /* i18n-exempt */ 'Page was modified elsewhere. Please refresh.' } })); } catch {}
      }
    } catch (err) {
      try { window.dispatchEvent(new CustomEvent('pb:notify', { detail: { type: 'error', title: /* i18n-exempt */ 'Save failed', message: String((err as Error)?.message || err) } })); } catch {}
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerPortal>
        <OverlayScrim />
        <DrawerContent side="left" width="w-[42rem]" className="p-0">
        <div className="px-4 py-3">
          <DrawerTitle>{/* i18n-exempt */}Pages</DrawerTitle>
        </div>
        <Sidebar sideWidth="w-72" gap={0} className="h-[calc(100%-3rem)]">
          {/* List + controls */}
          <div className="flex h-full flex-col gap-2 border-r p-3 text-sm">
            <div className="flex items-center gap-2">
              <Input placeholder={/* i18n-exempt */ "Search pages…"} value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
              <Button variant="outline" className="h-8 px-2" onClick={addPage}>{/* i18n-exempt */}Add</Button>
            </div>
            <div className="text-xs text-muted-foreground">{filtered.length} page{filtered.length === 1 ? "" : "s"}</div>
            <div className="flex-1 overflow-auto">
              {filtered.length === 0 && (
                <div className="p-2 text-muted-foreground">{/* i18n-exempt */}No pages yet.</div>
              )}
              <ul className="space-y-2">
                {filtered.map((p) => {
                  const isSel = p.id === selectedId;
                  return (
                    // i18n-exempt -- styling-only state class
                    <li key={p.id} className={`rounded border ${isSel ? 'ring-1 ring-primary' : ''}`}>
                      <button type="button" className="block w-full truncate px-2 py-1 min-h-10 min-w-10 text-start" onClick={() => setSelectedId(p.id)}>
                        <div className="truncate font-medium">{p.title || p.seo?.title?.en || p.slug || p.id}</div>
                        <div className="truncate text-xs text-muted-foreground">/{p.slug}</div>
                      </button>
                      <div className="flex items-center justify-between gap-2 border-t px-2 py-1 text-xs">
                        <div className="flex items-center gap-1">
                          <Button variant="outline" className="min-h-10 min-w-10 px-2" onClick={() => move(p.id, -1)} aria-label="Move up">↑</Button>
                          <Button variant="outline" className="min-h-10 min-w-10 px-2" onClick={() => move(p.id, +1)} aria-label="Move down">↓</Button>
                      <Button
                        variant="outline"
                        className="min-h-10 px-2"
                        onClick={async () => {
                          const next = p.visibility === 'hidden' ? 'public' : 'hidden';
                          setPages((prev) => prev.map((it) => it.id === p.id ? { ...it, visibility: next } : it));
                          try {
                            await fetch(`/cms/api/pages/${shop}/${p.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ updatedAt: p.updatedAt || new Date().toISOString(), visibility: next, seo: { title: p.seo?.title || { en: p.title || p.slug } } }),
                            });
                          } catch {
                            try { window.dispatchEvent(new CustomEvent('pb:notify', { detail: { type: 'error', title: /* i18n-exempt */ 'Update failed' } })); } catch {}
                          }
                        }}
                      >{p.visibility === 'hidden' ? (/* i18n-exempt */ 'Show') : (/* i18n-exempt */ 'Hide')}</Button>
                        </div>
                        <div>
                          <Button variant="outline" className="min-h-10 px-2" onClick={() => setSelectedId(p.id)}>{/* i18n-exempt */}Settings</Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <Cluster justify="between" alignY="center" gap={2}>
              <div className="text-xs text-muted-foreground">{/* i18n-exempt */}Reorder affects navigation order. Hide keeps URLs accessible unless restricted.</div>
              <Cluster alignY="center" gap={2}>
                <Button variant="outline" className="h-8 px-2" onClick={saveOrder} disabled={!orderDirty}>
                  {orderDirty ? (/* i18n-exempt */ 'Save Order') : (/* i18n-exempt */ 'Order Saved')}
                </Button>
                <Button variant="outline" className="h-8 px-2" onClick={saveDraft}>{/* i18n-exempt */}Save Draft</Button>
              </Cluster>
            </Cluster>
          </div>
          {/* Settings stub */}
          <Stack className="h-full p-3" gap={3}>
            {!selected && (
              <div className="p-3 text-sm text-muted-foreground">{/* i18n-exempt */}Select a page to edit settings.</div>
            )}
            {selected && (
              <div className="space-y-4 overflow-auto">
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">{/* i18n-exempt */}Page Info</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <label className="text-xs">
                      <div className="mb-1">{/* i18n-exempt */}Title</div>
                      <Input value={selected.title ?? ""} onChange={(e) => updateSelected({ title: e.target.value })} placeholder={/* i18n-exempt */ "Page title"} />
                    </label>
                    <label className="text-xs">
                      <div className="mb-1">{/* i18n-exempt */}Slug</div>
                      <Input value={selected.slug} onChange={(e) => updateSelected({ slug: e.target.value.replace(/^\//, "") })} placeholder={/* i18n-exempt */ "about-us"} />
                    </label>
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">{/* i18n-exempt */}Permissions</h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <Sidebar sideWidth="w-48" gap={2} className="items-center">
                      <div className="text-xs text-muted-foreground">{/* i18n-exempt */}Visibility</div>
                      <Select value={selected.visibility ?? "public"} onValueChange={(v) => updateSelected({ visibility: v as PageItem["visibility"] })}>
                        <SelectTrigger className="h-8"><SelectValue placeholder={/* i18n-exempt */ "Visibility"} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">{/* i18n-exempt */}Public</SelectItem>
                          <SelectItem value="hidden">{/* i18n-exempt */}Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                    </Sidebar>
                    <Sidebar sideWidth="w-48" gap={2} className="items-center">
                      <div className="text-xs text-muted-foreground">{/* i18n-exempt */}Allowed roles</div>
                      <Input placeholder={/* i18n-exempt */ "e.g. admin, editor (stub)"} />
                    </Sidebar>
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">{/* i18n-exempt */}SEO Basics</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <label className="text-xs">
                      <div className="mb-1">{/* i18n-exempt */}SEO Title</div>
                      <Input value={selected.seo?.title?.en ?? ""} onChange={(e) => updateSelected({ seo: { ...(selected.seo || {}), title: { ...(selected.seo?.title || {}), en: e.target.value } } })} placeholder={/* i18n-exempt */ "Title for search engines"} />
                    </label>
                    <label className="text-xs">
                      <div className="mb-1">{/* i18n-exempt */}Description</div>
                      <Textarea value={selected.seo?.description?.en ?? ""} onChange={(e) => updateSelected({ seo: { ...(selected.seo || {}), description: { ...(selected.seo?.description || {}), en: e.target.value } } })} placeholder={/* i18n-exempt */ "Brief summary shown in results"} />
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <Checkbox checked={!!selected.seo?.noindex} onCheckedChange={(v: CheckedState) => updateSelected({ seo: { ...(selected.seo || {}), noindex: !!v } })} />
                      <span>{/* i18n-exempt */}Noindex (discourage search engines)</span>
                    </label>
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">{/* i18n-exempt */}Social Share</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <label className="text-xs">
                      <div className="mb-1">{/* i18n-exempt */}OG Title</div>
                      <Input value={selected.seo?.title?.en ?? ""} onChange={(e) => updateSelected({ seo: { ...(selected.seo || {}), title: { ...(selected.seo?.title || {}), en: e.target.value } } })} placeholder={/* i18n-exempt */ "Title for social cards"} />
                    </label>
                    <label className="text-xs">
                      <div className="mb-1">{/* i18n-exempt */}OG Description</div>
                      <Textarea value={selected.seo?.description?.en ?? ""} onChange={(e) => updateSelected({ seo: { ...(selected.seo || {}), description: { ...(selected.seo?.description || {}), en: e.target.value } } })} placeholder={/* i18n-exempt */ "Description for social cards"} />
                    </label>
                    <label className="text-xs">
                      <div className="mb-1">{/* i18n-exempt */}OG Image URL</div>
                      <Input value={selected.seo?.image ?? ""} onChange={(e) => updateSelected({ seo: { ...(selected.seo || {}), image: e.target.value } })} placeholder={/* i18n-exempt */ "https://…/image.jpg"} />
                    </label>
                    {selected.seo?.image && (
                        <div className="rounded border p-2">
                          <div className="mb-1 text-xs text-muted-foreground">{/* i18n-exempt */}Preview</div>
                          <div className="relative h-32 w-full overflow-hidden rounded">
                            <Image
                              src={selected.seo.image}
                              alt={/* i18n-exempt */ "OG preview"}
                              fill
                              className="object-cover"
                              sizes="100vw"
                            />
                          </div>
                        </div>
                    )}
                  </div>
                </section>
              </div>
            )}
          </Stack>
        </Sidebar>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
