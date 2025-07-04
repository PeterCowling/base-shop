import { ProductPublication } from "@platform-core/products";
import { ReactElement } from "react";
interface Props {
    shop: string;
    rows: ProductPublication[];
    isAdmin: boolean;
}
declare function ProductsTableBase({ shop, rows, isAdmin }: Props): ReactElement;
declare const _default: import("react").MemoExoticComponent<typeof ProductsTableBase>;
export default _default;
