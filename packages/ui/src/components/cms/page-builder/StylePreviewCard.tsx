// packages/ui/src/components/cms/page-builder/StylePreviewCard.tsx
"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";

function composeTransform(fx: NonNullable<StyleOverrides["effects"]> | undefined): string | undefined {
  if (!fx) return undefined;
  const parts: string[] = [];
  if (fx.transformRotate) parts.push(`rotate(${fx.transformRotate})`);
  if (fx.transformScale) parts.push(`scale(${fx.transformScale})`);
  if (fx.transformSkewX) parts.push(`skewX(${fx.transformSkewX})`);
  if (fx.transformSkewY) parts.push(`skewY(${fx.transformSkewY})`);
  return parts.length ? parts.join(" ") : undefined;
}

function styleFromEffects(effects?: NonNullable<StyleOverrides["effects"]>): CSSProperties {
  const fx = effects ?? {};
  return {
    borderRadius: fx.borderRadius,
    boxShadow: fx.boxShadow,
    outline: fx.outline,
    outlineOffset: fx.outlineOffset,
    borderTop: fx.borderTop,
    borderRight: fx.borderRight,
    borderBottom: fx.borderBottom,
    borderLeft: fx.borderLeft,
    backdropFilter: fx.backdropFilter,
    filter: fx.filter,
    opacity: fx.opacity ? Number(fx.opacity) : undefined,
    transform: composeTransform(fx),
    transition: "transform 200ms ease, opacity 200ms ease", // i18n-exempt: CSS value
  } as CSSProperties;
}

export default function StylePreviewCard({ effects, hoverScale, hoverOpacity }: { effects?: NonNullable<StyleOverrides["effects"]>; hoverScale?: number; hoverOpacity?: number }) {
  const [hoverOn, setHoverOn] = useState(false);
  const baseStyle = useMemo(() => styleFromEffects(effects), [effects]);

  const simulated: CSSProperties = useMemo(() => {
    if (!hoverOn) return baseStyle;
    const scale = typeof hoverScale === 'number' ? hoverScale : 1.05;
    const opacity = typeof hoverOpacity === 'number' ? hoverOpacity : 0.9;
    const existing = (baseStyle.transform as string | undefined) || '';
    const nextTransform = `${existing} scale(${scale})`.trim();
    return { ...baseStyle, transform: nextTransform, opacity } as CSSProperties;
  }, [baseStyle, hoverOn, hoverScale, hoverOpacity]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-muted-foreground">{/* i18n-exempt: non-user-facing builder preview label */}Preview</div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={hoverOn} onChange={(e) => setHoverOn(e.target.checked)} />
          {/* i18n-exempt: non-user-facing builder preview toggle */}Hover
        </label>
      </div>
      <div className="rounded border bg-muted p-3">
        <div className="mx-auto w-full sm:w-80 rounded bg-background p-4" style={simulated}>
          <div className="text-sm font-semibold">{/* i18n-exempt: illustrative sample text */}Sample Title</div>
          <div className="text-xs text-muted-foreground">{/* i18n-exempt: illustrative sample text */}This block previews current Effects.</div>
          <div className="mt-2 rounded bg-muted px-2 py-1 text-center text-xs">{/* i18n-exempt: illustrative sample text */}Button</div>
        </div>
      </div>
    </div>
  );
}
