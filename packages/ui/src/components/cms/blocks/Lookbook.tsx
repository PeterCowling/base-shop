"use client";

import { useRef, useState, useEffect, PointerEvent as ReactPointerEvent } from "react";

export type LookbookHotspot = {
  sku?: string;
  x: number; // percentage
  y: number; // percentage
};

interface Props {
  src?: string;
  alt?: string;
  hotspots?: LookbookHotspot[];
  /** Callback when hotspots are moved. Useful in editors */
  onHotspotsChange?: (hotspots: LookbookHotspot[]) => void;
}

const SNAP = 5; // percent step for snapping

export default function Lookbook({ src, alt = "", hotspots = [], onHotspotsChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<LookbookHotspot[]>(hotspots);
  const pointsRef = useRef(points);

  useEffect(() => {
    setPoints(hotspots);
  }, [hotspots]);

  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  const handlePointerDown = (index: number) => (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const move = (ev: PointerEvent) => {
      const rawX = ((ev.clientX - rect.left) / rect.width) * 100;
      const rawY = ((ev.clientY - rect.top) / rect.height) * 100;
      const snap = (v: number) => Math.max(0, Math.min(100, Math.round(v / SNAP) * SNAP));
      const next = pointsRef.current.map((p, i) =>
        i === index ? { ...p, x: snap(rawX), y: snap(rawY) } : p,
      );
      setPoints(next);
    };

    const up = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      onHotspotsChange?.(pointsRef.current);
    };

    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  };

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      )}
      {points.map((p, idx) => (
        <div
          key={idx}
          onPointerDown={handlePointerDown(idx)}
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full bg-primary"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          title={p.sku}
        />
      ))}
    </div>
  );
}

