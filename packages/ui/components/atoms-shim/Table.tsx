import type { ComponentProps } from "react";
import {
  Table as BaseTable,
  TableBody as BaseTableBody,
  TableCell as BaseTableCell,
  TableHead as BaseTableHead,
  TableHeader as BaseTableHeader,
  TableRow as BaseTableRow,
} from "../ui/table";

export type TableProps = ComponentProps<"table">;

export const Table = (props: TableProps) => <BaseTable {...props} />;

export const TableHeader = (props: ComponentProps<"thead">) => (
  <BaseTableHeader {...props} />
);

export const TableBody = (props: ComponentProps<"tbody">) => (
  <BaseTableBody {...props} />
);

export const TableRow = (props: ComponentProps<"tr">) => (
  <BaseTableRow {...props} />
);

export const TableHead = (props: ComponentProps<"th">) => (
  <BaseTableHead {...props} />
);

export const TableCell = (props: ComponentProps<"td">) => (
  <BaseTableCell {...props} />
);
