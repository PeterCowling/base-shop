import * as React from "react";
import { cn } from "../../utils/style";

export interface AccordionItem {
  /** Title displayed in the trigger button */
  title: React.ReactNode;
  /** Content shown when the item is expanded */
  content: React.ReactNode;
}

export interface AccordionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Collection of accordion items */
  items: AccordionItem[];
}

/**
 * Simple accordion component allowing multiple items to be expanded
 * simultaneously.
 */
export default function Accordion({ items, className, ...props }: AccordionProps) {
  const [open, setOpen] = React.useState<Set<number>>(new Set());

  const toggle = (idx: number) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {items.map((item, idx) => {
        const isOpen = open.has(idx);
        return (
          <div key={idx} className="rounded border">
            <button
              type="button"
              className="flex w-full items-center justify-between p-4 text-left"
              onClick={() => toggle(idx)}
              aria-expanded={isOpen}
            >
              <span>{item.title}</span>
              <span className="ml-2 select-none">{isOpen ? "-" : "+"}</span>
            </button>
            {isOpen && <div className="border-t p-4">{item.content}</div>}
          </div>
        );
      })}
    </div>
  );
}
