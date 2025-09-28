"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../atoms/shadcn";
import { Button, Input } from "../../atoms/shadcn";

export type FocalPoint = { x: number; y: number }; // 0..1

export interface ImageEditState {
  cropAspect?: string; // e.g. "1:1", "4:3", "16:9" or "auto"
  focalPoint?: FocalPoint; // normalized [0..1]
}

interface Props {
  open: boolean;
  src: string;
  initial?: ImageEditState;
  onClose: () => void;
  onApply: (next: ImageEditState) => void;
  /** Optional existing CSS filter to seed quick adjustments */
  initialFilter?: string;
  /** Persist quick adjustments into style effects (e.g. effects.filter) */
  onApplyFilter?: (filter: string | undefined) => void;
}

const aspectPresets = [
  { label: "Auto", value: undefined },
  { label: "1:1", value: "1:1" },
  { label: "4:3", value: "4:3" },
  { label: "3:2", value: "3:2" },
  { label: "16:9", value: "16:9" },
];

function parseAspect(aspect?: string): number | undefined {
  if (!aspect) return undefined;
  const [w, h] = aspect.split(":").map((n) => Number(n));
  if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return undefined;
  return w / h;
}

function parseFilter(input?: string): { brightness: number; contrast: number; saturate: number; blur: number } {
  if (!input) return { brightness: 1, contrast: 1, saturate: 1, blur: 0 };
  const out = { brightness: 1, contrast: 1, saturate: 1, blur: 0 };
  try {
    const parts = input.split(/\)\s*/).map((p) => p.trim()).filter(Boolean);
    for (const p of parts) {
      if (p.startsWith('brightness(')) {
        const v = p.slice('brightness('.length);
        out.brightness = v.endsWith('%') ? Number(v.slice(0, -1)) / 100 : Number(v);
      } else if (p.startsWith('contrast(')) {
        const v = p.slice('contrast('.length);
        out.contrast = v.endsWith('%') ? Number(v.slice(0, -1)) / 100 : Number(v);
      } else if (p.startsWith('saturate(')) {
        const v = p.slice('saturate('.length);
        out.saturate = v.endsWith('%') ? Number(v.slice(0, -1)) / 100 : Number(v);
      } else if (p.startsWith('blur(')) {
        const v = p.slice('blur('.length);
        out.blur = v.endsWith('px') ? Number(v.slice(0, -2)) : Number(v);
      }
    }
  } catch {
    // ignore
  }
  const clamp = (n: number, min: number, max: number) => (Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min);
  return { brightness: clamp(out.brightness || 1, 0, 4), contrast: clamp(out.contrast || 1, 0, 4), saturate: clamp(out.saturate || 1, 0, 4), blur: clamp(out.blur || 0, 0, 100) };
}

function composeFilter(v: { brightness: number; contrast: number; saturate: number; blur: number }): string | undefined {
  const isDefault = Math.abs(v.brightness - 1) < 1e-6 && Math.abs(v.contrast - 1) < 1e-6 && Math.abs(v.saturate - 1) < 1e-6 && Math.abs(v.blur) < 1e-6;
  if (isDefault) return undefined;
  return `brightness(${v.brightness}) contrast(${v.contrast}) saturate(${v.saturate}) blur(${v.blur}px)`;
}

