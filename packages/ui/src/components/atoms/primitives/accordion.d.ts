import { type ButtonHTMLAttributes, type HTMLAttributes } from "react";
type AccordionType = "single" | "multiple";
export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
    readonly type?: AccordionType;
    readonly defaultValue?: string | string[];
    readonly collapsible?: boolean;
}
export declare function Accordion({ type, defaultValue, collapsible, children, className, ...props }: AccordionProps): import("react").JSX.Element;
export interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
    readonly value: string;
}
export declare const AccordionItem: import("react").ForwardRefExoticComponent<AccordionItemProps & import("react").RefAttributes<HTMLDivElement>>;
export type AccordionTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>;
export declare const AccordionTrigger: import("react").ForwardRefExoticComponent<AccordionTriggerProps & import("react").RefAttributes<HTMLButtonElement>>;
export type AccordionContentProps = HTMLAttributes<HTMLDivElement>;
export declare const AccordionContent: import("react").ForwardRefExoticComponent<AccordionContentProps & import("react").RefAttributes<HTMLDivElement>>;
export {};
