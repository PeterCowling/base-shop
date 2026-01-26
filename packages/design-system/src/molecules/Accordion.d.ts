import { type ReactNode } from "react";

export interface AccordionItem {
    title: ReactNode;
    content: ReactNode;
}
export interface AccordionProps {
    items: AccordionItem[];
}
export declare function Accordion({ items }: AccordionProps): import("react/jsx-runtime").JSX.Element;
export default Accordion;
//# sourceMappingURL=Accordion.d.ts.map