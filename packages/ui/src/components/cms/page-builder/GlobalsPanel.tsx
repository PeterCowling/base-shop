"use client";

import { useEffect, useMemo, useState } from "react";
import type { PageComponent } from "@acme/types";
import type { GlobalItem } from "./libraryStore";

type PreviewMap = Record<string, string>;

interface GlobalsPanelProps {
  globals: GlobalItem[];
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (item: GlobalItem) => void;
}

const CANVAS_WIDTH = 160;
const CANVAS_HEIGHT = 96;

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // convert to 32bit integer
  }
  return Math.abs(hash);
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  node: PageComponent,
  depth: number,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (width <= 4 || height <= 4) return;

  const type = String((node as any)?.type ?? "node");
  const hash = hashString(`${type}-${depth}`);
  const hue = hash % 360;
  const saturation = 55;
  const lightness = Math.max(35, 70 - depth * 7);

  ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  ctx.fillRect(x, y, width, height);

  ctx.strokeStyle = "rgba(15, 23, 42, 0.16)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);

  const children = (node as any)?.children as PageComponent[] | undefined;
  if (!Array.isArray(children) || children.length === 0) {
    const name = String((node as any)?.name ?? type ?? "");
    if (!name) return;
    ctx.fillStyle = "rgba(15, 23, 42, 0.55)";
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name.slice(0, 2).toUpperCase(), x + width / 2, y + height / 2);
    return;
  }

  const orientation: "row" | "column" = depth % 2 === 0 ? "column" : "row";
  const step = (orientation === "column" ? height : width) / children.length;

  for (let i = 0; i < children.length; i += 1) {
    const child = children[i];
    if (orientation === "column") {
      const childHeight = Math.max(6, step - 4);
      const childY = y + i * step + 2;
      drawNode(ctx, child, depth + 1, x + 2, childY, width - 4, childHeight);
    } else {
      const childWidth = Math.max(6, step - 4);
      const childX = x + i * step + 2;
      drawNode(ctx, child, depth + 1, childX, y + 2, childWidth, height - 4);
    }
  }
}

function createMiniature(item: GlobalItem): string | null {
  if (typeof document === "undefined") return null;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawNode(ctx, item.template, 0, 6, 6, CANVAS_WIDTH - 12, CANVAS_HEIGHT - 12);

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

const GlobalsPanel = ({ globals, search, onSearchChange, onSelect }: GlobalsPanelProps) => {
  const [generatedThumbs, setGeneratedThumbs] = useState<PreviewMap>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    setGeneratedThumbs((prev) => {
      const next: PreviewMap = {};
      let changed = false;

      const ids = new Set(globals.map((g) => g.globalId));
      for (const id of Object.keys(prev)) {
        if (ids.has(id)) next[id] = prev[id];
      }

      for (const item of globals) {
        if (item.thumbnail || next[item.globalId]) continue;
        const thumb = createMiniature(item);
        if (thumb) {
          next[item.globalId] = thumb;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [globals]);

  const filteredGlobals = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return globals;
    return globals.filter((g) => g.label.toLowerCase().includes(term));
  }, [globals, search]);

  const getPreviewFor = (item: GlobalItem) => item.thumbnail || generatedThumbs[item.globalId] || null;

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search Globals..."
        className="w-full rounded border border-input bg-input px-2 py-1 text-sm"
      />
      <div className="max-h-64 overflow-auto">
        {filteredGlobals.map((item) => {
          const preview = getPreviewFor(item);
          return (
            <button
              key={item.globalId}
              type="button"
              className="group relative flex w-full items-center justify-between gap-2 rounded border px-2 py-1 text-left text-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onSelect(item)}
              title={item.label}
            >
              <div className="min-w-0 flex-1 truncate">{item.label}</div>
              <span className="text-[10px] text-muted-foreground">{item.globalId.slice(-6)}</span>
              <div className="pointer-events-none absolute right-2 top-1/2 hidden h-16 w-24 -translate-y-1/2 overflow-hidden rounded border bg-background shadow group-hover:flex group-focus-visible:flex">
                {preview ? (
                  <img src={preview} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted text-[10px] text-muted-foreground">
                    No preview
                  </div>
                )}
              </div>
            </button>
          );
        })}
        {filteredGlobals.length === 0 && (
          <div className="space-y-1 px-1 py-2 text-sm text-muted-foreground">
            {globals.length === 0 ? (
              <div>No Globals saved yet.</div>
            ) : (
              <div>No Globals match your search.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalsPanel;
