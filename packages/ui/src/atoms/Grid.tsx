import { forwardRef, type ComponentPropsWithoutRef, type ElementType, type Ref } from "react";
import clsx from "clsx";

type GridBreakpoint = "base" | "sm" | "md" | "lg" | "xl" | "2xl";
type GridColumns = Partial<Record<GridBreakpoint, 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12>>;
type GridGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;

const GAP_CLASS: Record<GridGap, string> = {
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

const BREAKPOINT_PREFIX: Record<Exclude<GridBreakpoint, "base">, string> = {
  sm: "sm:",
  md: "md:",
  lg: "lg:",
  xl: "xl:",
  "2xl": "2xl:",
};

type GridProps<T extends ElementType> = {
  as?: T;
  columns?: GridColumns;
  gap?: GridGap;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "columns" | "gap">;

type GridComponent = <T extends ElementType = "div">(
  props: GridProps<T> & { ref?: Ref<HTMLElement> }
) => JSX.Element;

const Grid = forwardRef(
  <T extends ElementType = "div">(
    { as, columns, gap = 6, className, ...rest }: GridProps<T>,
    ref: Ref<HTMLElement>
  ) => {
    const Component = (as ?? "div") as ElementType;
    const columnClasses = columns
      ? Object.entries(columns)
          .filter(([, value]) => typeof value === "number")
          .map(([key, value]) => {
            if (key === "base") {
              return `grid-cols-${value}`;
            }
            const prefix = BREAKPOINT_PREFIX[key as Exclude<GridBreakpoint, "base">];
            return `${prefix}grid-cols-${value}`;
          })
      : [];

    return (
      <Component
        ref={ref as never}
        className={clsx("grid", GAP_CLASS[gap], columnClasses, className)}
        {...rest}
      />
    );
  }
) as GridComponent & { displayName?: string };

Grid.displayName = "Grid";

export { Grid };
export type { GridProps, GridColumns, GridGap };
