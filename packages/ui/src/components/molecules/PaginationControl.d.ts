import * as React from "react";
export interface PaginationControlProps extends React.HTMLAttributes<HTMLDivElement> {
    page: number;
    pageCount: number;
    onPageChange?: (page: number) => void;
}
export declare function PaginationControl({ page, pageCount, onPageChange, className, ...props }: PaginationControlProps): import("react/jsx-runtime").JSX.Element;
export declare namespace PaginationControl {
    var displayName: string;
}
//# sourceMappingURL=PaginationControl.d.ts.map