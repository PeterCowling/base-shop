// packages/ui/src/components/cms/page-builder/panels/layout/UnitInput.tsx
"use client";

import type React from "react";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../atoms/shadcn";
import { cssError } from "./helpers";

type Axis = "w" | "h";

function getRootFontPx() {
  const fs = typeof window !== "undefined" ? getComputedStyle(document.documentElement).fontSize : "16px";
  const n = parseFloat(fs || "16");
  return isFinite(n) && n > 0 ? n : 16;
}

function getParentSize(componentId: string, axis: Axis) {
  try {
    const el = document.querySelector(`[data-component-id="${componentId}"]`) as HTMLElement | null;
    const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
    if (!parent) return 0;
    return axis === "w" ? parent.clientWidth : parent.clientHeight;
  } catch {
    return 0;
  }
}

const parseVal = (v?: string): { num: number; unit: "%" | "px" | "rem" } => {
  const s = String(v ?? "").trim();
  if (s.endsWith("%")) return { num: parseFloat(s.slice(0, -1)) || 0, unit: "%" };
  if (s.endsWith("rem")) return { num: parseFloat(s.slice(0, -3)) || 0, unit: "rem" };
  if (s.endsWith("px")) return { num: parseFloat(s.slice(0, -2)) || 0, unit: "px" };
  // default to px
  const num = parseFloat(s) || 0;
  return { num, unit: "px" };
};

const fmt = (num: number, unit: "%" | "px" | "rem") =>
  `${Number.isFinite(num) ? Math.round(num) : 0}${unit}`;

const convert = (componentId: string, num: number, from: "%" | "px" | "rem", to: "%" | "px" | "rem", axis: Axis) => {
  if (from === to) return num;
  const basePx = getRootFontPx();
  const parentSize = getParentSize(componentId, axis) || 0;
  // Convert from -> px
  let px: number = num;
  if (from === "%") px = parentSize > 0 ? (num / 100) * parentSize : num;
  else if (from === "rem") px = num * basePx;
  // px -> to
  if (to === "%") return parentSize > 0 ? (px / parentSize) * 100 : px;
  if (to === "rem") return basePx > 0 ? px / basePx : px;
  return px;
};

interface UnitInputProps {
  componentId: string;
  label: React.ReactNode;
  value?: string;
  onChange: (v: string) => void;
  axis: Axis;
  placeholder?: string;
  disabled?: boolean;
  cssProp: string;
}

export default function UnitInput({ componentId, label, value, onChange, axis, placeholder, disabled, cssProp }: UnitInputProps) {
  const { num, unit } = parseVal(value);
  return (
    <div className="flex items-end gap-2">
      <Input
        label={label}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        error={cssError(cssProp, value)}
      />
      <Select
        value={unit}
        onValueChange={(next) => {
          const nextUnit = next as "%" | "px" | "rem";
          const nextNum = convert(componentId, num, unit, nextUnit, axis);
          onChange(fmt(nextNum, nextUnit));
        }}
      >
        <SelectTrigger className="w-20">
          <SelectValue placeholder="unit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="px">px</SelectItem>
          <SelectItem value="%">%</SelectItem>
          <SelectItem value="rem">rem</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

