// packages/ui/components/atoms/primitives/table.tsx
// i18n-exempt file -- DS-1234 [ttl=2025-11-30] — primitives expose no user-facing copy

import * as React from "react";

import { cn } from "../utils/style";

/**
 * Basic, unopinionated table primitives (shadcn-ui style).
 * Each component forwards props / className so you can style with Tailwind.
 */

export type TableProps = React.HTMLAttributes<HTMLTableElement>;

export const Table = (
  {
    ref,
    className,
    ...props
  }: TableProps & {
    ref?: React.Ref<HTMLTableElement>;
  }
) => (<div className="w-full overflow-x-auto">
  <table
    ref={ref}
    // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    className={cn("text-foreground w-full text-left text-sm", className)}
    {...props}
  />
</div>);

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
(<thead ref={ref} className={cn("bg-panel border-b border-border-2", className)} {...props} />);

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

export type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement>;

export const TableHead = (
  {
    ref,
    className,
    ...props
  }: TableHeadProps & {
    ref?: React.Ref<HTMLTableCellElement>;
  }
) => (<th
  ref={ref}
  // i18n-exempt -- DS-1234 [ttl=2025-11-30]
  className={cn("text-foreground px-4 py-2 font-semibold", className)}
  {...props}
/>);

export type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

export const TableCell = (
  {
    ref,
    className,
    ...props
  }: TableCellProps & {
    ref?: React.Ref<HTMLTableCellElement>;
  }
) => (<>
  {/* i18n-exempt: classes only */}
  <td ref={ref} className={cn("px-4 py-2 align-middle", className)} {...props} />
</>);
