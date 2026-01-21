"use client";

/* eslint-disable ds/enforce-layout-primitives -- UI-9999 [ttl=2026-12-31] retention UI pending layout refactor */

import * as React from "react";

import { cn } from "../../../utils/style";
import { Button, OptionPill } from "../../atoms";

import type { SizeOption } from "./types";

export interface SizeRadioPillsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  label: string;
  value?: string | undefined;
  onChange: (next: string) => void;
  options: SizeOption[];
  isOptionDisabled?: (key: string) => boolean;
  howToMeasureLabel?: string;
  onHowToMeasureClick?: () => void;
  helperText?: string;
}

export function SizeRadioPills({
  label,
  value,
  onChange,
  options,
  isOptionDisabled,
  howToMeasureLabel,
  onHowToMeasureClick,
  helperText,
  className,
  ...props
}: SizeRadioPillsProps) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-foreground">{label}</div>
          {helperText ? (
            <div className="text-sm text-muted-foreground">{helperText}</div>
          ) : null}
        </div>
        {howToMeasureLabel && onHowToMeasureClick ? (
          <Button
            type="button"
            variant="outline" // i18n-exempt -- token only
            className="min-h-11 rounded-full px-4 text-sm"
            onClick={onHowToMeasureClick}
          >
            {howToMeasureLabel}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const disabled = Boolean(isOptionDisabled?.(opt.key));
          return (
            <OptionPill
              key={opt.key}
              selected={opt.key === value}
              disabled={disabled}
              onClick={() => onChange(opt.key)}
              aria-label={opt.label}
            >
              {opt.label}
            </OptionPill>
          );
        })}
      </div>
    </div>
  );
}
