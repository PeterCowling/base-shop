"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ulid } from "ulid";

import { useTranslations } from "@acme/i18n";
import type { PageComponent } from "@acme/types";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@acme/design-system/atoms";
import { Stack } from "@acme/design-system/primitives/Stack";
import {
  atomRegistry,
  containerRegistry,
  layoutRegistry,
  moleculeRegistry,
  organismRegistry,
} from "../blocks";

import { type ComponentType,CONTAINER_TYPES, defaults } from "./defaults";
import { getAllowedChildren, isTopLevelAllowed } from "./rules";

const ARIA_LABEL_INSERT_BUTTON = "Insert block here"; // i18n-exempt -- DS-1234 [ttl=2025-11-30]
const ARIA_LABEL_LIST = "Insert block list"; // i18n-exempt -- DS-1234 [ttl=2025-11-30]

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
  const t = useTranslations();
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
    // Placement-rule filtering
    if (context === "child") {
      const parent = (containerType ?? "") as ComponentType;
      const allowed = getAllowedChildren(parent);
      return entries.filter((e) => allowed.has(e.type as ComponentType));
    }
    // context === 'top' (canvas level)
    return entries.filter((e) => isTopLevelAllowed(e.type as ComponentType));
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

   
  const itemButtons = items.map((i, idx) => {
    const label = i.label;
    const category = i.category;
    return (
      <button
        key={`${i.category}-${i.type}`}
        type="button"
        data-index={idx}
        className={`inline-flex items-center gap-2 rounded border p-1 text-sm hover:bg-muted focus:outline-none min-h-10 min-w-10 ${active === idx ? "ring-1 ring-primary" : ""}`}
        onClick={() => handleChoose(i.type as ComponentType)}
        role="option"
        aria-selected={active === idx}
      >
        <Image src={i.icon} alt="" width={20} height={20} className="rounded" />
        <span className="flex-1 text-start">{label}</span>
        <span className="text-muted-foreground text-xs capitalize">{category}</span>
      </button>
    );
  });
   

  return (
    <div className="relative my-1 flex w-full justify-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={ARIA_LABEL_INSERT_BUTTON}
            className="opacity-0 transition-opacity duration-150 hover:opacity-100 focus:opacity-100 group-hover:opacity-100 group/button inline-flex items-center justify-center min-h-10 min-w-10"
            onClick={() => setOpen((v) => !v)}
            onMouseEnter={() => setOpen((v) => v)}
          >
            <span className="rounded-full border bg-muted px-2 text-xs group-hover/button:bg-primary group-hover/button:text-primary-foreground">
              {t("actions.add")}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" onKeyDown={onKeyDown}>
          <div className="mb-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("pb.inline.searchBlocks") as string}
              className="w-full rounded border p-1 text-sm"
            />
          </div>
          <div ref={contentRef} className="max-h-64 overflow-auto" role="listbox" aria-label={ARIA_LABEL_LIST}>
            {/* Use DS Stack for vertical layout */}
            <Stack gap={1}>
            {itemButtons}
            {items.length === 0 && (
              <div className="text-muted-foreground p-2 text-center text-xs">
                {t("search.noResults")}
              </div>
            )}
            </Stack>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});

export default InlineInsert;
