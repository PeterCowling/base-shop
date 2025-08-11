import { useState } from "react";

export interface AccordionItem {
  title: React.ReactNode;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
}

export default function Accordion({ items }: AccordionProps) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y">
      {items.map((item, idx) => (
        <div key={idx} className="py-2">
          <button
            type="button"
            className="flex w-full items-center justify-between py-2 text-left"
            onClick={() => setOpen(open === idx ? null : idx)}
          >
            <span>{item.title}</span>
            <span>{open === idx ? "-" : "+"}</span>
          </button>
          {open === idx && <div className="mt-2">{item.content}</div>}
        </div>
      ))}
    </div>
  );
}

