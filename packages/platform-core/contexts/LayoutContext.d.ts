import { ReactNode } from "react";
export interface LayoutContextValue {
    isMobileNavOpen: boolean;
    breadcrumbs: string[];
    toggleNav: () => void;
}
export declare function LayoutProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useLayout(): LayoutContextValue;
