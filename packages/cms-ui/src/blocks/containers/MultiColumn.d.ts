import type { ReactNode } from "react";
export interface MultiColumnProps {
    children?: ReactNode;
    /** Number of columns in the grid */
    columns?: number;
    /** Gap between columns/rows (any CSS length) */
    gap?: string;
    className?: string;
}
export default function MultiColumn({ children, columns, gap, className, }: MultiColumnProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=MultiColumn.d.ts.map