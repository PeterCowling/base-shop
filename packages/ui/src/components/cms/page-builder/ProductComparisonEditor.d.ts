import type { PageComponentBase } from "@acme/types";
type ProductComparisonComponent = PageComponentBase & {
    type: "ProductComparison";
    skus?: string[];
    attributes?: string[];
};
interface Props {
    component: ProductComparisonComponent;
    onChange: (patch: Partial<ProductComparisonComponent>) => void;
}
export default function ProductComparisonEditor({ component, onChange }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ProductComparisonEditor.d.ts.map