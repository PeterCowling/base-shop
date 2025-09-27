// packages/ui/src/components/cms/page-builder/OverlayPicker.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";
import { ColorInput, hslToRgb } from "../ColorInput";

interface OverlayPickerProps {
  value?: string;
  onChange: (value?: string) => void;
}

type Mode = "none" | "solid" | "gradient";

function toRgba(hsl: string, alpha: number): string {
  const [r, g, b] = hslToRgb(hsl);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export default function OverlayPicker({ value, onChange }: OverlayPickerProps) {
  const [mode, setMode] = useState<Mode>(() => (!value ? "none" : value.startsWith("linear-gradient(") ? "gradient" : "solid"));
  const [solidColor, setSolidColor] = useState<string>("0 0% 0%");
  const [solidAlpha, setSolidAlpha] = useState<number>(0.4);
  const [angle, setAngle] = useState<number>(135);
  const [startColor, setStartColor] = useState<string>("0 0% 0%");
  const [startAlpha, setStartAlpha] = useState<number>(0.45);
  const [endColor, setEndColor] = useState<string>("0 0% 0%");
  const [endAlpha, setEndAlpha] = useState<number>(0.0);

  // Best-effort parse for initial UI state
  useEffect(() => {
    if (!value) {
      setMode("none");
      return;
    }
    if (value.startsWith("linear-gradient(")) {
      setMode("gradient");
      const m = value.match(/linear-gradient\(\s*([0-9.]+)deg/i);
      if (m) setAngle(Number(m[1]));
    } else {
      setMode("solid");
    }
  }, [value]);

  // Compute CSS string for current UI selections
  const css = useMemo(() => {
    if (mode === "none") return undefined;
    if (mode === "solid") return toRgba(solidColor, solidAlpha);
    const c1 = toRgba(startColor, startAlpha);
    const c2 = toRgba(endColor, endAlpha);
    return `linear-gradient(${angle}deg, ${c1}, ${c2})`;
  }, [mode, solidColor, solidAlpha, angle, startColor, startAlpha, endColor, endAlpha]);

  useEffect(() => {
    onChange(css);
  }, [css, onChange]);

  return (
    <div className="space-y-2">
      {/* Quick presets */}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => { setMode("none"); onChange(undefined); }}>None</Button> {/* i18n-exempt: admin tool */}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setMode("solid");
            setSolidColor("0 0% 0%");
            setSolidAlpha(0.35);
          }}
        >Dark veil</Button> {/* i18n-exempt: admin tool */}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setMode("solid");
            setSolidColor("0 0% 100%");
            setSolidAlpha(0.25);
          }}
        >Light veil</Button> {/* i18n-exempt: admin tool */}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setMode("gradient");
            setAngle(135);
            setStartColor("0 0% 0%");
            setStartAlpha(0.45);
            setEndColor("0 0% 0%");
            setEndAlpha(0.0);
          }}
        >Diagonal gradient</Button> {/* i18n-exempt: admin tool */}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            // Apply brand primary tint without altering local state so we keep it as a tokenized overlay
            onChange('hsl(var(--color-primary) / 0.35)');
          }}
        >Primary tint</Button> {/* i18n-exempt: admin tool */}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onChange('hsl(var(--color-accent) / 0.30)');
          }}
        >Accent tint</Button> {/* i18n-exempt: admin tool */}
      </div>
      <Select
        value={mode}
        onValueChange={(v) => {
          const next = (v as Mode) || "none";
          setMode(next);
          if (next === "none") onChange(undefined);
        }}
      >
        <SelectTrigger aria-label="Overlay type">
          <SelectValue placeholder="Overlay type" /> {/* i18n-exempt: admin tool */}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem> {/* i18n-exempt: admin tool */}
          <SelectItem value="solid">Solid</SelectItem> {/* i18n-exempt: admin tool */}
          <SelectItem value="gradient">Gradient</SelectItem> {/* i18n-exempt: admin tool */}
        </SelectContent>
      </Select>

      {mode === "solid" && (
        <div className="grid grid-cols-2 gap-2 items-end">
          <div>
            <label className="text-xs font-medium">Color</label>
            <div className="mt-1"><ColorInput value={solidColor} onChange={setSolidColor} /></div>
          </div>
          <Input
            type="number"
            step="0.05"
            min="0"
            max="1"
            label="Opacity"
            value={String(solidAlpha)}
            onChange={(e) => setSolidAlpha(e.target.value === "" ? 0 : Math.max(0, Math.min(1, Number(e.target.value))))}
          />
        </div>
      )}

      {mode === "gradient" && (
        <div className="space-y-2">
          <Select value={String(angle)} onValueChange={(v) => setAngle(Number(v || 135))}>
            <SelectTrigger aria-label="Angle">
              <SelectValue placeholder="Angle" /> {/* i18n-exempt: admin tool */}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0° (to right)</SelectItem> {/* i18n-exempt: admin tool */}
              <SelectItem value="45">45°</SelectItem> {/* i18n-exempt: admin tool */}
              <SelectItem value="90">90° (to bottom)</SelectItem> {/* i18n-exempt: admin tool */}
              <SelectItem value="135">135°</SelectItem> {/* i18n-exempt: admin tool */}
              <SelectItem value="180">180° (to left)</SelectItem> {/* i18n-exempt: admin tool */}
            </SelectContent>
          </Select>
          <Input
            type="number"
            label="Angle (deg)" /* i18n-exempt: admin tool */
            min="0"
            max="360"
            value={String(angle)}
            onChange={(e) => setAngle(e.target.value === "" ? 0 : Math.max(0, Math.min(360, Number(e.target.value))))}
          />
          <div className="grid grid-cols-2 gap-2 items-end">
            <div>
              <label className="text-xs font-medium">Start color</label> {/* i18n-exempt: admin tool */}
              <div className="mt-1"><ColorInput value={startColor} onChange={setStartColor} /></div>
            </div>
            <Input
              type="number"
              step="0.05"
              min="0"
              max="1"
              label="Start opacity" /* i18n-exempt: admin tool */
              value={String(startAlpha)}
              onChange={(e) => setStartAlpha(e.target.value === "" ? 0 : Math.max(0, Math.min(1, Number(e.target.value))))}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 items-end">
            <div>
              <label className="text-xs font-medium">End color</label> {/* i18n-exempt: admin tool */}
              <div className="mt-1"><ColorInput value={endColor} onChange={setEndColor} /></div>
            </div>
            <Input
              type="number"
              step="0.05"
              min="0"
              max="1"
              label="End opacity" /* i18n-exempt: admin tool */
              value={String(endAlpha)}
              onChange={(e) => setEndAlpha(e.target.value === "" ? 0 : Math.max(0, Math.min(1, Number(e.target.value))))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
