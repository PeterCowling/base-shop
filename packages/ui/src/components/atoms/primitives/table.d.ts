import * as React from "react";
/**
 * Basic, unopinionated table primitives (shadcn-ui style).
 * Each component forwards props / className so you can style with Tailwind.
 */
export type TableProps = React.HTMLAttributes<HTMLTableElement>;
export declare const Table: React.ForwardRefExoticComponent<
  TableProps & React.RefAttributes<HTMLTableElement>
>;
export type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>;
export declare const TableHeader: React.ForwardRefExoticComponent<
  TableHeaderProps & React.RefAttributes<HTMLTableSectionElement>
>;
export type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;
export declare const TableBody: React.ForwardRefExoticComponent<
  TableBodyProps & React.RefAttributes<HTMLTableSectionElement>
>;
export type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>;
export declare const TableRow: React.ForwardRefExoticComponent<
  TableRowProps & React.RefAttributes<HTMLTableRowElement>
>;
export type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement>;
export declare const TableHead: React.ForwardRefExoticComponent<
  TableHeadProps & React.RefAttributes<HTMLTableCellElement>
>;
export type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;
export declare const TableCell: React.ForwardRefExoticComponent<
  TableCellProps & React.RefAttributes<HTMLTableCellElement>
>;
//# sourceMappingURL=table.d.ts.map