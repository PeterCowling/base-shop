import { type ReactNode, type HTMLAttributes, type ButtonHTMLAttributes } from "react";
export interface AccordionItemConfig {
    title: ReactNode;
    content: ReactNode;
}
export type LegacyAccordionProps = {
    items: AccordionItemConfig[];
    className?: string;
};
export type AccordionSingleProps = {
    type?: "single";
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string | undefined) => void;
    collapsible?: boolean;
    className?: string;
    children: ReactNode;
};
export type AccordionMultipleProps = {
    type: "multiple";
    defaultValue?: string[];
    value?: string[];
    onValueChange?: (value: string[]) => void;
    className?: string;
    children: ReactNode;
};
export type AccordionProps = LegacyAccordionProps | AccordionSingleProps | AccordionMultipleProps;
export declare function Accordion(props: AccordionProps): import("react/jsx-runtime").JSX.Element;
export interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
    value: string;
    disabled?: boolean;
    children: ReactNode;
}
export declare function AccordionItem(props: AccordionItemProps): import("react/jsx-runtime").JSX.Element;
export interface AccordionTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
}
export declare function AccordionTrigger(props: AccordionTriggerProps): import("react/jsx-runtime").JSX.Element;
export interface AccordionContentProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}
export declare function AccordionContent(props: AccordionContentProps): import("react/jsx-runtime").JSX.Element;
export default Accordion;
//# sourceMappingURL=Accordion.d.ts.map
