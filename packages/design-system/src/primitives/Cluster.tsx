// packages/ui/src/components/atoms/primitives/Cluster.tsx
import type { HTMLAttributes, Ref } from "react";

import { cn } from "../utils/style/cn";

import { Slot } from "./slot";

type Props = HTMLAttributes<HTMLDivElement> & {
  gap?: 1 | 2 | 3 | 4 | 5 | 6;
  alignY?: "start" | "center" | "end";
  justify?: "start" | "center" | "end" | "between";
  wrap?: boolean;
  asChild?: boolean;
};

export function Cluster({
  ref,
  gap = 2,
  alignY = "center",
  justify = "start",
  wrap = true,
  asChild = false,
  className,
  ...rest
}: Props & { ref?: Ref<HTMLDivElement> }) {
  const alignClass = alignY === "start" ? "items-start" : alignY === "center" ? "items-center" : "items-end";
  const justifyClass =
    justify === "start" ? "justify-start" : justify === "center" ? "justify-center" : justify === "between" ? "justify-between" : "justify-end";
  const Comp = asChild ? Slot : "div";
  return (
    <Comp ref={ref} className={cn("flex", wrap ? "flex-wrap" : "flex-nowrap", `gap-${gap}`, alignClass, justifyClass, className)} {...rest} />
  );
}

