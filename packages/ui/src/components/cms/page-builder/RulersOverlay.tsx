"use client";

import { useEffect, useMemo, useState } from "react";

interface Props {
  show?: boolean;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  step?: number;
}

export default function RulersOverlay({ show = false, canvasRef, step = 50 }: Props) {
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const el = canvasRef?.current;
    if (!el) return;
    const update = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const RO = (window as any).ResizeObserver;
    const ro = RO ? new RO(() => update()) : null;
    if (ro) ro.observe(el);
    return () => { if (ro) ro.disconnect(); };
  }, [canvasRef]);

  const labelsX = useMemo(() => {
    const arr: number[] = [];
    if (!size.w) return arr;
    for (let x = step; x < size.w; x += step) arr.push(x);
    return arr;
  }, [size.w, step]);
  const labelsY = useMemo(() => {
    const arr: number[] = [];
    if (!size.h) return arr;
    for (let y = step; y < size.h; y += step) arr.push(y);
    return arr;
  }, [size.h, step]);

  if (!show) return null;
  const major = "#9993", minor = "#9992";
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <div
        aria-hidden
        className="absolute left-0 right-0 h-5"
        style={{
          backgroundImage: `repeating-linear-gradient(to right, ${minor}, ${minor} 1px, transparent 1px, transparent 10px), repeating-linear-gradient(to right, ${major}, ${major} 1px, transparent 1px, transparent 50px)`,
        }}
      />
      <div
        aria-hidden
        className="absolute top-0 bottom-0 w-5"
        style={{
          backgroundImage: `repeating-linear-gradient(to bottom, ${minor}, ${minor} 1px, transparent 1px, transparent 10px), repeating-linear-gradient(to bottom, ${major}, ${major} 1px, transparent 1px, transparent 50px)`,
        }}
      />
      {/* Label every 100px */}
      {labelsX.map((x) => (
        <div key={`lx-${x}`} className="absolute top-0 text-[10px] text-muted-foreground" style={{ left: x + 2 }}>
          {x}
        </div>
      ))}
      {labelsY.map((y) => (
        <div key={`ly-${y}`} className="absolute left-0 text-[10px] text-muted-foreground" style={{ top: y + 2 }}>
          {y}
        </div>
      ))}
    </div>
  );
}
