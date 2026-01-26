import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
    minH?: "screen" | "[60vh]" | "[80vh]";
    center?: ReactNode;
};
export declare function Cover({ minH, center, className, children, style: _style, ...rest }: Props): import("react").JSX.Element;
export {};
