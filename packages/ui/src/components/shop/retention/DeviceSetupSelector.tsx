/* eslint-disable ds/enforce-layout-primitives -- UI-9999 [ttl=2026-12-31] layout refactor pending */
"use client";

import * as React from "react";

import { cn } from "../../../utils/style";
import { Checkbox, OptionPill } from "../../atoms";

import type { DeviceBrandFamily, DeviceSetup, DeviceWearingStyle } from "./types";

export type DeviceSetupSelectorOption<T extends string> = {
  key: T;
  label: string;
};

export interface DeviceSetupSelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  label: string;
  value?: DeviceSetup | undefined;
  onChange: (next: DeviceSetup) => void;
  required?: boolean;
  requiredHint?: string;
  brandLabel: string;
  wearingStyleLabel: string;
  bilateralLabel: string;
  brandOptions: Array<DeviceSetupSelectorOption<DeviceBrandFamily>>;
  wearingStyleOptions: Array<DeviceSetupSelectorOption<DeviceWearingStyle>>;
  helperText?: string;
}

export function DeviceSetupSelector({
  label,
  value,
  onChange,
  required = false,
  requiredHint,
  brandLabel,
  wearingStyleLabel,
  bilateralLabel,
  brandOptions,
  wearingStyleOptions,
  helperText,
  className,
  ...props
}: DeviceSetupSelectorProps) {
  const selectedBrand = value?.brandFamily;
  const selectedStyle = value?.wearingStyle;
  const isBilateral = Boolean(value?.bilateral);

  const handleBrand = React.useCallback(
    (brandFamily: DeviceBrandFamily) => {
      onChange({ ...value, brandFamily });
    },
    [onChange, value],
  );

  const handleStyle = React.useCallback(
    (wearingStyle: DeviceWearingStyle) => {
      onChange({ ...value, wearingStyle });
    },
    [onChange, value],
  );

  const handleBilateral = React.useCallback(
    (next: boolean) => {
      onChange({ ...value, bilateral: next });
    },
    [onChange, value],
  );

  const bilateralId = React.useId();
  const showRequiredHint =
    Boolean(requiredHint) && required && (!selectedBrand || !selectedStyle);

  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div className="space-y-1">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        {helperText ? (
          <div className="text-sm text-muted-foreground">{helperText}</div>
        ) : null}
        {showRequiredHint ? (
          <div className="text-sm font-semibold text-danger-foreground">
            {requiredHint}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold tracking-wide text-muted-foreground">
          {brandLabel}
        </div>
        <div className="flex flex-wrap gap-2">
          {brandOptions.map((opt) => (
            <OptionPill
              key={opt.key}
              selected={opt.key === selectedBrand}
              onClick={() => handleBrand(opt.key)}
              aria-label={opt.label}
            >
              {opt.label}
            </OptionPill>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold tracking-wide text-muted-foreground">
          {wearingStyleLabel}
        </div>
        <div className="flex flex-wrap gap-2">
          {wearingStyleOptions.map((opt) => (
            <OptionPill
              key={opt.key}
              selected={opt.key === selectedStyle}
              onClick={() => handleStyle(opt.key)}
              aria-label={opt.label}
            >
              {opt.label}
            </OptionPill>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id={bilateralId}
          checked={isBilateral}
          onCheckedChange={(next) => handleBilateral(Boolean(next))}
        />
        <label
          htmlFor={bilateralId}
          className="min-h-11 text-sm font-medium text-foreground"
        >
          {bilateralLabel}
        </label>
      </div>
    </div>
  );
}
