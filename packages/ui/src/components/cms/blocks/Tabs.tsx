"use client";
import { useState, type ReactNode } from "react";
import { cn } from "../../../utils/style";
import { Inline } from "../../../components/atoms/primitives/Inline";

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
            key={i}
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
            /* eslint-disable ds/no-hardcoded-copy -- ABC-123: class names are not user copy */
            className={cn(
              "border-b-2 px-3 py-1 text-sm",
              i === safeIndex
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            /* eslint-enable ds/no-hardcoded-copy */
          >
            {label}
          </button>
        ))}
      </Inline>
      <div className="pt-4">{contents[safeIndex]}</div>
    </div>
  );
}
