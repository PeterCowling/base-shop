import * as React from "react";
export interface TooltipProps {
    text: string;
    children: React.ReactNode;
    className?: string;
}
export declare const Tooltip: ({ text, children, className }: TooltipProps) => React.JSX.Element;
