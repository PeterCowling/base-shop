/* i18n-exempt file */
"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import useReducedMotion from "../../../hooks/useReducedMotion";
import { defaultIcon, getPaletteCategories } from "./paletteData";
import { listInstalledApps, subscribeInstalledApps } from "./appInstallStore";
import type { ComponentType } from "./defaults";
import type { PaletteMeta } from "./palette.types";

export type DragMeta = {
  from: "palette" | "library" | "canvas";
  type?: ComponentType;
  count?: number;
  label?: string;
  thumbnail?: string | null;
};

const buildPaletteIndex = (installedApps: string[]): Map<string, PaletteMeta> => {
  const index = new Map<string, PaletteMeta>();
  for (const category of getPaletteCategories(installedApps)) {
    for (const item of category.items) {
      index.set(item.type, item);
    }
  }
  return index;
};

export default function DragOverlayPreview({ dragMeta, allowed, locale = 'en', shop = null }: { dragMeta: DragMeta | null; allowed: boolean | null; locale?: string; shop?: string | null }) {
  const reducedMotion = useReducedMotion();
  const [ready, setReady] = useState<boolean>(reducedMotion);
  const [paletteIndex, setPaletteIndex] = useState<Map<string, PaletteMeta>>(() =>
    buildPaletteIndex(listInstalledApps(shop ?? null)),
  );

  useEffect(() => {
    setPaletteIndex(buildPaletteIndex(listInstalledApps(shop ?? null)));
    return subscribeInstalledApps(shop ?? null, (apps) => {
      setPaletteIndex(buildPaletteIndex(apps));
    });
  }, [shop]);

  useEffect(() => {
    if (reducedMotion) return;
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [reducedMotion]);

  const findIcon = useCallback(
    (type?: string): string | null => {
      if (!type) return null;
      const entry = paletteIndex.get(type);
      if (entry?.previewImage) return entry.previewImage;
      if (entry?.icon) return entry.icon;
      return defaultIcon;
    },
    [paletteIndex],
  );

  if (!dragMeta) return null;

  const icon = dragMeta.from === "library" && dragMeta.thumbnail ? dragMeta.thumbnail : findIcon(dragMeta.type);
  const label = dragMeta.label ?? dragMeta.type ?? (dragMeta.from === "library" ? (dragMeta.count ? `${dragMeta.count} block${dragMeta.count > 1 ? "s" : ""}` : "Library item") : "Block"); // i18n-exempt
  const notes: Record<string, Record<string, string>> = {
    en: { palette: 'Palette', library: 'Library', canvas: 'Canvas' }, // i18n-exempt: editor overlay
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
           
          <Image src={icon} alt="" width={24} height={24} className="h-6 w-6 rounded" />
        ) : (
          <div className="h-6 w-6 rounded bg-muted" />
        )}
        <div className="flex flex-col">
          <span className={"text-sm " + (danger ? "text-danger" : "")}>{label}</span>
          <span className="text-muted-foreground text-xs">{note}</span>
        </div>
        {danger && (
          <span className="ms-2 text-danger" aria-hidden>
            ⛔
          </span>
        )}
      </div>
    </div>
  );
}
