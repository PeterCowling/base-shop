"use client";
import { useState } from "react";
import { cn } from "../../../../utils/style";

export interface TabsAccordionContainerProps {
  children?: React.ReactNode;
  mode?: "tabs" | "accordion";
  tabs?: string[]; // titles for each child panel
  className?: string;
}

export default function TabsAccordionContainer({ children, mode = "tabs", tabs, className }: TabsAccordionContainerProps) {
  const items = Array.isArray(children) ? children : children ? [children] : [];
  const titles = tabs && tabs.length === items.length ? tabs : items.map((_, i) => `Tab ${i + 1}`);
  const [active, setActive] = useState(0);

  if (mode === "accordion") {
    return (
      <div className={className}>
        {items.map((child, i) => (
          <div key={i} className="border-b">
            <button
              type="button"
              className="w-full px-3 py-2 text-start font-medium"
              onClick={() => setActive((prev) => (prev === i ? -1 : i))}
              aria-expanded={active === i}
            >
              {titles[i]}
            </button>
            <div className={cn("overflow-hidden transition-all", active === i ? "max-h-[1000px]" : "max-h-0")}>{child}</div>
          </div>
        ))}
      </div>
    );
  }

  // tabs mode
  return (
    <div className={className}>
      <div className="flex gap-2 border-b">
        {titles.map((t, i) => (
          <button
            key={i}
            type="button"
            className={cn("-mb-px border-b-2 px-3 py-2 text-sm", active === i ? "border-foreground" : "border-transparent text-muted-foreground")}
            onClick={() => setActive(i)}
            aria-selected={active === i}
            role="tab"
          >
            {t}
          </button>
        ))}
      </div>
      <div className="py-3" role="tabpanel">{items[active]}</div>
    </div>
  );
}

