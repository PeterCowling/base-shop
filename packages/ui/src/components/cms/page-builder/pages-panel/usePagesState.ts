"use client";
import { useEffect, useMemo, useState } from "react";
import { PageItem } from "./types";
import { createPage, fetchPages, patchPage, updateOrder } from "./api";
import { notify, uid } from "./utils";
import { useTranslations } from "@acme/i18n";

export function usePagesState(open: boolean, shop: string) {
  const t = useTranslations();
  const [q, setQ] = useState("");
  const [pages, setPages] = useState<PageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [orderDirty, setOrderDirty] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const items = await fetchPages(shop);
        setPages(items);
        if (!selectedId && items.length) setSelectedId(items[0].id);
      } catch {
        setPages([]);
      }
    })();
  }, [open, shop]);

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
      setOrderDirty(true);
      return next;
    });
  };

  const saveOrder = async () => {
    try {
      const ids = pages.map((p) => p.id);
      const ok = await updateOrder(shop, ids);
      if (ok) {
        setOrderDirty(false);
        notify({ type: "success", title: t("Order saved") as string });
      } else {
        notify({ type: "error", title: t("Reorder failed") as string });
      }
    } catch {
      notify({ type: "error", title: t("Reorder failed") as string });
    }
  };

  const toggleVisibility = async (p: PageItem) => {
    const next = p.visibility === "hidden" ? "public" : "hidden";
    setPages((prev) => prev.map((it) => (it.id === p.id ? { ...it, visibility: next } : it)));
    try {
      await patchPage(shop, p.id, {
        updatedAt: p.updatedAt || new Date().toISOString(),
        visibility: next,
        seo: { title: p.seo?.title || { en: p.title || p.slug } },
      });
    } catch {
      notify({ type: "error", title: t("Update failed") as string });
    }
  };

  const addPage = async () => {
    const n = pages.length + 1;
    const title = String(t("Untitled {n}", { n }));
    try {
      const created = await createPage(shop, title);
      if (created) {
        setPages((prev) => [...prev, created]);
        setSelectedId(created.id);
        notify({ type: "info", title: t("Draft page created") as string });
        return;
      }
    } catch {}
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
      } as any;
      const res = await patchPage(shop, sel.id, body);
      if (res.ok && res.item) {
        setPages((prev) => prev.map((it) => (it.id === res.item!.id ? { ...it, ...res.item! } : it)));
        setSelectedId(res.item!.id);
        notify({ type: "success", title: t("Saved") as string });
      } else if (res.status === 409) {
        notify({ type: "error", title: t("Conflict") as string, message: t("Page was modified elsewhere. Please refresh.") as string });
      }
    } catch (err) {
      notify({ type: "error", title: t("Save failed") as string, message: String((err as Error)?.message || err) });
    }
  };

  return {
    q,
    setQ,
    pages,
    filtered,
    selected,
    selectedId,
    setSelectedId,
    orderDirty,
    updateSelected,
    move,
    addPage,
    saveOrder,
    toggleVisibility,
    saveDraft,
  } as const;
}
