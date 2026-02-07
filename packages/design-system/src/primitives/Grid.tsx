// packages/ui/src/components/atoms/primitives/Grid.tsx
import type { HTMLAttributes } from "react";

import { cn } from "../utils/style/cn";

type Props = HTMLAttributes<HTMLDivElement> & {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
};

const GRID_COL_CLASS: Record<NonNullable<Props["cols"]>, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  12: "grid-cols-12",
};

const GAP_CLASS: Record<NonNullable<Props["gap"]>, string> = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
  10: "gap-10",
  12: "gap-12",
};

export function Grid({ cols = 2, gap = 4, className, ...rest }: Props) {
  return (
    <div className={cn("grid", GRID_COL_CLASS[cols], GAP_CLASS[gap], className)} {...rest} />
  );
}
