"use client";

import {
  useRef,
  useState,
  useEffect,
  PointerEvent as ReactPointerEvent,
} from "react";
import Image from "next/image";

export type LookbookHotspot = {
  sku?: string;
  x: number; // percentage
  y: number; // percentage
};

export type LookbookItem = {
  src?: string;
  alt?: string;
  hotspots?: LookbookHotspot[];
};

interface Props {
  items?: LookbookItem[];
  /** Callback when hotspots move. Useful in editors */
  onItemsChange?: (items: LookbookItem[]) => void;
}

const SNAP = 5; // percent step for snapping

export default function Lookbook({ items = [], onItemsChange }: Props) {
  const [list, setList] = useState<LookbookItem[]>(items);
  const listRef = useRef(list);
  const containerRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    setList(items);
  }, [items]);

  useEffect(() => {
    listRef.current = list;
  }, [list]);

  if (items.length === 0) return null;

  const handlePointerDown = (itemIdx: number, hotspotIdx: number) => (
    e: ReactPointerEvent<HTMLDivElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRefs.current[itemIdx];
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const move = (ev: PointerEvent) => {
      const rawX = ((ev.clientX - rect.left) / rect.width) * 100;
      const rawY = ((ev.clientY - rect.top) / rect.height) * 100;
      const snap = (v: number) =>
        Math.max(0, Math.min(100, Math.round(v / SNAP) * SNAP));
      const next = listRef.current.map((item, i) =>
        i === itemIdx
          ? {
              ...item,
              hotspots: item.hotspots?.map((p, idx) =>
                idx === hotspotIdx ? { ...p, x: snap(rawX), y: snap(rawY) } : p,
              ),
            }
          : item,
      );
      setList(next);
    };

    const up = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      onItemsChange?.(listRef.current);
    };

    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  };

  return (
    <div className="space-y-2">
      {list.map((item, idx) => (
        <div
          key={idx}
          ref={(el) => {
            containerRefs.current[idx] = el;
          }}
          className="relative h-full w-full"
        >
          {item.src && (
            <div className="absolute inset-0">
              <Image src={item.src} alt={item.alt ?? ""} fill className="object-cover" sizes="100vw" />
            </div>
          )}
          {item.hotspots?.map((p, i) => (
            <div
              key={i}
              onPointerDown={handlePointerDown(idx, i)}
              className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full bg-primary"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              title={p.sku}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
