"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { z } from "zod";

import { Tooltip } from "@acme/design-system/atoms";
import { Grid } from "@acme/design-system/primitives/Grid";
import { Inline } from "@acme/design-system/primitives/Inline";
import { Button,Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";
import { getShopFromPath } from "@acme/lib/shop";
import type { PageComponent } from "@acme/types";
import type { SectionTemplate } from "@acme/types/section/template";

import { getBuiltInSections } from "./builtInSections.data";
import useThemeSignature from "./hooks/useThemeSignature";
import { presetCategories, type PresetCategory,type PresetDef, presetList } from "./presets.data";
import { getPalettePreview } from "./previewImages";

interface Props {
  onInsert: (component: PageComponent) => void;
  sourceUrl?: string; // optional remote JSON of PresetDef[]
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** When true, do not render the trigger button; control externally via open/onOpenChange */
  hideTrigger?: boolean;
}

export default function PresetsModal({ onInsert, sourceUrl, open, onOpenChange, hideTrigger = false }: Props) {
  const t = useTranslations();
  const [presets, setPresets] = useState<PresetDef[]>(presetList);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<PresetCategory | "All">("All");
  const [loadError, setLoadError] = useState<string>("");
  const pathname = usePathname() ?? "";
  const shop = getShopFromPath(pathname);
  const themeSig = useThemeSignature(["--color-bg", "--color-fg"]);

  useEffect(() => {
    let aborted = false;
    const effectiveUrl = sourceUrl || (shop ? `/api/sections/${encodeURIComponent(shop)}/presets` : undefined);
    if (!effectiveUrl) return;
    (async () => {
      try {
        const res = await fetch(effectiveUrl);
        if (!res.ok) return;
        const data = await res.json();
        // Validate remote schema: items with a PageComponent template
        const RemoteItem = z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          description: z.string().optional(),
          preview: z.string().url().or(z.string().startsWith("/")).or(z.string().min(1)),
          category: z.enum(["Hero", "Features", "Testimonials", "Commerce"]) as z.ZodType<PresetCategory>,
          template: z.object({ type: z.string().min(1) }).passthrough(),
        });
        const RemoteArray = z.array(RemoteItem);
        const parsed = RemoteArray.safeParse(Array.isArray(data) ? data : (data?.items ?? []));
        if (!parsed.success) {
          setLoadError(t("cms.builder.presets.load.invalidFeed") as string);
          return;
        }
        if (!aborted && parsed.data.length) {
          const mapped: PresetDef[] = parsed.data.map((r) => ({
            id: r.id,
            label: r.label,
            description: r.description,
            preview: r.preview,
            previewType: ((r.template as unknown as { type?: string } | undefined)?.type) || undefined,
            category: r.category,
            build: () => (r.template as unknown as PageComponent),
          }));
          setPresets(mapped);
          setLoadError("");
        }
      } catch {
        // Show a soft error; keep local presets
        setLoadError(t("cms.builder.presets.load.failed") as string);
      }
    })();
    return () => { aborted = true; };
  }, [sourceUrl, shop, t]);

  // Also merge in Section Templates from the shop so the modal includes all sections
  useEffect(() => {
    let aborted = false;
    const s = shop ? String(shop) : "";
    if (!s) return;
    (async () => {
      try {
        // Fetch first page with larger pageSize to cover bigger catalogs
        const res = await fetch(`/cms/api/sections/${encodeURIComponent(s)}?page=1&pageSize=500`);
        if (!res.ok) return;
        const json = await res.json();
        const list: SectionTemplate[] = Array.isArray(json)
          ? (json as SectionTemplate[])
          : Array.isArray(json?.items)
            ? (json.items as SectionTemplate[])
            : [];
        if (aborted || !Array.isArray(list) || list.length === 0) return;

        // Map SectionTemplate -> PresetDef, deriving a category from tags when possible
        const toCategory = (tags?: string[] | null): PresetCategory => {
          const t = (tags || []).map((x) => x.toLowerCase());
          if (t.includes("hero")) return "Hero";
          if (t.includes("feature") || t.includes("features")) return "Features";
          if (t.includes("testimonial") || t.includes("testimonials")) return "Testimonials";
          // Treat most commerce/product-related sections as Commerce by default
          if (t.includes("commerce") || t.includes("product") || t.includes("grid") || t.includes("carousel")) return "Commerce";
          return "Hero";
        };

        const mapped: PresetDef[] = list.map((s) => ({
          id: `section:${s.id}`,
          label: s.label,
          description: Array.isArray(s.tags) && s.tags.length ? s.tags.join(", ") : undefined,
          preview: s.thumbnail || "/window.svg",
          previewType: ((s.template as unknown as { type?: string } | undefined)?.type) || undefined,
          category: toCategory(s.tags),
          build: () => (s.template as unknown as PageComponent),
        }));

        // Merge with existing presets; keep starters first, then sections
        setPresets((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const dedup = mapped.filter((m) => !existingIds.has(m.id));
          return [...prev, ...dedup];
        });
      } catch {
        // non-fatal; ignore
      }
    })();
    return () => { aborted = true; };
  }, [shop]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return presets.filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.label.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
    });
  }, [presets, search, category]);

  // Built-in sections are shown separately from Preset categories and respect the search query.
  const builtInSections = useMemo(() => getBuiltInSections(((k: string) => t(k) as string)), [t]);
  const builtInsFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return builtInSections.filter((s) => {
      if (!q) return true;
      const hay = `${s.label}\n${s.description ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [search, builtInSections]);

  const byCategory = useMemo(() => {
    const map = new Map<string, PresetDef[]>();
    for (const c of ["All", ...presetCategories]) map.set(c, [] as PresetDef[]);
    for (const p of filtered) {
      map.set(p.category, [...(map.get(p.category) || []), p]);
    }
    return map;
  }, [filtered]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Tooltip text={t("cms.builder.presets.insertSection.tooltip")}>
            <Button variant="outline">{t("cms.builder.presets.addSection")}</Button>
          </Tooltip>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogTitle>{t("cms.builder.presets.sectionLibrary.title")}</DialogTitle>
        <DialogDescription>{t("cms.builder.presets.sectionLibrary.description")}</DialogDescription>
        {loadError && (
          <div className="rounded border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
            {loadError}
          </div>
        )}
        <Inline alignY="center" gap={2} className="py-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("cms.builder.presets.search.placeholder") as string}
            className="flex-1 rounded border p-2 text-sm"
            aria-label={t("cms.builder.presets.search.aria") as string}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PresetCategory | "All")}
            className="rounded border p-2 text-sm"
            aria-label={t("cms.builder.presets.category.aria") as string}
          >
            <option value="All">{t("cms.builder.presets.category.all")}</option>
            {presetCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Inline>
        {/* Built-in Sections (variants) */}
        {builtInsFiltered.length > 0 && (
          <div className="mb-4">
            <div className="mb-2 text-sm font-semibold">{t("cms.builder.presets.builtIn.title")}</div>
            <Grid cols={2} gap={4}>
              {builtInsFiltered.map((p) => {
                const resolvedPreview = p.preview === "/window.svg" ? getPalettePreview(p.previewType) : p.preview;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="rounded border p-2 text-start hover:bg-accent min-h-10 min-w-10"
                    onClick={() => onInsert(p.build())}
                  >
                    <Image src={resolvedPreview} alt="" width={300} height={160} className="w-full rounded" {...(typeof resolvedPreview === 'string' && resolvedPreview.startsWith('data:') ? { unoptimized: true } : {})} />
                    <div className="mt-2 font-medium">{p.label}</div>
                    {p.description && <div className="text-sm text-muted-foreground">{p.description}</div>}
                  </button>
                );
              })}
            </Grid>
          </div>
        )}

        {presetCategories.map((c) => {
          const items = byCategory.get(c) || [];
          if (items.length === 0) return null;
          return (
            <div key={c} className="mb-4">
              <div className="mb-2 text-sm font-semibold">{c}</div>
              <Grid cols={2} gap={4}>
                {items.map((p) => {
                  // Recompute generator output when theme signature changes
                  void themeSig;
                  const resolvedPreview = p.preview === "/window.svg" ? getPalettePreview(p.previewType || "Section") : p.preview;
                  return (
                  <button
                     key={p.id}
                     type="button"
                     className="rounded border p-2 text-start hover:bg-accent min-h-10 min-w-10"
                     onClick={() => onInsert(p.build())}
                   >
                    <Image src={resolvedPreview} alt="" width={300} height={160} className="w-full rounded" {...(typeof resolvedPreview === 'string' && resolvedPreview.startsWith('data:') ? { unoptimized: true } : {})} />
                     <div className="mt-2 font-medium">{p.label}</div>
                     {p.description && <div className="text-sm text-muted-foreground">{p.description}</div>}
                   </button>
                  );})}
              </Grid>
            </div>
          );
        })}
        {Array.from(byCategory.values()).every((arr) => (arr || []).length === 0) && (
          <div className="rounded border bg-muted/30 p-4 text-sm text-muted-foreground">
            {t("cms.builder.presets.empty")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
