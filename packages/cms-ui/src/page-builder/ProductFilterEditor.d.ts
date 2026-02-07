import type { PageComponentBase } from "@acme/types";
type ProductFilterComponent = PageComponentBase & {
    type: "ProductFilter";
    showSize?: boolean;
    showColor?: boolean;
    showPrice?: boolean;
};
interface Props {
    component: ProductFilterComponent;
    onChange: (patch: Partial<ProductFilterComponent>) => void;
}
export default function ProductFilterEditor({ component, onChange }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ProductFilterEditor.d.ts.map