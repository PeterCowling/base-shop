import { ReactNode } from "react";
export interface Column<T> {
    header: string;
    render: (row: T) => ReactNode;
    width?: string;
}
export default function DataTable<T>({ rows, columns, }: {
    rows: T[];
    columns: Column<T>[];
}): import("react").JSX.Element;
