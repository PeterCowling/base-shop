import { type ReactNode } from "react";

export interface ConfiguratorProgress {
    completedRequired: number;
    totalRequired: number;
    completedOptional: number;
    totalOptional: number;
}
export interface LayoutContextValue {
    isMobileNavOpen: boolean;
    breadcrumbs: string[];
    toggleNav: () => void;
    configuratorProgress?: ConfiguratorProgress;
    setConfiguratorProgress: (p?: ConfiguratorProgress) => void;
}
export declare function LayoutProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useLayout(): LayoutContextValue;
