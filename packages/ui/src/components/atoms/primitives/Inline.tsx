// packages/ui/src/components/atoms/primitives/Inline.tsx
import { cn } from "../../../utils/style/cn";
import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  alignY?: "start" | "center" | "end" | "baseline";
  wrap?: boolean;
};

export function Inline({ gap = 2, alignY = "center", wrap = true, className, ...rest }: Props) {
  const alignClass =
    alignY === "start"
      ? "items-start"
      : alignY === "center"
      ? "items-center"
      : alignY === "end"
      ? "items-end"
      : "items-baseline";
  return <div className={cn("flex", wrap ? "flex-wrap" : "flex-nowrap", `gap-${gap}`, alignClass, className)} {...rest} />;
}

