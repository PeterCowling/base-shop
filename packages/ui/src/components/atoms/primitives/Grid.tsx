// packages/ui/src/components/atoms/primitives/Grid.tsx
import { cn } from "../../../utils/style/cn";
import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
};

export function Grid({ cols = 2, gap = 4, className, ...rest }: Props) {
  return <div className={cn("grid", `grid-cols-${cols}`, `gap-${gap}`, className)} {...rest} />;
}

