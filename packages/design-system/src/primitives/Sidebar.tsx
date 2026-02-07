// packages/ui/src/components/atoms/primitives/Sidebar.tsx
import type { HTMLAttributes } from "react";

import { cn } from "../utils/style/cn";

type Props = HTMLAttributes<HTMLDivElement> & {
  sideWidth?: "w-48" | "w-56" | "w-64" | "w-72" | "w-80";
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8;
  reverse?: boolean;
};

export function Sidebar({ sideWidth = "w-64", gap = 6, reverse = false, className, children, ...rest }: Props) {
  // Expect exactly two children: sidebar and content
  const kids = Array.isArray(children) ? children : [children];
  const [a, b] = kids;
  const side = <div className={cn("shrink-0", sideWidth)}>{a}</div>;
  const main = <div className="min-w-0 flex-1">{b}</div>;
  return (
    <div className={cn("flex", reverse ? "flex-row-reverse" : "flex-row", `gap-${gap}`, className)} {...rest}>
      {/* Render without array to avoid React key warnings */}
      {reverse ? (
        <>
          {main}
          {side}
        </>
      ) : (
        <>
          {side}
          {main}
        </>
      )}
    </div>
  );
}
