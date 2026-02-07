"use client";

import React from "react";

import { Button } from "../../atoms/shadcn";

const PRESETS: Array<{ label: string; value?: string }> = [
  { label: "Auto", value: undefined },
  { label: "1:1", value: "1:1" },
  { label: "3:2", value: "3:2" },
  { label: "4:3", value: "4:3" },
  { label: "16:9", value: "16:9" },
];

function flip(aspect?: string): string | undefined {
  if (!aspect) return undefined;
  const [w, h] = aspect.split(":").map((n) => Number(n));
  if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return aspect;
  return `${h}:${w}`;
}

export default function ImageAspectToolbar({ value, onChange }: { value?: string; onChange: (next?: string) => void }) {
  return (
    <div className="relative">
      <div className="absolute end-1 top-1 flex items-center gap-1 rounded bg-foreground/60 p-1 text-foreground shadow backdrop-blur-sm dark:bg-card/70 dark:text-foreground">
        {PRESETS.map((p) => (
          <Button key={p.label} type="button" variant={p.value === value ? "default" : "outline"} className="h-6 px-2 text-xs" onClick={() => onChange(p.value)}>
            {p.label}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          className="h-6 px-2 text-xs"
          onClick={() => onChange(flip(value))}
          title={/* i18n-exempt -- PB-2417: editor-only tooltip */ "Flip orientation"}
          aria-label={/* i18n-exempt -- PB-2417: editor-only control */ "Flip orientation"}
        >
          ↔︎
        </Button>
      </div>
    </div>
  );
}
