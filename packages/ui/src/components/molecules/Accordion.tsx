import React from "react";

export interface AccordionItem {
  /** Heading shown in the accordion summary */
  title: React.ReactNode;
  /** Content revealed when the item is expanded */
  content: React.ReactNode;
}

export interface AccordionProps {
  /** Collection of accordion items to render */
  items: AccordionItem[];
}

/**
 * Simple accordion component rendering a list of expandable items.
 * Uses native `<details>` / `<summary>` elements for accessibility.
 */
export default function Accordion({ items }: AccordionProps) {
  if (!items?.length) return null;
  return (
    <div className="divide-y rounded border">
      {items.map((item, idx) => (
        <details key={idx} className="group">
          <summary className="cursor-pointer select-none p-4 font-medium focus:outline-none focus-visible:ring">
            {item.title}
          </summary>
          <div className="p-4 pt-0">{item.content}</div>
        </details>
      ))}
    </div>
  );
}

