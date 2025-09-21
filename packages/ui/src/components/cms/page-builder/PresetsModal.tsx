"use client";

import { Dialog, DialogContent, DialogTitle, DialogTrigger, Button } from "../../atoms/shadcn";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import type { PageComponent } from "@acme/types";
import { presetList, presetCategories, type PresetDef, type PresetCategory } from "./presets.data";

interface Props {
  onInsert: (component: PageComponent) => void;
  sourceUrl?: string; // optional remote JSON of PresetDef[]
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function PresetsModal({ onInsert, sourceUrl, open, onOpenChange }: Props) {
  const [presets, setPresets] = useState<PresetDef[]>(presetList);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<PresetCategory | "All">("All");
  const [loadError, setLoadError] = useState<string>("");

  useEffect(() => {
    let aborted = false;
    if (!sourceUrl) return;
    (async () => {
      try {
        const res = await fetch(sourceUrl);
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
          setLoadError("Presets feed invalid format");
          return;
        }
        if (!aborted && parsed.data.length) {
          const mapped: PresetDef[] = parsed.data.map((r) => ({
            id: r.id,
            label: r.label,
            description: r.description,
            preview: r.preview,
            category: r.category,
            build: () => (r.template as any),
          }));
          setPresets(mapped);
          setLoadError("");
        }
      } catch {
        // Show a soft error; keep local presets
        setLoadError("Failed to load presets feed");
      }
    })();
    return () => { aborted = true; };
  }, [sourceUrl]);

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
      <DialogTrigger asChild>
        <Button variant="outline">Insert Preset</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Starter Layouts</DialogTitle>
        {loadError && (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800">
            {loadError}
          </div>
        )}
        <div className="flex items-center gap-2 py-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search presets..."
            className="flex-1 rounded border p-2 text-sm"
            aria-label="Search presets"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="rounded border p-2 text-sm"
            aria-label="Preset category"
          >
            <option value="All">All</option>
            {presetCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {presetCategories.map((c) => {
          const items = byCategory.get(c) || [];
          if (items.length === 0) return null;
          return (
            <div key={c} className="mb-4">
              <div className="mb-2 text-sm font-semibold">{c}</div>
              <div className="grid grid-cols-2 gap-4">
                {items.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="rounded border p-2 text-left hover:bg-accent"
                    onClick={() => onInsert(p.build())}
                  >
                    <Image src={p.preview} alt="" width={300} height={160} className="w-full rounded" />
                    <div className="mt-2 font-medium">{p.label}</div>
                    {p.description && <div className="text-sm text-muted-foreground">{p.description}</div>}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </DialogContent>
    </Dialog>
  );
}
