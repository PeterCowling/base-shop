import type { HTMLAttributes } from "react";
type Props = HTMLAttributes<HTMLDivElement> & {
    sideWidth?: "w-48" | "w-56" | "w-64" | "w-72" | "w-80";
    gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8;
    reverse?: boolean;
};
export declare function Sidebar({ sideWidth, gap, reverse, className, children, ...rest }: Props): import("react").JSX.Element;
export {};
