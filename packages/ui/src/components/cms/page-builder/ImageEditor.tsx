"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export default function ImageEditor({ open, src, initial, onClose, onApply }: Props) {
  const [aspect, setAspect] = useState<string | undefined>(initial?.cropAspect);
  const [focal, setFocal] = useState<FocalPoint>(initial?.focalPoint ?? { x: 0.5, y: 0.5 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setAspect(initial?.cropAspect);
      setFocal(initial?.focalPoint ?? { x: 0.5, y: 0.5 });
    }
  }, [open, initial?.cropAspect, initial?.focalPoint]);

  const aspectRatio = useMemo(() => parseAspect(aspect), [aspect]);

  const handlePickFocal = useCallback((e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setFocal({ x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) });
  }, []);

  const handleApply = useCallback(() => {
    onApply({ cropAspect: aspect, focalPoint: focal });
    onClose();
  }, [aspect, focal, onApply, onClose]);

  const handleReset = useCallback(() => {
    setAspect(undefined);
    setFocal({ x: 0.5, y: 0.5 });
  }, []);

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Image Editor</DialogTitle>
          <DialogDescription>
            Choose an aspect ratio and click on the image to set the focal point.
          </DialogDescription>
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
                {a.label}
              </Button>
            ))}
            <div className="flex items-center gap-2">
              <Input
                placeholder="W:H (e.g. 21:9)"
                value={aspect ?? ""}
                onChange={(e) => setAspect(e.target.value || undefined)}
                className="w-40"
              />
              <span className="text-xs text-muted-foreground">Custom</span>
            </div>
          </div>
          <div className="relative">
            <div
              ref={containerRef}
              className="relative w-full overflow-hidden bg-muted"
              style={
                aspectRatio
                  ? ({ aspectRatio: String(aspectRatio) } as React.CSSProperties)
                  : ({ minHeight: 240 } as React.CSSProperties)
              }
              onClick={handlePickFocal}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt="preview"
                className="absolute inset-0 h-full w-full select-none object-cover"
                draggable={false}
                style={{ objectPosition: `${(focal.x * 100).toFixed(2)}% ${(focal.y * 100).toFixed(2)}%` }}
              />
              {/* Focal point marker */}
              <div
                className="absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 transform rounded-full border-2 border-white bg-primary shadow"
                style={{ left: `${focal.x * 100}%`, top: `${focal.y * 100}%` }}
                aria-hidden
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Tip: The image preview simulates responsive cropping with object-fit: cover.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button type="button" onClick={handleApply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

