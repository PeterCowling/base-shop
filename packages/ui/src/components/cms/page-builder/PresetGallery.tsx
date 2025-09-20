// packages/ui/src/components/cms/page-builder/PresetGallery.tsx
"use client";

import type { CSSProperties } from "react";
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";

export interface PresetItem {
  id: string;
  label: string;
  value: Partial<StyleOverrides>;
}

function composeTransform(fx: NonNullable<StyleOverrides["effects"]> | undefined): string | undefined {
  if (!fx) return undefined;
  const parts: string[] = [];
  if (fx.transformRotate) parts.push(`rotate(${fx.transformRotate})`);
  if (fx.transformScale) parts.push(`scale(${fx.transformScale})`);
  if (fx.transformSkewX) parts.push(`skewX(${fx.transformSkewX})`);
  if (fx.transformSkewY) parts.push(`skewY(${fx.transformSkewY})`);
  return parts.length ? parts.join(" ") : undefined;
}

function previewStyle(value: Partial<StyleOverrides>): CSSProperties {
  const fx = value.effects ?? {};
  const style: CSSProperties = {
    borderRadius: fx.borderRadius,
    boxShadow: fx.boxShadow,
    outline: fx.outline,
    outlineOffset: fx.outlineOffset as any,
    borderTop: fx.borderTop,
    borderRight: fx.borderRight,
    borderBottom: fx.borderBottom,
    borderLeft: fx.borderLeft,
    backdropFilter: fx.backdropFilter as any,
    opacity: fx.opacity ? Number(fx.opacity) : undefined,
    transform: composeTransform(fx),
    background: "rgba(255,255,255,0.9)",
  };
  return style;
}

export default function PresetGallery({ title, presets, onApply }: { title: string; presets: PresetItem[]; onApply: (id: string) => void }) {
  if (!presets || presets.length === 0) return null;
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-muted-foreground">{title}</div>
      <div className="grid grid-cols-3 gap-2">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            className="rounded border p-2 text-left hover:bg-accent/30"
            onClick={() => onApply(p.id)}
            title={p.label}
            aria-label={`Apply ${p.label}`}
          >
            <div className="rounded bg-muted p-1">
              <div className="h-8 w-full rounded" style={previewStyle(p.value)} />
            </div>
            <div className="mt-1 truncate text-[11px] text-muted-foreground">{p.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

