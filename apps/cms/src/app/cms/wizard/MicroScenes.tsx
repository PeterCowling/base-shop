// apps/cms/src/app/cms/wizard/MicroScenes.tsx
/* i18n-exempt file -- PB-2420 design token preview component; no user-visible copy [ttl=2026-03-31] */
"use client";
import React from "react";
// Tiny scenes to preview token usage. Reusable in hovercards later.
export default function MicroScenes() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Home / Cards & CTAs */}
      <div className="rounded border p-2" data-token="--color-bg">
        <div className="grid gap-2">
          <div className="rounded border p-2" data-token="--color-panel">
            <div className="h-4 w-1/2 rounded bg-muted" data-token="--color-muted" />
            <div className="mt-2 h-8 w-24 rounded bg-primary" data-token="--color-primary" />
          </div>
          <div className="rounded border p-2" data-token="--color-panel">
            <div className="h-4 w-2/3 rounded bg-muted" data-token="--color-muted" />
            <div className="mt-2 h-8 w-20 rounded bg-accent" data-token="--color-accent" />
          </div>
        </div>
      </div>

      {/* Product Tile */}
      <div className="rounded border p-2" data-token="--color-bg">
        <div className="aspect-square w-full rounded bg-muted" data-token="--color-muted" />
        <div className="mt-2 flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-fg/40" data-token="--color-fg" />
          <div className="h-6 w-12 rounded bg-danger" data-token="--color-danger" />
        </div>
      </div>

      {/* Message */}
      <div className="space-y-2" data-token="--color-bg">
        <div className="rounded border p-2 bg-info" data-token="--color-info">
          <div className="h-4 w-2/3 rounded bg-info-foreground" data-token="--color-info-fg" />
        </div>
        <div className="rounded border p-2 bg-success" data-token="--color-success">
          <div className="h-4 w-1/2 rounded bg-success-foreground" data-token="--color-success-fg" />
        </div>
        <div className="rounded border p-2 bg-warning" data-token="--color-warning">
          <div className="h-4 w-1/2 rounded bg-warning-foreground" data-token="--color-warning-fg" />
        </div>
        <div className="rounded border p-2 bg-danger" data-token="--color-danger">
          <div className="h-4 w-1/2 rounded bg-danger-foreground" data-token="--color-danger-fg" />
        </div>
      </div>
    </div>
  );
}
