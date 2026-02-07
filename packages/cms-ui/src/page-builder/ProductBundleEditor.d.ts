import type { PageComponentBase } from "@acme/types";
type ProductBundleComponent = PageComponentBase & {
    type: "ProductBundle";
    skus?: string[];
    discount?: number;
    quantity?: number;
};
interface Props {
    component: ProductBundleComponent;
    onChange: (patch: Partial<ProductBundleComponent>) => void;
}
export default function ProductBundleEditor({ component, onChange }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ProductBundleEditor.d.ts.map