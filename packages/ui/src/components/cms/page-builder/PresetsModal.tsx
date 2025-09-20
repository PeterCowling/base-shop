"use client";

import { Dialog, DialogContent, DialogTitle, DialogTrigger, Button } from "../../atoms/shadcn";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { PageComponent } from "@acme/types";
import { presetList, presetCategories, type PresetDef, type PresetCategory } from "./presets.data";

interface Props {
  onInsert: (component: PageComponent) => void;
  sourceUrl?: string; // optional remote JSON of PresetDef[]
}

export default function PresetsModal({ onInsert, sourceUrl }: Props) {
  const [presets, setPresets] = useState<PresetDef[]>(presetList);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<PresetCategory | "All">("All");

  useEffect(() => {
    let aborted = false;
    if (!sourceUrl) return;
    (async () => {
      try {
        const res = await fetch(sourceUrl);
        if (!res.ok) return;
        const data = (await res.json()) as PresetDef[];
        if (!aborted && Array.isArray(data) && data.length) setPresets(data);
      } catch {
        // ignore network errors, keep local presets
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
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Insert Preset</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Starter Layouts</DialogTitle>
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
