interface FAQItem {
    question: string;
    answer: string;
}
interface Props {
    items?: FAQItem[];
    minItems?: number;
    maxItems?: number;
}
export default function FAQBlock({ items, minItems, maxItems, }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=FAQBlock.d.ts.map