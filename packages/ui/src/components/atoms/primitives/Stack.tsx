// packages/ui/src/components/atoms/primitives/Stack.tsx
import { cn } from "../../../utils/style/cn";
import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  align?: "start" | "center" | "end" | "stretch";
};

export function Stack({ gap = 3, align = "stretch", className, ...rest }: Props) {
  const alignClass =
    align === "start" ? "items-start" : align === "center" ? "items-center" : align === "end" ? "items-end" : "items-stretch";
  return <div className={cn("flex flex-col", `gap-${gap}`, alignClass, className)} {...rest} />;
}

