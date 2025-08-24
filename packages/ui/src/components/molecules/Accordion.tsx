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

  const toggle = (idx: number) => {
    setOpen((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const isOpen = open.includes(idx);
        return (
          <div key={idx} className="rounded border">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggle(idx)}
              className="flex w-full items-center justify-between p-2 text-left"
            >
              <span>{item.title}</span>
              <span>{isOpen ? "-" : "+"}</span>
            </button>
            {isOpen && <div className="border-t p-2">{item.content}</div>}
          </div>
        );
      })}
    </div>
  );
}

export default Accordion;
