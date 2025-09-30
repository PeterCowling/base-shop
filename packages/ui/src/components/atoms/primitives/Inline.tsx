// packages/ui/src/components/atoms/primitives/Inline.tsx
import { cn } from "../../../utils/style/cn";
import * as React from "react";
import { Slot } from "./slot";

type Props = React.HTMLAttributes<HTMLElement> & {
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  alignY?: "start" | "center" | "end" | "baseline";
  wrap?: boolean;
  asChild?: boolean;
};

export const Inline = React.forwardRef<HTMLElement, Props>(
  (
    {
      gap = 2,
      alignY = "center",
      wrap = true,
      asChild = false,
      className,
      ...rest
    },
    ref,
  ) => {
    const alignClass =
      alignY === "start"
        ? "items-start"
        : alignY === "center"
        ? "items-center"
        : alignY === "end"
        ? "items-end"
        : "items-baseline";
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref as React.Ref<HTMLElement>}
        className={cn(
          "flex",
          wrap ? "flex-wrap" : "flex-nowrap",
          `gap-${gap}`,
          alignClass,
          className
        )}
        {...rest}
      />
    );
  }
);
Inline.displayName = "Inline";
