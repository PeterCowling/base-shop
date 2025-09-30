// packages/ui/src/components/atoms/primitives/Stack.tsx
import { cn } from "../../../utils/style/cn";
// i18n-exempt file -- DS-1234 [ttl=2025-11-30] — contains only CSS utility class names and design tokens
import type { HTMLAttributes, Ref } from "react";
import { forwardRef } from "react";
import { Slot } from "./slot";

type Props = HTMLAttributes<HTMLElement> & {
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  align?: "start" | "center" | "end" | "stretch";
  asChild?: boolean;
};

export const Stack = forwardRef<HTMLElement, Props>(function Stack(
  { gap = 3, align = "stretch", asChild = false, className, ...rest },
  ref
) {
  const alignClass =
    align === "start" ? "items-start" : align === "center" ? "items-center" : align === "end" ? "items-end" : "items-stretch";
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={ref as Ref<HTMLElement>}
      className={cn("flex flex-col", `gap-${gap}`, alignClass, className)}
      {...rest}
    />
  );
});
