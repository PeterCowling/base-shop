"use client";

import Image from "next/image";
import { useState, useCallback } from "react";

export interface Hotspot {
  x: number; // percentage
  y: number; // percentage
  sku?: string;
}

interface Props {
  src: string;
  alt?: string;
  hotspots?: Hotspot[];
  /** called when a hotspot is moved */
  onHotspotChange?: (index: number, x: number, y: number) => void;
  /** grid size expressed as percentage step. defaults to 5 (5%) */
  grid?: number;
}

function clamp(v: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, v));
}

export default function Lookbook({
  src,
  alt = "",
  hotspots = [],
  onHotspotChange,
  grid = 5,
}: Props) {
  const [active, setActive] = useState<number | null>(null);

  const handleDown = useCallback(
    (index: number) => (e: React.MouseEvent) => {
      e.preventDefault();
      setActive(index);
    },
    []
  );

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (active === null || !onHotspotChange) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const snap = (val: number) => Math.round(val / grid) * grid;
      const x = snap(clamp(((e.clientX - rect.left) / rect.width) * 100));
      const y = snap(clamp(((e.clientY - rect.top) / rect.height) * 100));
      onHotspotChange(active, x, y);
    },
    [active, grid, onHotspotChange]
  );

  const handleUp = useCallback(() => setActive(null), []);

  return (
    <div
      className="relative h-full w-full"
      onMouseMove={handleMove}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
    >
      {src && (
        <Image src={src} alt={alt} fill className="object-cover" />
      )}
      {hotspots.map((spot, i) => (
        <div
          key={i}
          onMouseDown={handleDown(i)}
          className="absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border-2 border-white bg-primary"
          style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
        />
      ))}
    </div>
  );
}

