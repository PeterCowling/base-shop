import type { ProductPublication } from "@acme/types";
interface Props {
    shop: string;
    product: ProductPublication;
    onDuplicate(id: string): void;
    onDelete(id: string): void;
}
export default function ProductRowActions({ shop, product, onDuplicate, onDelete, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ProductRowActions.d.ts.map