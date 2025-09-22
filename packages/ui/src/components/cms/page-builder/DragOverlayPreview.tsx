"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import useReducedMotion from "../../../hooks/useReducedMotion";
import { palette } from "./paletteData";

type ComponentType = keyof typeof palette["layout"][number] | string;

export type DragMeta = {
  from: "palette" | "library" | "canvas";
  type?: ComponentType;
  count?: number;
  label?: string;
  thumbnail?: string | null;
};

function findIcon(type?: string): string | null {
  if (!type) return null;
  try {
    const cats = Object.values(palette);
    for (const list of cats) {
      const item = list.find((i) => i.type === type);
      if (item?.previewImage) return item.previewImage as string;
    }
    return "/window.svg";
  } catch {
    return "/window.svg";
  }
}

export default function DragOverlayPreview({ dragMeta, allowed, locale = 'en' }: { dragMeta: DragMeta | null; allowed: boolean | null; locale?: string }) {
  if (!dragMeta) return null;
  const reducedMotion = useReducedMotion();
  const [ready, setReady] = useState<boolean>(reducedMotion);
  useEffect(() => {
    if (reducedMotion) return;
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [reducedMotion]);
  const icon = dragMeta.from === "library" && dragMeta.thumbnail ? dragMeta.thumbnail : findIcon(dragMeta.type);
  const label = dragMeta.label ?? dragMeta.type ?? (dragMeta.from === "library" ? (dragMeta.count ? `${dragMeta.count} block${dragMeta.count > 1 ? "s" : ""}` : "Library item") : "Block");
  const notes: Record<string, Record<string, string>> = {
    en: { palette: 'Palette', library: 'Library', canvas: 'Canvas' },
  };
  const dict = notes[locale] || notes.en;
  const note = dragMeta.from === "palette" ? dict.palette : dragMeta.from === "library" ? dict.library : dict.canvas;
  const danger = allowed === false;

  return (
    <div
      className={
        "pointer-events-none select-none rounded-md border bg-surface-2 px-3 py-2 shadow-elevation-3 transform-gpu " +
        (danger ? " border-danger ring-2 ring-danger/50 cursor-not-allowed" : " border-border-2")
      }
      style={reducedMotion ? undefined : { transition: "transform 180ms cubic-bezier(0.16,1,0.3,1), opacity 180ms cubic-bezier(0.16,1,0.3,1)", transform: ready ? "scale(1)" : "scale(0.96)", opacity: ready ? 1 : 0.85 }}
      aria-disabled={danger}
    >
      <div className="flex items-center gap-2">
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <Image src={icon} alt="" width={24} height={24} className="h-6 w-6 rounded" />
        ) : (
          <div className="h-6 w-6 rounded bg-muted" />
        )}
        <div className="flex flex-col">
          <span className={"text-sm " + (danger ? "text-danger" : "")}>{label}</span>
          <span className="text-muted-foreground text-[10px]">{note}</span>
        </div>
        {danger && (
          <span className="ml-2 text-danger" aria-hidden>
            ⛔
          </span>
        )}
      </div>
    </div>
  );
}
