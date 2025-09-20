"use client";

import { useEffect, useMemo, useState, useRef } from "react";

type MenuItem = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};
type MenuSeparator = { type: "separator" };

type Props = {
  x: number;
  y: number;
  open: boolean;
  onClose: () => void;
  items: (MenuItem | MenuSeparator)[];
};

/**
 * Lightweight context menu rendered at fixed page coordinates.
 * Closes on outside click, blur or Escape.
 */
export default function ContextMenu({ x, y, open, onClose, items }: Props) {
  const style = useMemo(() => ({ left: x, top: y }), [x, y]);
  // Active is a pointer into actionable indices only
  const actionable = useMemo(() => items
    .map((it, idx) => ({ it, idx }))
    .filter(({ it }) => !("type" in it && it.type === "separator") && !(it as MenuItem).disabled), [items]);
  const [activePos, setActivePos] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest("[data-pb-contextmenu]") && !target?.closest("[data-pb-contextmenu-trigger]")) {
        onClose();
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", handle);
    window.addEventListener("contextmenu", handle);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", handle);
      window.removeEventListener("contextmenu", handle);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    // Focus the first enabled item on open
    const firstPos = 0;
    const idx = actionable[firstPos]?.idx ?? -1;
    setActivePos(firstPos);
    const el = idx >= 0 ? rootRef.current?.querySelector<HTMLButtonElement>(`[data-index='${idx}']`) : null;
    el?.focus();
  }, [open, actionable]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    const max = actionable.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextPos = activePos >= max ? 0 : activePos + 1;
      setActivePos(nextPos);
      const nextIdx = actionable[nextPos]?.idx ?? -1;
      const btn = nextIdx >= 0 ? rootRef.current?.querySelector<HTMLButtonElement>(`[data-index='${nextIdx}']`) : null;
      btn?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevPos = activePos <= 0 ? max : activePos - 1;
      setActivePos(prevPos);
      const prevIdx = actionable[prevPos]?.idx ?? -1;
      const btn = prevIdx >= 0 ? rootRef.current?.querySelector<HTMLButtonElement>(`[data-index='${prevIdx}']`) : null;
      btn?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const entry = actionable[activePos];
      const item = entry?.it as MenuItem | undefined;
      if (item) {
        item.onClick?.();
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed z-[1000] min-w-[10rem] overflow-hidden rounded border bg-popover p-1 text-popover-foreground shadow-md"
      style={style}
      role="menu"
      data-pb-contextmenu
      tabIndex={-1}
      ref={rootRef}
      onKeyDown={onKeyDown}
    >
      {items.map((i, idx) => {
        if ((i as MenuSeparator).type === "separator") {
          return <div key={`sep-${idx}`} role="separator" className="my-1 h-px bg-border" />;
        }
        const item = i as MenuItem;
        const isActive = actionable[activePos]?.idx === idx;
        return (
          <button
            key={item.label}
            type="button"
            className={`w-full rounded px-2 py-1 text-left text-sm hover:bg-muted focus:outline-none ${item.disabled ? "cursor-not-allowed opacity-50" : isActive ? "ring-1 ring-primary" : ""}`}
            onClick={() => {
              if (item.disabled) return;
              item.onClick?.();
              onClose();
            }}
            role="menuitem"
            disabled={item.disabled}
            data-index={idx}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
