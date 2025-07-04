import { ReactNode } from "react";
export type Theme = "base" | "dark" | "brandx";
interface ThemeContextValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}
export declare function ThemeProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useTheme(): ThemeContextValue;
export {};
