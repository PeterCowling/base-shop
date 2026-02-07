// packages/ui/src/components/atoms/primitives/Stack.tsx
// i18n-exempt file -- DS-1234 [ttl=2025-11-30] — contains only CSS utility class names and design tokens
import type { HTMLAttributes, Ref } from "react";

import { cn } from "../utils/style/cn";

import { Slot } from "./slot";

type Props = HTMLAttributes<HTMLDivElement> & {
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  align?: "start" | "center" | "end" | "stretch";
  asChild?: boolean;
};

export function Stack({
  ref,
  gap = 3,
  align = "stretch",
  asChild = false,
  className,
  ...rest
}: Props & { ref?: Ref<HTMLDivElement> }) {
  const alignClass =
    align === "start" ? "items-start" : align === "center" ? "items-center" : align === "end" ? "items-end" : "items-stretch";
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={ref}
      className={cn("flex flex-col", `gap-${gap}`, alignClass, className)}
      {...rest}
    />
  );
}
