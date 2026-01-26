import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
    gap?: 1 | 2 | 3 | 4 | 5 | 6;
    alignY?: "start" | "center" | "end";
    justify?: "start" | "center" | "end" | "between";
    wrap?: boolean;
};
export declare function Cluster({ gap, alignY, justify, wrap, className, ...rest }: Props): import("react").JSX.Element;
export {};