export default function ImageEditor({ open, src, initial, onClose, onApply, initialFilter, onApplyFilter }: Props) {
  const [aspect, setAspect] = useState<string | undefined>(initial?.cropAspect);
  const [focal, setFocal] = useState<FocalPoint>(initial?.focalPoint ?? { x: 0.5, y: 0.5 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [saturate, setSaturate] = useState(1);
  const [blur, setBlur] = useState(0);

  useEffect(() => {
    if (open) {
      setAspect(initial?.cropAspect);
      setFocal(initial?.focalPoint ?? { x: 0.5, y: 0.5 });
      const parsed = parseFilter(initialFilter);
      setBrightness(parsed.brightness);
      setContrast(parsed.contrast);
      setSaturate(parsed.saturate);
      setBlur(parsed.blur);
    }
  }, [open, initial?.cropAspect, initial?.focalPoint, initialFilter]);

  const aspectRatio = useMemo(() => parseAspect(aspect), [aspect]);

  const handlePickFocal = useCallback((e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setFocal({ x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) });
  }, []);

  const handleKeyAdjust = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    let handled = false;
    if (e.key === "ArrowLeft") { setFocal((f) => ({ x: Math.max(0, f.x - step), y: f.y })); handled = true; }
    else if (e.key === "ArrowRight") { setFocal((f) => ({ x: Math.min(1, f.x + step), y: f.y })); handled = true; }
    else if (e.key === "ArrowUp") { setFocal((f) => ({ x: f.x, y: Math.max(0, f.y - step) })); handled = true; }
    else if (e.key === "ArrowDown") { setFocal((f) => ({ x: f.x, y: Math.min(1, f.y + step) })); handled = true; }
    else if (e.key === "Enter" || e.key === " ") { setFocal({ x: 0.5, y: 0.5 }); handled = true; }
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const handleApply = useCallback(() => {
    onApply({ cropAspect: aspect, focalPoint: focal });
    const filter = composeFilter({ brightness, contrast, saturate, blur });
    onApplyFilter?.(filter);
    onClose();
  }, [aspect, focal, brightness, contrast, saturate, blur, onApply, onApplyFilter, onClose]);

  const handleReset = useCallback(() => {
    setAspect(undefined);
    setFocal({ x: 0.5, y: 0.5 });
    setBrightness(1);
    setContrast(1);
    setSaturate(1);
    setBlur(0);
  }, []);

  const filterStyle = useMemo(() => ({ filter: composeFilter({ brightness, contrast, saturate, blur }) || undefined } as React.CSSProperties), [brightness, contrast, saturate, blur]);

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="w-full">
        <DialogHeader>
          {/* i18n-exempt -- PB-2416: editor-only dialog copy */}
          <DialogTitle>Image Editor</DialogTitle>
          {/* i18n-exempt -- PB-2416: editor-only dialog copy */}
          <DialogDescription>Choose an aspect ratio and click on the image to set the focal point.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {aspectPresets.map((a) => (
              <Button
                key={a.label}
                type="button"
                variant={a.value === aspect ? "default" : "outline"}
                onClick={() => setAspect(a.value)}
              >
                {/* i18n-exempt -- PB-2416: editor-only control label */}
                {a.label}
              </Button>
            ))}
            <div className="flex items-center gap-2">
              <Input
                placeholder="W:H (e.g. 21:9)" // i18n-exempt -- PB-2416: editor-only placeholder
                value={aspect ?? ""}
                onChange={(e) => setAspect(e.target.value || undefined)}
                className="w-40"
              />
              {/* i18n-exempt -- PB-2416: editor-only label */}
              <span className="text-xs text-muted-foreground">Custom</span>
            </div>
          </div>
          <div className="relative">
            <div
              ref={containerRef}
              className="relative w-full overflow-hidden bg-muted"
              /* eslint-disable-next-line react/forbid-dom-props -- PB-2416: dynamic aspectRatio/minHeight required for preview container sizing */
              style={
                aspectRatio
                  ? ({ aspectRatio: String(aspectRatio) } as React.CSSProperties)
                  : ({ minHeight: 240 } as React.CSSProperties)
              }
              onClick={handlePickFocal}
              role="button"
              tabIndex={0}
              aria-label="Image area: click or use arrow keys to set focal point"
              onKeyDown={handleKeyAdjust}
            >
              <Image
                src={src}
                alt="preview"
                fill
                draggable={false}
                data-aspect={aspect || "auto"}
                className="absolute inset-0 h-full w-full select-none object-cover"
                style={{ objectPosition: `${(focal.x * 100).toFixed(2)}% ${(focal.y * 100).toFixed(2)}%`, ...filterStyle }}
              />
              {/* Focal point marker */}
              <div
                className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 transform rounded-full border-2 border-white bg-primary shadow"
                /* eslint-disable-next-line react/forbid-dom-props -- PB-2416: focal marker needs dynamic left/top positioning */
                style={{ left: `${focal.x * 100}%`, top: `${focal.y * 100}%` }}
                aria-hidden
              />
            </div>
            {/* i18n-exempt -- PB-2416: editor-only hint text */}
            <p className="mt-2 text-xs text-muted-foreground">Tip: The image preview simulates responsive cropping with object-fit: cover.</p>
          </div>
          {/* Quick adjustments */}
          <div className="mt-2 space-y-3">
            {/* i18n-exempt -- PB-2416: editor-only section label */}
            <div className="text-xs font-semibold text-muted-foreground">Quick adjustments</div>
            <div className="grid grid-cols-2 items-center gap-3">
              {/* i18n-exempt -- PB-2416: editor-only label */}
              <label className="text-xs text-muted-foreground">Brightness ({Math.round(brightness * 100)}%)</label>
              <input type="range" min={0} max={200} value={Math.round(brightness * 100)} onChange={(e) => setBrightness(Number(e.target.value) / 100)} />
              {/* i18n-exempt -- PB-2416: editor-only label */}
              <label className="text-xs text-muted-foreground">Contrast ({Math.round(contrast * 100)}%)</label>
              <input type="range" min={0} max={200} value={Math.round(contrast * 100)} onChange={(e) => setContrast(Number(e.target.value) / 100)} />
              {/* i18n-exempt -- PB-2416: editor-only label */}
              <label className="text-xs text-muted-foreground">Saturation ({Math.round(saturate * 100)}%)</label>
              <input type="range" min={0} max={200} value={Math.round(saturate * 100)} onChange={(e) => setSaturate(Number(e.target.value) / 100)} />
              {/* i18n-exempt -- PB-2416: editor-only label */}
              <label className="text-xs text-muted-foreground">Blur ({blur}px)</label>
              <input type="range" min={0} max={20} value={Math.round(blur)} onChange={(e) => setBlur(Number(e.target.value))} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleReset}>{/* i18n-exempt -- PB-2416 */}Reset</Button>
          <Button type="button" onClick={handleApply}>{/* i18n-exempt -- PB-2416 */}Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
