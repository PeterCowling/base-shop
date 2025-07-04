import * as React from "react";
export interface PaginationControlProps extends React.HTMLAttributes<HTMLDivElement> {
    page: number;
    pageCount: number;
    onPageChange?: (page: number) => void;
}
export declare function PaginationControl({ page, pageCount, onPageChange, className, ...props }: PaginationControlProps): React.JSX.Element;
export declare namespace PaginationControl {
    var displayName: string;
}
