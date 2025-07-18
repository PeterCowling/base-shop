import type { ComponentProps } from "react";
/**
 * Basic, unopinionated table primitives (shadcn-ui style).
 * Each component forwards props / className so you can style with Tailwind.
 */
export declare function Table({ className, ...props }: ComponentProps<"table">): import("react/jsx-runtime").JSX.Element;
export declare function TableHeader({ className, ...props }: ComponentProps<"thead">): import("react/jsx-runtime").JSX.Element;
export declare function TableBody({ className, ...props }: ComponentProps<"tbody">): import("react/jsx-runtime").JSX.Element;
export declare function TableRow({ className, ...props }: ComponentProps<"tr">): import("react/jsx-runtime").JSX.Element;
export declare function TableHead({ className, ...props }: ComponentProps<"th">): import("react/jsx-runtime").JSX.Element;
export declare function TableCell({ className, ...props }: ComponentProps<"td">): import("react/jsx-runtime").JSX.Element;
