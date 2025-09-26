// apps/cms/src/app/cms/shop/[shop]/themes/PalettePeek.tsx
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@ui/components/atoms";
import MicroScenes from "../../../wizard/MicroScenes";

interface Props {
  themes: string[];
  value: string;
  onChange: (themeId: string) => void;
  hasWarnings?: boolean;
}

export default function PalettePeek({ themes, value, onChange, hasWarnings = false }: Props) {
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
    <div ref={containerRef} aria-label="Palette chooser" className="flex flex-wrap gap-2" role="listbox">
      {themes.map((t, idx) => (
        <Popover key={t} open={openIndex === idx} onOpenChange={(o) => setOpenIndex(o ? idx : null)}>
          <PopoverTrigger asChild>
            <button
              type="button"
              role="option"
              aria-selected={t === value}
              data-theme={t}
              className={`flex h-10 items-center gap-2 rounded border px-2 ${t === value ? "ring-2 ring-primary" : ""}`}
              onClick={() => onChange(t)}
              onMouseEnter={() => setOpenIndex(idx)}
              onMouseLeave={() => setOpenIndex((cur) => (cur === idx ? null : cur))}
            >
              <span className="grid grid-cols-2 gap-0.5">
                <span className="h-3 w-3 rounded bg-bg" />
                <span className="h-3 w-3 rounded bg-fg" />
                <span className="h-3 w-3 rounded bg-primary" />
                <span className="h-3 w-3 rounded bg-accent" />
              </span>
              <span className="text-sm">{t}</span>
              {t === value && hasWarnings && (
                <span className="ms-1 rounded bg-warning-soft px-1 text-[10px] text-foreground">Low contrast</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="center">
            <div className="w-[360px]">
              <div className="mb-2 text-xs text-muted-foreground">Palette preview</div>
              <MicroScenes />
              <div className="mt-2 flex items-center gap-3 text-xs">
                <LegendDot className="bg-primary" label="Primary" />
                <LegendDot className="bg-accent" label="Accent" />
                <LegendDot className="bg-muted" label="Surface" />
                <LegendDot className="bg-fg" label="Text" />
                <LegendDot className="bg-success" label="Success" />
                <LegendDot className="bg-info" label="Info" />
                <LegendDot className="bg-warning" label="Warning" />
                <LegendDot className="bg-danger" label="Danger" />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ))}
    </div>
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
