export interface Plan {
    title: string;
    price: string;
    features: string[];
    ctaLabel: string;
    ctaHref: string;
    featured?: boolean;
}
interface Props {
    plans?: Plan[];
    minItems?: number;
    maxItems?: number;
}
export default function PricingTable({ plans, minItems, maxItems, }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=PricingTable.d.ts.map