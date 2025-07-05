import type { ReactNode } from "react";
import "../globals.css";
export default function LocaleLayout({ children, params, }: {
    children: ReactNode;
    /** `[lang]` is now an *optional catch-all*, so the param is `string[] | undefined` */
    params: Promise<{
        lang?: string[];
    }>;
}): Promise<import("react/jsx-runtime").JSX.Element>;
