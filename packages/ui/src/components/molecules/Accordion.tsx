"use client";
import { useState, type ReactNode } from "react";

export interface AccordionItem {
  title: ReactNode;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
}

export function Accordion({ items }: AccordionProps) {
  const [open, setOpen] = useState<number[]>([]);
  // i18n-exempt — symbolic affordances
  const SYMBOL_MINUS = "-" as const; // i18n-exempt: glyph
  const SYMBOL_PLUS = "+" as const; // i18n-exempt: glyph

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
          <div key={idx} className="rounded border">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={handleClick}
              onKeyDown={handleKeyDown}
              className="flex w-full items-center justify-between p-2 text-start min-h-10 min-w-10"
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
