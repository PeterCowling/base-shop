"use client";

/* eslint-disable ds/enforce-layout-primitives, ds/min-tap-size -- UI-9999 [ttl=2026-12-31] retention UI pending DS layout/i18n refactor */

import * as React from "react";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { cn } from "../../../utils/style";
import { Button, Tag } from "../../atoms";
import type { MaterialOption } from "./types";

export interface MaterialRadioCardsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  label: string;
  value?: string | undefined;
  onChange: (next: string) => void;
  options: MaterialOption[];
  isOptionDisabled?: (key: string) => boolean;
  detailsLabel: string;
  hideDetailsLabel: string;
  compareLabel?: string;
  onCompareClick?: () => void;
  helperText?: string;
}

export function MaterialRadioCards({
  label,
  value,
  onChange,
  options,
  isOptionDisabled,
  detailsLabel,
  hideDetailsLabel,
  compareLabel,
  onCompareClick,
  helperText,
  className,
  ...props
}: MaterialRadioCardsProps) {
  const [expandedKey, setExpandedKey] = React.useState<string | null>(null);

  const toggleDetails = React.useCallback((key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  }, []);

  return (
    <div className={cn("space-y-3", className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-foreground">{label}</div>
          {helperText ? (
            <div className="text-sm text-muted-foreground">{helperText}</div>
          ) : null}
        </div>
        {compareLabel && onCompareClick ? (
          <Button
            type="button"
            variant="ghost" // i18n-exempt -- token only
            className="min-h-11 rounded-full px-3 text-sm underline underline-offset-4"
            onClick={onCompareClick}
          >
            {compareLabel}
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {options.map((opt) => {
          const selected = opt.key === value;
          const disabled = Boolean(isOptionDisabled?.(opt.key));
          const expanded = expandedKey === opt.key;
          const detailButtonLabel = expanded ? hideDetailsLabel : detailsLabel;
          const DetailIcon = expanded ? ChevronUpIcon : ChevronDownIcon;
          return (
            <div
              key={opt.key}
              className={cn(
                // i18n-exempt -- DS-1234 [ttl=2025-11-30]
                "group relative rounded-2xl border bg-surface-2 p-4 text-start transition",
                // i18n-exempt -- DS-1234 [ttl=2025-11-30]
                "focus-within:focus-ring",
                disabled ? "opacity-60" : null,
                selected
                  ? // i18n-exempt -- DS-1234 [ttl=2025-11-30]
                    "border-border-3 ring-1 ring-border-3"
                  : disabled
                    ? "border-border-1"
                    : // i18n-exempt -- DS-1234 [ttl=2025-11-30]
                      "border-border-1 hover:border-primary/60",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  // i18n-exempt -- DS-1234 [ttl=2025-11-30]
                  "pointer-events-none absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border bg-surface-1 shadow-elevation-1 transition",
                  selected
                    ? // i18n-exempt -- DS-1234 [ttl=2025-11-30]
                      "border-border-3 opacity-100"
                    : disabled
                      ? "border-border-1 opacity-0"
                      : // i18n-exempt -- DS-1234 [ttl=2025-11-30]
                        "border-border-1 opacity-0 group-hover:opacity-60",
                )}
              >
                <CheckIcon className="h-4 w-4 text-foreground" />
              </span>

              <button
                type="button"
                className="block w-full text-start focus-visible:focus-ring disabled:cursor-not-allowed"
                onClick={() => onChange(opt.key)}
                aria-pressed={selected}
                disabled={disabled}
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="text-base font-semibold text-foreground">
                        {opt.name}
                      </div>
                      {opt.bestFor ? (
                        <div className="text-sm text-muted-foreground">
                          {opt.bestFor}
                        </div>
                      ) : null}
                    </div>
                    {opt.badge ? (
                      <Tag
                        size="sm"
                        color="accent"
                        tone="soft"
                        className="shrink-0"
                      >
                        {opt.badge}
                      </Tag>
                    ) : null}
                  </div>

                  {opt.attributes?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {opt.attributes.map((attr) => (
                        <Tag
                          key={attr.key}
                          size="sm"
                          color="default"
                          tone="soft"
                        >
                          {attr.label}
                        </Tag>
                      ))}
                    </div>
                  ) : null}
                </div>
              </button>

              {opt.details ? (
                <div className="mt-3 space-y-2">
                  <Button
                    type="button"
                    variant="outline" // i18n-exempt -- token only
                    className="min-h-11 w-full justify-between rounded-full px-4 text-sm"
                    onClick={() => toggleDetails(opt.key)}
                    aria-expanded={expanded}
                  >
                    <span>{detailButtonLabel}</span>
                    <DetailIcon aria-hidden className="h-4 w-4" />
                  </Button>
                  {expanded ? (
                    <div className="rounded-2xl border border-border-1 bg-surface-1 p-3 text-sm text-muted-foreground">
                      {opt.details}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
