"use client";
import { type ReactNode,useState } from "react";

import { Inline } from "../../../components/atoms/primitives/Inline";
import { cn } from "../../../utils/style";

export interface TabsBlockProps {
  /** Labels for each tab */
  labels?: string[];
  /** Index of the initially active tab */
  active?: number;
  /** Tab contents; each child corresponds to the label at the same index */
  children?: ReactNode[] | ReactNode;
  className?: string;
}

export default function TabsBlock({
  labels = [],
  active = 0,
  children,
  className,
}: TabsBlockProps) {
  const KEY_RIGHT = "ArrowRight";
  const KEY_LEFT = "ArrowLeft";
  const [current, setCurrent] = useState(active);
  const contents = Array.isArray(children) ? children : [children];

  const safeIndex = Math.min(current, Math.max(contents.length - 1, 0));

  return (
    <div className={className}>
      <Inline className="border-b pb-2" gap={2}>
        {labels.map((label, i) => (
          <button
            type="button"
            key={label}
            onClick={() => setCurrent(i)}
            onKeyDown={(e) => {
              // i18n-exempt -- Keyboard event key identifiers, not UI copy
              if (e.key === KEY_RIGHT) {
                e.preventDefault();
                setCurrent((i + 1) % labels.length);
              } else if (e.key === KEY_LEFT) {
                e.preventDefault();
                setCurrent((i - 1 + labels.length) % labels.length);
              }
            }}
             
            className={cn(
              "border-b-2 px-3 py-1 text-sm",
              i === safeIndex
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
             
          >
            {label}
          </button>
        ))}
      </Inline>
      <div className="pt-4">{contents[safeIndex]}</div>
    </div>
  );
}
