"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

import { useTranslations } from "@acme/i18n";

import useReducedMotion from "../../../hooks/useReducedMotion";

import { listInstalledApps, subscribeInstalledApps } from "./appInstallStore";
import type { ComponentType } from "./defaults";
import type { PaletteMeta } from "./palette.types";
import { defaultIcon, getPaletteCategories } from "./paletteData";

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

export default function DragOverlayPreview({ dragMeta, allowed, locale: _locale = 'en', shop = null }: { dragMeta: DragMeta | null; allowed: boolean | null; locale?: string; shop?: string | null }) {
  const t = useTranslations();
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
  const label = (() => {
    if (dragMeta.label) return dragMeta.label;
    if (dragMeta.type) return dragMeta.type;
    if (dragMeta.from === "library") {
      if (typeof dragMeta.count === "number") {
        return dragMeta.count === 1
          ? t("cms.builder.drag.blockCount.one", { count: dragMeta.count })
          : t("cms.builder.drag.blockCount.many", { count: dragMeta.count });
      }
      return t("cms.builder.drag.libraryItem");
    }
    return t("cms.builder.drag.block");
  })();
  const note = dragMeta.from === "palette" ? t("cms.builder.drag.palette") : dragMeta.from === "library" ? t("cms.builder.drag.library") : t("cms.builder.drag.canvas");
  const danger = allowed === false;

  return (
    <div
      // i18n-exempt -- PB-2419 class tokens for layout/state; not user copy [ttl=2026-03-31]
      className={
        "pointer-events-none select-none rounded-md border bg-surface-2 px-3 py-2 shadow-elevation-3 transform-gpu " + // i18n-exempt -- PB-2419 class tokens [ttl=2026-03-31]
        (reducedMotion
          ? ""
          : " transition-[transform,opacity] duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)]") + // i18n-exempt -- PB-2419 class tokens [ttl=2026-03-31]
        (ready && !reducedMotion ? " scale-100 opacity-100" : !reducedMotion ? " scale-[0.96] opacity-[0.85]" : "") + // i18n-exempt -- PB-2419 class tokens [ttl=2026-03-31]
        (danger ? " border-danger ring-2 ring-danger/50 cursor-not-allowed" : " border-border-2") // i18n-exempt -- PB-2419 class tokens [ttl=2026-03-31]
      }
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
