/// <reference types="react" />
import { ProductPublication } from "@platform-core/products";
interface Props {
    shop: string;
    product: ProductPublication;
    onDuplicate(id: string): void;
    onDelete(id: string): void;
}
export default function ProductRowActions({ shop, product, onDuplicate, onDelete, }: Props): import("react").JSX.Element;
export {};
