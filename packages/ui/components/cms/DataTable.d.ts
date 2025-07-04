import { ReactNode } from "react";
export interface Column<T> {
    header: string;
    render: (row: T) => ReactNode;
    width?: string;
}
export interface DataTableProps<T> {
    rows: T[];
    columns: Column<T>[];
    /** Enable checkbox row selection */
    selectable?: boolean;
    onSelectionChange?: (rows: T[]) => void;
}
export default function DataTable<T>({ rows, columns, selectable, onSelectionChange, }: DataTableProps<T>): import("react").JSX.Element;
