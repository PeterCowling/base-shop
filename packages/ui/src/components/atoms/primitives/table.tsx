// packages/ui/components/atoms/primitives/table.tsx
// i18n-exempt: primitives expose no user-facing copy

import * as React from "react";
import { cn } from "../../../utils/style";

/**
 * Basic, unopinionated table primitives (shadcn-ui style).
 * Each component forwards props / className so you can style with Tailwind.
 */

export type TableProps = React.HTMLAttributes<HTMLTableElement>;

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto">
      <table
        ref={ref}
        // i18n-exempt: classes only
        className={cn("text-foreground w-full text-start text-sm bg-surface-1", className)}
        {...props}
      />
    </div>
  )
);
Table.displayName = "Table"; // i18n-exempt: component displayName

export type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>;

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps
>(({ className, ...props }, ref) => (
  // i18n-exempt: classes only
  <thead ref={ref} className={cn("bg-panel border-b border-border-2", className)} {...props} />
));
TableHeader.displayName = "TableHeader"; // i18n-exempt: component displayName

export type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;

export const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn(className)} {...props} />
  )
);
TableBody.displayName = "TableBody"; // i18n-exempt: component displayName

export type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>;

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        // i18n-exempt: classes only
        "border-b border-border-1 transition-colors hover:bg-surface-2 data-[state=selected]:bg-surface-3",
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow"; // i18n-exempt: component displayName

export type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement>;

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      // i18n-exempt: classes only
      className={cn("text-foreground px-4 py-2 font-semibold", className)}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead"; // i18n-exempt: component displayName

export type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <>
      {/* i18n-exempt: classes only */}
      <td ref={ref} className={cn("px-4 py-2 align-middle", className)} {...props} />
    </>
  )
);
TableCell.displayName = "TableCell"; // i18n-exempt: component displayName
