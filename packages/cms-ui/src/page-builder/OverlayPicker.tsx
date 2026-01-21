// packages/ui/src/components/cms/page-builder/OverlayPicker.tsx
"use client";

import { useEffect, useId,useMemo, useState } from "react";

import { useTranslations } from "@acme/i18n";

import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/design-system/shadcn";
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

function resolveCssToken(variable: string): string | undefined {
  const root = document.documentElement;
  const computed = getComputedStyle(root).getPropertyValue(variable).trim();
  if (computed && !computed.startsWith("var(")) {
    return computed;
  }
  const inline = root.style.getPropertyValue(variable).trim();
  if (inline && !inline.startsWith("var(")) {
    return inline;
  }
  return undefined;
}

export default function OverlayPicker({ value, onChange }: OverlayPickerProps) {
  const uid = useId();
  const t = useTranslations();
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
        <Button type="button" variant="outline" onClick={() => { setMode("none"); onChange(undefined); }}>{t("common.none")}</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setMode("solid");
            setSolidColor("0 0% 0%");
            setSolidAlpha(0.35);
          }}
        >{t("cms.builder.overlay.darkVeil")}</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setMode("solid");
            setSolidColor("0 0% 100%");
            setSolidAlpha(0.25);
          }}
        >{t("cms.builder.overlay.lightVeil")}</Button>
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
        >{t("cms.builder.overlay.diagonalGradient")}</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const value = resolveCssToken("--color-primary");
            if (!value) return;
            onChange(`hsl(${value} / 0.35)`);
          }}
        >{t("cms.builder.overlay.primaryTint")}</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const value = resolveCssToken("--color-accent");
            if (!value) return;
            onChange(`hsl(${value} / 0.30)`);
          }}
        >{t("cms.builder.overlay.accentTint")}</Button>
      </div>
      <Select
        value={mode}
        onValueChange={(v) => {
          const next = (v as Mode) || "none";
          setMode(next);
          if (next === "none") onChange(undefined);
        }}
      >
        <SelectTrigger aria-label={t("cms.builder.overlay.type") as string}>
          <SelectValue placeholder={t("cms.builder.overlay.type")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t("common.none")}</SelectItem>
          <SelectItem value="solid">{t("cms.builder.overlay.solid")}</SelectItem>
          <SelectItem value="gradient">{t("cms.builder.overlay.gradient")}</SelectItem>
        </SelectContent>
      </Select>

      {mode === "solid" && (
        <div className="grid grid-cols-2 gap-2 items-end">
          <div>
            <label className="text-xs font-medium" htmlFor={`${uid}-solid-color`}>{t("cms.builder.overlay.color")}</label>
            <div className="mt-1"><ColorInput id={`${uid}-solid-color`} value={solidColor} onChange={setSolidColor} /></div>
          </div>
          <Input
            type="number"
            step="0.05"
            min="0"
            max="1"
            label={t("cms.builder.overlay.opacity")}
            value={String(solidAlpha)}
            onChange={(e) => setSolidAlpha(e.target.value === "" ? 0 : Math.max(0, Math.min(1, Number(e.target.value))))}
          />
        </div>
      )}

      {mode === "gradient" && (
        <div className="space-y-2">
          <Select value={String(angle)} onValueChange={(v) => setAngle(Number(v || 135))}>
            <SelectTrigger aria-label={t("cms.builder.overlay.angle") as string}>
              <SelectValue placeholder={t("cms.builder.overlay.angle")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">{t("cms.builder.overlay.angle.0")}</SelectItem>
              <SelectItem value="45">{t("cms.builder.overlay.angle.45")}</SelectItem>
              <SelectItem value="90">{t("cms.builder.overlay.angle.90")}</SelectItem>
              <SelectItem value="135">{t("cms.builder.overlay.angle.135")}</SelectItem>
              <SelectItem value="180">{t("cms.builder.overlay.angle.180")}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            label={t("cms.builder.overlay.angleDeg")}
            min="0"
            max="360"
            value={String(angle)}
            onChange={(e) => setAngle(e.target.value === "" ? 0 : Math.max(0, Math.min(360, Number(e.target.value))))}
          />
          <div className="grid grid-cols-2 gap-2 items-end">
            <div>
              <label className="text-xs font-medium" htmlFor={`${uid}-start-color`}>{t("cms.builder.overlay.startColor")}</label>
              <div className="mt-1"><ColorInput id={`${uid}-start-color`} value={startColor} onChange={setStartColor} /></div>
            </div>
            <Input
              type="number"
              step="0.05"
              min="0"
              max="1"
              label={t("cms.builder.overlay.startOpacity")}
              value={String(startAlpha)}
              onChange={(e) => setStartAlpha(e.target.value === "" ? 0 : Math.max(0, Math.min(1, Number(e.target.value))))}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 items-end">
            <div>
              <label className="text-xs font-medium" htmlFor={`${uid}-end-color`}>{t("cms.builder.overlay.endColor")}</label>
              <div className="mt-1"><ColorInput id={`${uid}-end-color`} value={endColor} onChange={setEndColor} /></div>
            </div>
            <Input
              type="number"
              step="0.05"
              min="0"
              max="1"
              label={t("cms.builder.overlay.endOpacity")}
              value={String(endAlpha)}
              onChange={(e) => setEndAlpha(e.target.value === "" ? 0 : Math.max(0, Math.min(1, Number(e.target.value))))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
