"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { ulid } from "ulid";
import type { PageComponent } from "@acme/types";
import { defaults, CONTAINER_TYPES, type ComponentType } from "./defaults";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../atoms";
import {
  atomRegistry,
  moleculeRegistry,
  organismRegistry,
  containerRegistry,
  layoutRegistry,
} from "../blocks";

type Props = {
  index: number;
  onInsert: (component: PageComponent, index: number) => void;
  /** Simple context hint: 'top' for page canvas, 'child' for inside a container */
  context?: "top" | "child";
  /** Parent container type when context is 'child' (e.g., 'Section', 'MultiColumn') */
  containerType?: string;
};

type PaletteRegistry = Record<string, { previewImage?: string } & Record<string, unknown>>;

const createPaletteItems = (registry: PaletteRegistry) =>
  (Object.keys(registry) as ComponentType[])
    .sort()
    .map((t) => ({
      type: t,
      label: t.replace(/([A-Z])/g, " $1").trim(),
      icon: registry[t]?.previewImage ?? "/window.svg",
    }));

const INLINE_PALETTE = {
  layout: createPaletteItems(layoutRegistry as unknown as PaletteRegistry),
  containers: createPaletteItems(
    containerRegistry as unknown as PaletteRegistry,
  ),
  atoms: createPaletteItems(atomRegistry as unknown as PaletteRegistry),
  molecules: createPaletteItems(
    moleculeRegistry as unknown as PaletteRegistry,
  ),
  organisms: createPaletteItems(
    organismRegistry as unknown as PaletteRegistry,
  ),
} as const;

const InlineInsert = memo(function InlineInsert({ index, onInsert, context = "top", containerType }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const items = useMemo(() => {
    const entries = Object.entries(INLINE_PALETTE).flatMap(([category, list]) =>
      list
        .filter((i) =>
          i.label.toLowerCase().includes(search.toLowerCase()),
        )
        .map((i) => ({ ...i, category })),
    );
    // Context filter by container type
    if (context === "child") {
      // Default allowlist: atoms, molecules, organisms only
      let allowedCats = new Set(["atoms", "molecules", "organisms"]);
      // Specific per-container tweaks
      const ct = containerType ?? "";
      if (ct === "Section" || ct === "Repeater" || ct === "Dataset" || ct === "Grid") {
        // Section: allow atoms, molecules, organisms; optionally allow simple containers like 'MultiColumn'
        allowedCats = new Set(["atoms", "molecules", "organisms", "containers"]);
      } else if (ct === "MultiColumn") {
        // MultiColumn: content only (no containers/layout/overlays inside)
        allowedCats = new Set(["atoms", "molecules", "organisms"]);
      }
      return entries.filter((e) => allowedCats.has(String(e.category)));
    }
    return entries;
  }, [search, context, containerType]);

  const handleChoose = (type: ComponentType) => {
    const isContainer = CONTAINER_TYPES.includes(type);
    const component = {
      id: ulid(),
      type,
      ...(defaults[type] ?? {}),
      ...(isContainer ? { children: [] } : {}),
    } as PageComponent;
    onInsert(component, index);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    setActive(0);
  }, [open, search, context]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    const max = items.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = active >= max ? 0 : active + 1;
      setActive(next);
      const btn = contentRef.current?.querySelector<HTMLButtonElement>(`button[data-index='${next}']`);
      btn?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = active <= 0 ? max : active - 1;
      setActive(prev);
      const btn = contentRef.current?.querySelector<HTMLButtonElement>(`button[data-index='${prev}']`);
      btn?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = items[active];
      if (sel) handleChoose(sel.type as ComponentType);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="relative my-1 flex w-full justify-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Insert block here"
            className="opacity-0 transition-opacity duration-150 hover:opacity-100 focus:opacity-100 group-hover:opacity-100 group/button"
            onClick={() => setOpen((v) => !v)}
            onMouseEnter={() => setOpen((v) => v)}
          >
            <span className="rounded-full border bg-muted px-2 text-xs group-hover/button:bg-primary group-hover/button:text-primary-foreground">+ Add</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" onKeyDown={onKeyDown}>
          <div className="mb-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search blocks…"
              className="w-full rounded border p-1 text-sm"
            />
          </div>
          <div ref={contentRef} className="flex max-h-64 flex-col gap-1 overflow-auto" role="listbox" aria-label="Insert block list">
            {items.map((i, idx) => (
              <button
                key={`${i.category}-${i.type}`}
                type="button"
                data-index={idx}
                className={`flex items-center gap-2 rounded border p-1 text-sm hover:bg-muted focus:outline-none ${active === idx ? "ring-1 ring-primary" : ""}`}
                onClick={() => handleChoose(i.type as ComponentType)}
                role="option"
                aria-selected={active === idx}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.icon} alt="" className="h-5 w-5 rounded" />
                <span className="flex-1 text-left">{i.label}</span>
                <span className="text-muted-foreground text-[10px] capitalize">
                  {i.category}
                </span>
              </button>
            ))}
            {items.length === 0 && (
              <div className="text-muted-foreground p-2 text-center text-xs">
                No results
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});

export default InlineInsert;
