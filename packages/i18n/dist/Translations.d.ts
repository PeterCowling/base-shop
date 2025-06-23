import { ReactNode } from "react";
type Messages = Record<string, string>;
export declare function TranslationsProvider({ children, messages, }: {
    children: ReactNode;
    messages: Messages;
}): import("react").JSX.Element;
export declare function useTranslations(): (key: string) => string;
export {};
