import { type ReactNode } from "react";

export type Theme = "base" | "dark" | "brandx" | "system";
interface ThemeContextValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}
export declare function getSavedTheme(): Theme | null;
export declare function ThemeProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useTheme(): ThemeContextValue;
export {};
