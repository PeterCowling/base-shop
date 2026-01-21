import { type ReactNode } from "react";

export type Currency = "AUD" | "EUR" | "USD" | "GBP";
export declare function CurrencyProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useCurrency(): [Currency, (c: Currency) => void];
