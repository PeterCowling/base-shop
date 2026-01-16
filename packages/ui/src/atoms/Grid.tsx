import { forwardRef, type ComponentPropsWithoutRef, type ElementType, type Ref } from "react";
import clsx from "clsx";

type GridBreakpoint = "base" | "sm" | "md" | "lg" | "xl" | "2xl";
type GridColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type GridColumns = Partial<Record<GridBreakpoint, GridColumnCount>>;
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

const GRID_COL_CLASSES: Record<GridBreakpoint, Record<GridColumnCount, string>> = {
  base: {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    7: "grid-cols-7",
    8: "grid-cols-8",
    9: "grid-cols-9",
    10: "grid-cols-10",
    11: "grid-cols-11",
    12: "grid-cols-12",
  },
  sm: {
    1: "sm:grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-4",
    5: "sm:grid-cols-5",
    6: "sm:grid-cols-6",
    7: "sm:grid-cols-7",
    8: "sm:grid-cols-8",
    9: "sm:grid-cols-9",
    10: "sm:grid-cols-10",
    11: "sm:grid-cols-11",
    12: "sm:grid-cols-12",
  },
  md: {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
    7: "md:grid-cols-7",
    8: "md:grid-cols-8",
    9: "md:grid-cols-9",
    10: "md:grid-cols-10",
    11: "md:grid-cols-11",
    12: "md:grid-cols-12",
  },
  lg: {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "lg:grid-cols-6",
    7: "lg:grid-cols-7",
    8: "lg:grid-cols-8",
    9: "lg:grid-cols-9",
    10: "lg:grid-cols-10",
    11: "lg:grid-cols-11",
    12: "lg:grid-cols-12",
  },
  xl: {
    1: "xl:grid-cols-1",
    2: "xl:grid-cols-2",
    3: "xl:grid-cols-3",
    4: "xl:grid-cols-4",
    5: "xl:grid-cols-5",
    6: "xl:grid-cols-6",
    7: "xl:grid-cols-7",
    8: "xl:grid-cols-8",
    9: "xl:grid-cols-9",
    10: "xl:grid-cols-10",
    11: "xl:grid-cols-11",
    12: "xl:grid-cols-12",
  },
  "2xl": {
    1: "2xl:grid-cols-1",
    2: "2xl:grid-cols-2",
    3: "2xl:grid-cols-3",
    4: "2xl:grid-cols-4",
    5: "2xl:grid-cols-5",
    6: "2xl:grid-cols-6",
    7: "2xl:grid-cols-7",
    8: "2xl:grid-cols-8",
    9: "2xl:grid-cols-9",
    10: "2xl:grid-cols-10",
    11: "2xl:grid-cols-11",
    12: "2xl:grid-cols-12",
  },
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
      ? (Object.entries(columns) as Array<[GridBreakpoint, GridColumnCount | undefined]>)
          .filter(([, value]) => typeof value === "number")
          .map(([key, value]) => GRID_COL_CLASSES[key][value as GridColumnCount])
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
