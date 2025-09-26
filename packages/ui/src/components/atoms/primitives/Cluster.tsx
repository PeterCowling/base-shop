// packages/ui/src/components/atoms/primitives/Cluster.tsx
import { cn } from "../../../utils/style/cn";
import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  gap?: 1 | 2 | 3 | 4 | 5 | 6;
  alignY?: "start" | "center" | "end";
  justify?: "start" | "center" | "end" | "between";
  wrap?: boolean;
};

export function Cluster({ gap = 2, alignY = "center", justify = "start", wrap = true, className, ...rest }: Props) {
  const alignClass = alignY === "start" ? "items-start" : alignY === "center" ? "items-center" : "items-end";
  const justifyClass =
    justify === "start" ? "justify-start" : justify === "center" ? "justify-center" : justify === "between" ? "justify-between" : "justify-end";
  return (
    <div className={cn("flex", wrap ? "flex-wrap" : "flex-nowrap", `gap-${gap}`, alignClass, justifyClass, className)} {...rest} />
  );
}

