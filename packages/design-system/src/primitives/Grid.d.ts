import type { HTMLAttributes } from "react";
type Props = HTMLAttributes<HTMLDivElement> & {
    cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
    gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
};
export declare function Grid({ cols, gap, className, ...rest }: Props): import("react").JSX.Element;
export {};
