// apps/cms/src/app/cms/shop/[shop]/themes/PalettePeek.tsx
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives";
import { useTranslations } from "@acme/i18n";

import MicroScenes from "../../../wizard/MicroScenes";

interface Props {
  themes: string[];
  value: string;
  onChange: (themeId: string) => void;
  hasWarnings?: boolean;
}

export default function PalettePeek({ themes, value, onChange, hasWarnings = false }: Props) {
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const currentIndex = useMemo(() => themes.findIndex((t) => t === value), [themes, value]);

  // Keyboard navigation between palettes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const next = (currentIndex + dir + themes.length) % themes.length;
        onChange(themes[next]);
        const btn = el.querySelector<HTMLButtonElement>(`button[data-theme='${themes[next]}']`);
        btn?.focus();
      }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [currentIndex, themes, onChange]);

  return (
    <Inline
      ref={containerRef}
      aria-label={t("cms.themes.paletteChooser") as string}
      role="listbox"
      gap={2}
      wrap
    >
      {themes.map((themeId, idx) => (
        <Popover key={themeId} open={openIndex === idx} onOpenChange={(o: boolean) => setOpenIndex(o ? idx : null)}>
          <PopoverTrigger asChild>
            <button
              type="button"
              role="option"
              aria-selected={themeId === value}
              data-theme={themeId}
              className={`h-10 rounded border px-2 ${themeId === value ? "ring-2 ring-primary" : ""}`}
              onClick={() => onChange(themeId)}
              onMouseEnter={() => setOpenIndex(idx)}
              onMouseLeave={() => setOpenIndex((cur) => (cur === idx ? null : cur))}
            >
              <Inline alignY="center" gap={2}>
                <span className="grid grid-cols-2 gap-0.5">
                  <span className="h-3 w-3 rounded bg-bg" />
                  <span className="h-3 w-3 rounded bg-fg" />
                  <span className="h-3 w-3 rounded bg-primary" />
                  <span className="h-3 w-3 rounded bg-accent" />
                </span>
                <span className="text-sm">{themeId}</span>
                {themeId === value && hasWarnings && (
                  <span className="ms-1 rounded bg-warning-soft px-1 text-xs text-foreground">
                    {t("cms.themes.lowContrast")}
                  </span>
                )}
              </Inline>
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="center">
            <div className="w-96">
              <div className="mb-2 text-xs text-muted-foreground">{t("cms.themes.palettePreview")}</div>
              <MicroScenes />
              <Inline className="mt-2 text-xs" alignY="center" gap={3}>
                <LegendDot className="bg-primary" label={t("cms.themes.legend.primary") as string} />
                <LegendDot className="bg-accent" label={t("cms.themes.legend.accent") as string} />
                <LegendDot className="bg-muted" label={t("cms.themes.legend.surface") as string} />
                <LegendDot className="bg-fg" label={t("cms.themes.legend.text") as string} />
                <LegendDot className="bg-success" label={t("cms.themes.legend.success") as string} />
                <LegendDot className="bg-info" label={t("cms.themes.legend.info") as string} />
                <LegendDot className="bg-warning" label={t("cms.themes.legend.warning") as string} />
                <LegendDot className="bg-danger" label={t("cms.themes.legend.danger") as string} />
              </Inline>
            </div>
          </PopoverContent>
        </Popover>
      ))}
    </Inline>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block h-2 w-2 rounded ${className}`} />
      <span>{label}</span>
    </span>
  );
}
