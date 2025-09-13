"use client";
import { useState, type ReactNode } from "react";
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
  const [current, setCurrent] = useState(active);
  const contents = Array.isArray(children) ? children : [children];

  const safeIndex = Math.min(current, Math.max(contents.length - 1, 0));

  return (
    <div className={className}>
      <div className="flex gap-2 border-b pb-2">
        {labels.map((label, i) => (
          <button
            type="button"
            key={i}
            onClick={() => setCurrent(i)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                e.preventDefault();
                setCurrent((i + 1) % labels.length);
              } else if (e.key === "ArrowLeft") {
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
      </div>
      <div className="pt-4">{contents[safeIndex]}</div>
    </div>
  );
}
