// packages/ui/src/components/atoms/primitives/Inline.tsx
import { cn } from "../../../utils/style/cn";
import * as React from "react";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  alignY?: "start" | "center" | "end" | "baseline";
  wrap?: boolean;
};

export const Inline = React.forwardRef<HTMLDivElement, Props>(
  ({ gap = 2, alignY = "center", wrap = true, className, ...rest }, ref) => {
    const alignClass =
      alignY === "start"
        ? "items-start"
        : alignY === "center"
        ? "items-center"
        : alignY === "end"
        ? "items-end"
        : "items-baseline";
    return (
      <div
        ref={ref}
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
