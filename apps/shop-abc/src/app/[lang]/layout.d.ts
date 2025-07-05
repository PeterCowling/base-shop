import type { ReactNode } from "react";
import "../globals.css";
export default function LocaleLayout({ children, params, }: {
    children: ReactNode;
    /**
     * Next 15 provides `params` as a Promise.
     * `[lang]` is optional so it may be `undefined`.
     */
    params: Promise<{
        lang?: string;
    }>;
}): Promise<import("react/jsx-runtime").JSX.Element>;
