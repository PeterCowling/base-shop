"use client";

/* eslint-disable ds/enforce-layout-primitives, ds/require-aspect-ratio-on-media, ds/no-naked-img, react/forbid-dom-props, @next/next/no-img-element -- UI-9999 [ttl=2026-12-31] retention UI pending design cleanup */

import * as React from "react";
import { OptionTile, Tag } from "../../../atoms";
import type { PatternOption } from "../types";

export interface PatternPickerGridProps {
  patterns: PatternOption[];
  filtered: PatternOption[];
  selectedKey?: string | undefined;
  selectedLabel?: React.ReactNode;
  unavailableLabel?: string | undefined;
  availableByKey: Map<string, boolean>;
  onSelect: (patternKey: string) => void;
}

export function PatternPickerGrid({
  patterns,
  filtered,
  selectedKey,
  selectedLabel,
  unavailableLabel,
  availableByKey,
  onSelect,
}: PatternPickerGridProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold tracking-wide text-muted-foreground">
          {filtered.length} / {patterns.length}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {filtered.map((pattern) => {
          const isSelected = pattern.key === selectedKey;
          const isAvailable = Boolean(availableByKey.get(pattern.key));
          const preview = pattern.preview;
          return (
            <OptionTile
              key={pattern.key}
              selected={isSelected}
              selectedLabel={selectedLabel}
              onClick={() => onSelect(pattern.key)}
              className="p-2"
              aria-label={pattern.name}
            >
              <div className="space-y-2">
                <div className="relative aspect-square overflow-hidden rounded-xl border border-border-1 bg-surface-1">
                  {preview.type === "css" ? (
                    <div className="absolute inset-0" style={preview.style} />
                  ) : (
                    <img
                      src={preview.src}
                      alt={preview.alt ?? pattern.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  )}
                  {!isAvailable ? (
                    <div className="absolute inset-0 bg-surface-1/70" />
                  ) : null}
                </div>

                <div className="space-y-1">
                  <div className="line-clamp-2 text-xs font-semibold text-foreground">
                    {pattern.name}
                  </div>
                  {!isAvailable && unavailableLabel ? (
                    <Tag size="sm" color="default" tone="soft">
                      {unavailableLabel}
                    </Tag>
                  ) : null}
                </div>
              </div>
            </OptionTile>
          );
        })}
      </div>
    </>
  );
}
