// packages/ui/components/atoms/primitives/table.tsx
// i18n-exempt file -- DS-1234 [ttl=2025-11-30] — primitives expose no user-facing copy

import * as React from "react";

import { cn } from "../utils/style";

import { type PrimitiveDensity, resolveDensityClass } from "./density";

/**
 * Basic, unopinionated table primitives (shadcn-ui style).
 * Each component forwards props / className so you can style with Tailwind.
 */

export type TableCompatibilityMode = "default" | "no-wrapper";

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /**
   * Compatibility mode for migration scenarios where an extra wrapper div would
   * change layout contracts.
   */
  compatibilityMode?: TableCompatibilityMode;
  /** Applies default density to `TableHead` and `TableCell` children. */
  density?: PrimitiveDensity;
}

const TableDensityContext = React.createContext<PrimitiveDensity>("comfortable");

export const Table = (
  {
    ref,
    className,
    compatibilityMode = "default",
    density = "comfortable",
    ...props
  }: TableProps & {
    ref?: React.Ref<HTMLTableElement>;
  }
) => {
  const tableNode = (
    <TableDensityContext value={density}>
      <table
        ref={ref}
        // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        className={cn("text-foreground w-full text-left text-sm", className)}
        {...props}
      />
    </TableDensityContext>
  );

  if (compatibilityMode === "no-wrapper") {
    return tableNode;
  }

  return <div className="w-full overflow-x-auto">{tableNode}</div>;
};

export type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>;

export const TableHeader = (
  {
    ref,
    className,
    ...props
  }: TableHeaderProps & {
    ref?: React.Ref<HTMLTableSectionElement>;
  }
) => // i18n-exempt -- DS-1234 [ttl=2025-11-30]
(<thead ref={ref} className={cn("bg-panel text-foreground border-b border-border-2", className)} {...props} />);

export type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;

export const TableBody = (
  {
    ref,
    className,
    ...props
  }: TableBodyProps & {
    ref?: React.Ref<HTMLTableSectionElement>;
  }
) => (<tbody ref={ref} className={cn(className)} {...props} />);

export type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>;

export const TableRow = (
  {
    ref,
    className,
    ...props
  }: TableRowProps & {
    ref?: React.Ref<HTMLTableRowElement>;
  }
) => (<tr
  ref={ref}
  className={cn(
    // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    "border-b border-border-1 transition-colors hover:bg-surface-2 data-[state=selected]:bg-surface-3",
    className
  )}
  {...props}
/>);

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Header cell density override for this column. */
  density?: PrimitiveDensity;
}

export const TableHead = (
  {
    ref,
    className,
    density,
    ...props
  }: TableHeadProps & {
    ref?: React.Ref<HTMLTableCellElement>;
  }
) => {
  const tableDensity = React.use(TableDensityContext);
  const densityClass = resolveDensityClass({
    density: density ?? tableDensity,
    comfortableClass: "py-2",
    compactClass: "py-1.5",
  });

  return (<th
  ref={ref}
  // i18n-exempt -- DS-1234 [ttl=2025-11-30]
  className={cn("text-foreground px-4 font-semibold break-words", densityClass, className)}
  {...props}
/>);
};

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /** Body cell density override for this cell. */
  density?: PrimitiveDensity;
}

export const TableCell = (
  {
    ref,
    className,
    density,
    ...props
  }: TableCellProps & {
    ref?: React.Ref<HTMLTableCellElement>;
  }
) => {
  const tableDensity = React.use(TableDensityContext);
  const densityClass = resolveDensityClass({
    density: density ?? tableDensity,
    comfortableClass: "py-2",
    compactClass: "py-1.5",
  });

  return (<>
  {/* i18n-exempt: classes only */}
  <td
    ref={ref}
    className={cn("px-4 align-middle min-w-0 break-words", densityClass, className)}
    {...props}
  />
</>);
};
