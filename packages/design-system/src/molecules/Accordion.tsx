/* i18n-exempt file -- UI-000: Only non-user-facing literals (HTML attributes, class names, glyphs). Visible copy comes from props. */
"use client";
import { type ReactNode, useState } from "react";

import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "../primitives/shape-radius";
import { cn } from "../utils/style";

export interface AccordionItem {
  title: ReactNode;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Semantic item shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit item radius token override. */
  radius?: PrimitiveRadius;
}

export function Accordion({ items, shape, radius }: AccordionProps) {
  // Generate stable keys for items without relying on array index
  const keyMap = new WeakMap<AccordionItem, string>();
  let auto = 0;
  const getKey = (item: AccordionItem) => {
    const fromTitle =
      typeof item.title === "string" || typeof item.title === "number"
        ? String(item.title)
        : undefined;
    if (fromTitle) return fromTitle;
    const existing = keyMap.get(item);
    if (existing) return existing;
    const k = `item-${auto++}`;
    keyMap.set(item, k);
    return k;
  };
  const [open, setOpen] = useState<number[]>([]);
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "sm",
  });
  // i18n-exempt -- UI-000: symbolic affordances (glyphs)
  const SYMBOL_MINUS = "-" as const; // i18n-exempt -- UI-000: glyph
  const SYMBOL_PLUS = "+" as const; // i18n-exempt -- UI-000: glyph

  const toggle = (idx: number) => {
    setOpen((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const isOpen = open.includes(idx);

        const handleKeyDown = (
          event: React.KeyboardEvent<HTMLButtonElement>
        ) => {
          if (
            event.key === " " ||
            event.key === "Enter" ||
            event.key === "Space" ||
            event.key === "Spacebar"
          ) {
            event.preventDefault();
            toggle(idx);
          }
        };

        const handleClick = (
          event: React.MouseEvent<HTMLButtonElement>
        ) => {
          if (event.detail !== 0) {
            toggle(idx);
          }
        };

        return (
          <div key={getKey(item)} className={cn("border", shapeRadiusClass)}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={handleClick}
              onKeyDown={handleKeyDown}
              className="flex w-full items-center justify-between p-2 text-start min-h-11 min-w-11"
            >
              <span>{item.title}</span>
              <span aria-hidden>
                {isOpen ? SYMBOL_MINUS : SYMBOL_PLUS}
              </span>
            </button>
            {isOpen && <div className="border-t p-2">{item.content}</div>}
          </div>
        );
      })}
    </div>
  );
}

export default Accordion;
