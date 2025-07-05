import { ReactNode } from "react";
export interface Column<T> {
    header: string;
    render: (row: T) => ReactNode;
    width?: string;
}
export interface DataTableProps<T> {
    rows: T[];
    columns: Column<T>[];
    selectable?: boolean;
    onSelectionChange?: (rows: T[]) => void;
}
export declare function DataTable<T>({ rows, columns, selectable, onSelectionChange, }: DataTableProps<T>): import("react/jsx-runtime").JSX.Element;
