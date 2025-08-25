"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@ui/components/atoms";

interface Props {
  inspectMode?: boolean;
  onTokenSelect?: (token: string, coords: { x: number; y: number }) => void;
  children: React.ReactElement;
}

export default function TokenInspector({
  inspectMode = false,
  onTokenSelect,
  children,
}: Props) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const tokenElsRef = useRef<HTMLElement[]>([]);
  const [hoverEl, setHoverEl] = useState<HTMLElement | null>(null);
  const [selected, setSelected] = useState<{ el: HTMLElement; token: string } | null>(
    null
  );
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (!hoverEl || selected?.el === hoverEl) return;
    const prev = hoverEl.style.outline;
    hoverEl.style.outline = "2px solid #3b82f6";
    return () => {
      hoverEl.style.outline = prev;
    };
  }, [hoverEl, selected]);

  useEffect(() => {
    if (!selected || !popoverOpen) return;
    const el = selected.el;
    const prevOutline = el.style.outline;
    const prevAnimation = el.style.animation;
    el.style.outline = "2px solid #3b82f6";
    el.style.animation = "wizard-outline 1s ease-in-out infinite";
    return () => {
      el.style.outline = prevOutline;
      el.style.animation = prevAnimation;
    };
  }, [selected, popoverOpen]);

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.textContent =
      "@keyframes wizard-outline{0%,100%{outline-color:#3b82f6;}50%{outline-color:#93c5fd;}}";
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  useEffect(() => {
    if (!inspectMode || !previewRef.current) return;
    tokenElsRef.current = Array.from(
      previewRef.current.querySelectorAll("[data-token]")
    ) as HTMLElement[];
  }, [inspectMode, children]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!inspectMode || popoverOpen) return;
    const el = (e.target as HTMLElement).closest(
      "[data-token]"
    ) as HTMLElement | null;
    setHoverEl(el);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!inspectMode) return;
    const el = (e.target as HTMLElement).closest(
      "[data-token]"
    ) as HTMLElement | null;
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    const token = el.getAttribute("data-token");
    if (!token) return;
    const rect = el.getBoundingClientRect();
    setSelected({ el, token });
    setPopoverPos({ x: rect.left + rect.width / 2, y: rect.bottom });
    setPopoverOpen(true);
    const idx = tokenElsRef.current.indexOf(el);
    if (idx >= 0) setSelectedIndex(idx);
  };

  const handleLeave = () => {
    if (!inspectMode || popoverOpen) return;
    setHoverEl(null);
  };

  const selectByIndex = (idx: number) => {
    const els = tokenElsRef.current;
    if (!els.length) return;
    const el = els[idx];
    const token = el.getAttribute("data-token");
    if (!token) return;
    const rect = el.getBoundingClientRect();
    setSelected({ el, token });
    setPopoverPos({ x: rect.left + rect.width / 2, y: rect.bottom });
    setPopoverOpen(true);
    setSelectedIndex(idx);
  };

  useEffect(() => {
    if (!inspectMode) return;
    const keyHandler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        const next =
          selectedIndex + 1 < tokenElsRef.current.length
            ? selectedIndex + 1
            : 0;
        selectByIndex(next);
      } else if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        const prev =
          selectedIndex - 1 >= 0
            ? selectedIndex - 1
            : tokenElsRef.current.length - 1;
        selectByIndex(prev);
      }
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [inspectMode, selectedIndex]);

  return (
    <>
      {React.cloneElement(children, {
        ref: (node: HTMLDivElement) => {
          previewRef.current = node;
          const { ref } = children as any;
          if (typeof ref === "function") ref(node);
          else if (ref)
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        },
        onPointerMove: handlePointerMove,
        onClickCapture: handleClick,
        onPointerLeave: handleLeave,
        className: `${children.props.className ?? ""} ${inspectMode ? "cursor-crosshair" : ""}`,
      })}
      {selected && popoverPos && (
        <Popover
          open={popoverOpen}
          onOpenChange={(o: boolean) => {
            setPopoverOpen(o);
            if (!o) {
              setSelected(null);
              setSelectedIndex(-1);
            }
          }}
        >
          <PopoverAnchor asChild>
            <div
              style={{
                position: "fixed",
                left: popoverPos.x,
                top: popoverPos.y,
              }}
            />
          </PopoverAnchor>
          <PopoverContent side="top" align="center">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs">{selected.token}</span>
              <Button
                className="px-2 py-1 text-xs"
                onClick={() => onTokenSelect?.(selected.token, popoverPos)}
              >
                Jump to editor
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}
